import { getDbPool, sql } from '../config/db.js';
import { emitOrderCreated, emitOrderStatusUpdated } from '../socket/socketHandler.js';
import { createMoMoPayment } from '../services/momoService.js';
import { notifyOrderCreated, notifyOrderStatusUpdated } from '../services/notificationService.js';

export async function createOrder(req, res) {
  try {
    const {
      address,
      items,
      totalAmount,
      subtotalAmount,
      discountAmount,
      shippingFee,
      voucherCode,
      paymentMethod,
      customerNote,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng đang trống' });
    }

    const pool = await getDbPool();

    // Kiểm tra trạng thái của quán: Khi quán tạm ngừng thì từ chối nhận đơn
    try {
      const storeRes = await pool.request().query('SELECT TOP 1 is_accepting_orders FROM store_settings');
      if (storeRes.recordset.length > 0 && storeRes.recordset[0].is_accepting_orders === false) {
        return res.status(400).json({
          success: false,
          message: 'Quán hiện đang tạm ngừng nhận đơn trực tuyến. Xin lỗi quý khách vì sự bất tiện này!',
        });
      }
    } catch (storeErr) {
      console.warn('[Order] Check store status error:', storeErr.message);
    }

    const today = new Date().toISOString().slice(0, 10);
    const customerId = req.user?.id || req.body.customerId || req.body.currentUser?.id || 3;

    // 1. Generate daily queue number and order code via Stored Procedure or atomic fallback
    let queueNumber = 'A001';
    let orderCode = `ANT-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const spReq = pool.request();
      spReq.input('p_date', sql.Date, today);
      spReq.output('p_queue_number', sql.VarChar(10));
      spReq.output('p_order_code', sql.VarChar(30));
      const spRes = await spReq.execute('sp_generate_daily_queue_number');
      if (spRes.output.p_queue_number) {
        queueNumber = spRes.output.p_queue_number;
      }
      if (spRes.output.p_order_code) {
        // Keep user friendly short code like ANT-9021 or the generated code
        orderCode = `ANT-${Math.floor(1000 + Math.random() * 9000)}`;
      }
    } catch (spErr) {
      console.warn('[Order] sp_generate_daily_queue_number fallback:', spErr.message);
      // Fallback: query max sequence today
      const seqRes = await pool.request()
        .input('today', sql.Date, today)
        .query(`
          IF EXISTS (SELECT 1 FROM daily_sequences WHERE seq_date = @today)
          BEGIN
            UPDATE daily_sequences SET current_number = current_number + 1 OUTPUT INSERTED.current_number WHERE seq_date = @today;
          END
          ELSE
          BEGIN
            INSERT INTO daily_sequences (seq_date, current_number) OUTPUT INSERTED.current_number VALUES (@today, 1);
          END
        `);
      const nextNum = seqRes.recordset[0]?.current_number || Math.floor(Math.random() * 100);
      queueNumber = 'A' + String(nextNum).padStart(3, '0');
    }

    const recipientName = address?.recipient_name || req.user?.name || 'Khách hàng';
    const recipientPhone = address?.phone || req.user?.phone || '0901 234 567';
    const shippingAddress = address?.address_detail || '123 Nguyễn Huệ, P. Bến Nghé, Q.1';

    const subtotal = Number(subtotalAmount) || (Number(totalAmount) - (Number(shippingFee) || 0) + (Number(discountAmount) || 0));
    const discount = Number(discountAmount) || 0;
    const shipping = Number(shippingFee) !== undefined ? Number(shippingFee) : 15000;
    const finalTotal = Number(totalAmount) || (subtotal - discount + shipping);

    const paymentStatus = 'UNPAID';
    const paymentMethodFormatted = paymentMethod === 'MOMO' ? 'MOMO' : paymentMethod === 'BANK' ? 'BANK_TRANSFER' : 'CASH';

    // 2. Insert into orders table
    const orderInsertReq = pool.request();
    orderInsertReq.input('order_code', sql.VarChar(30), orderCode);
    orderInsertReq.input('order_date', sql.Date, today);
    orderInsertReq.input('daily_queue_number', sql.VarChar(10), queueNumber);
    orderInsertReq.input('customer_id', sql.BigInt, customerId);
    orderInsertReq.input('total_items_qty', sql.Int, items.reduce((s, it) => s + (it.quantity || 1), 0));
    orderInsertReq.input('subtotal_amount', sql.BigInt, subtotal);
    orderInsertReq.input('voucher_code', sql.VarChar(30), voucherCode || null);
    orderInsertReq.input('discount_amount', sql.BigInt, discount);
    orderInsertReq.input('shipping_fee', sql.BigInt, shipping);
    orderInsertReq.input('total_amount', sql.BigInt, finalTotal);
    orderInsertReq.input('payment_method', sql.VarChar(30), paymentMethodFormatted);
    orderInsertReq.input('payment_status', sql.VarChar(20), paymentStatus);
    orderInsertReq.input('recipient_name', sql.NVarChar(100), recipientName);
    orderInsertReq.input('recipient_phone', sql.VarChar(15), recipientPhone);
    orderInsertReq.input('shipping_address', sql.NVarChar(500), shippingAddress);
    orderInsertReq.input('customer_note', sql.NVarChar(500), customerNote || null);
    orderInsertReq.input('estimated_delivery', sql.NVarChar(50), '15 - 25 phút');

    const orderResult = await orderInsertReq.query(`
      INSERT INTO orders (
        order_code, order_date, daily_queue_number, customer_id,
        order_type, status, total_items_qty, subtotal_amount, voucher_code,
        discount_amount, shipping_fee, total_amount, payment_method, payment_status,
        recipient_name, recipient_phone, shipping_address, customer_note, estimated_delivery
      )
      OUTPUT INSERTED.id, INSERTED.order_code, INSERTED.daily_queue_number, INSERTED.status, INSERTED.created_at
      VALUES (
        @order_code, @order_date, @daily_queue_number, @customer_id,
        'DELIVERY', 'PENDING', @total_items_qty, @subtotal_amount, @voucher_code,
        @discount_amount, @shipping_fee, @total_amount, @payment_method, @payment_status,
        @recipient_name, @recipient_phone, @shipping_address, @customer_note, @estimated_delivery
      )
    `);

    const createdOrderRecord = orderResult.recordset[0];
    const orderId = createdOrderRecord.id;

    // 3. Insert order items snapshots
    const formattedItems = [];
    for (const it of items) {
      const prodId = it.product?.id || it.product_id || 101;
      const prodName = it.product?.name || it.name || 'Món đồ uống';
      const prodSku = it.product?.sku || `SKU-${prodId}`;
      const prodImg = it.product?.image || it.image || null;
      const basePrice = it.product?.base_price || it.price || 35000;
      const qty = it.quantity || 1;
      const unitFinalPrice = it.unitPrice || it.price || it.totalPrice / qty || basePrice;
      const lineTotal = it.totalPrice || (unitFinalPrice * qty);
      const optionsText = it.options || `${it.selectedSize?.name || 'Size S'}${it.selectedIce?.name ? ', ' + it.selectedIce.name : ''}${it.selectedSugar?.name ? ', ' + it.selectedSugar.name : ''}${it.selectedToppings?.length ? ', +' + it.selectedToppings.map(t => t.name).join(', ') : ''}`;
      const optionsJson = JSON.stringify({
        size: it.selectedSize,
        ice: it.selectedIce,
        sugar: it.selectedSugar,
        toppings: it.selectedToppings,
      });

      await pool.request()
        .input('order_id', sql.BigInt, orderId)
        .input('product_id', sql.BigInt, prodId)
        .input('sku', sql.VarChar(50), prodSku)
        .input('name', sql.NVarChar(150), prodName)
        .input('image', sql.VarChar(500), prodImg)
        .input('base_price', sql.BigInt, basePrice)
        .input('options_json', sql.NVarChar(sql.MAX), optionsJson)
        .input('options_summary', sql.NVarChar(500), optionsText || '')
        .input('quantity', sql.Int, qty)
        .input('unit_price', sql.BigInt, unitFinalPrice)
        .input('line_total', sql.BigInt, lineTotal)
        .input('note', sql.NVarChar(255), it.note || null)
        .query(`
          INSERT INTO order_items (
            order_id, product_id, product_sku_snapshot, product_name_snapshot,
            product_image_snapshot, base_price_snapshot, options_snapshot, options_summary_text,
            quantity, unit_final_price, line_total_amount, item_note
          )
          VALUES (
            @order_id, @product_id, @sku, @name,
            @image, @base_price, @options_json, @options_summary,
            @quantity, @unit_price, @line_total, @note
          )
        `);

      formattedItems.push({
        name: prodName,
        quantity: qty,
        price: unitFinalPrice,
        totalPrice: lineTotal,
        options: optionsText,
      });
    }

    // 4. Update voucher used count if applied
    if (voucherCode) {
      await pool.request()
        .input('vCode', sql.VarChar(30), voucherCode)
        .query('UPDATE vouchers SET used_count = used_count + 1 WHERE code = @vCode');
    }

    // 4.1. If paymentMethod is MOMO, initiate MoMo payment session
    let momoPayment = null;
    if (paymentMethod === 'MOMO') {
      try {
        momoPayment = await createMoMoPayment({
          orderCode,
          amount: finalTotal,
          orderInfo: `Thanh toán Ant Coffee cho đơn #${orderCode}`,
        });
      } catch (momoErr) {
        console.error('[Order] MoMo payment session initiation error:', momoErr.message);
      }
    }

    // Construct full order object matching frontend state structure
    const completeOrder = {
      id: Number(orderId),
      orderCode: orderCode,
      order_code: orderCode,
      sequence_number: queueNumber,
      daily_queue_number: queueNumber,
      status: 'PENDING',
      customer_id: customerId,
      customer_name: recipientName,
      phone: recipientPhone,
      address: shippingAddress,
      created_at: 'Vừa xong',
      estimated_delivery: '15 - 25 phút',
      items: formattedItems,
      total_amount: finalTotal,
      subtotal_amount: subtotal,
      discount_amount: discount,
      shipping_fee: shipping,
      payment_status: paymentStatus,
      payment_method: paymentMethod === 'MOMO' ? 'Ví MoMo' : paymentMethod === 'BANK' ? 'VietQR' : 'Tiền mặt khi nhận',
      driver: null,
      momoPayment: momoPayment,
    };

    // 5. Broadcast real-time WebSocket event
    emitOrderCreated(completeOrder);

    // 6. Automatically send push notification for Order Created (Requirement A.2)
    notifyOrderCreated(completeOrder).catch(err => {
      console.warn('[Push Notification] notifyOrderCreated background error:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: paymentMethod === 'MOMO' ? 'Đã tạo đơn hàng & tạo liên kết MoMo thành công!' : 'Đặt hàng thành công!',
      data: completeOrder,
      momoPayment: momoPayment,
    });
  } catch (error) {
    console.error('[Order] createOrder error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tạo đơn hàng', error: error.message });
  }
}

export async function getAllOrders(req, res) {
  try {
    const { status, limit } = req.query;
    const pool = await getDbPool();

    let query = `
      SELECT 
        o.id, o.order_code, o.order_date, o.daily_queue_number, o.customer_id,
        o.order_type, o.status, o.total_items_qty, o.subtotal_amount, o.discount_amount,
        o.shipping_fee, o.total_amount, o.payment_method, o.payment_status,
        o.recipient_name, o.recipient_phone, o.shipping_address, o.customer_note,
        o.driver_name, o.driver_phone, o.driver_vehicle, o.estimated_delivery,
        o.created_at, o.confirmed_at, o.ready_at, o.completed_at
      FROM orders o
      WHERE 1=1
    `;

    const request = pool.request();
    if (status) {
      query += ` AND o.status = @status`;
      request.input('status', sql.VarChar(20), status);
    }

    query += ` ORDER BY o.id DESC`;

    const ordersRes = await request.query(query);

    // Fetch items for these orders
    const orderIds = ordersRes.recordset.map(o => o.id);
    let itemsMap = {};

    if (orderIds.length > 0) {
      const itemsRes = await pool.request().query(`
        SELECT 
          order_id, product_name_snapshot as name, quantity, unit_final_price as price,
          line_total_amount as totalPrice, options_summary_text as options, item_note
        FROM order_items
        WHERE order_id IN (${orderIds.join(',')})
      `);

      for (const it of itemsRes.recordset) {
        if (!itemsMap[it.order_id]) itemsMap[it.order_id] = [];
        itemsMap[it.order_id].push({
          name: it.name,
          quantity: it.quantity,
          price: Number(it.price),
          totalPrice: Number(it.totalPrice),
          options: it.options,
          note: it.item_note,
        });
      }
    }

    const orders = ordersRes.recordset.map(o => {
      let driver = null;
      if (o.driver_name) {
        driver = {
          name: o.driver_name,
          phone: o.driver_phone,
          vehicle: o.driver_vehicle,
        };
      }

      return {
        id: Number(o.id),
        orderCode: o.order_code,
        order_code: o.order_code,
        sequence_number: o.daily_queue_number,
        daily_queue_number: o.daily_queue_number,
        status: o.status,
        customer_id: Number(o.customer_id),
        customer_name: o.recipient_name,
        phone: o.recipient_phone,
        address: o.shipping_address,
        created_at: formatRelativeTime(o.created_at),
        estimated_delivery: o.estimated_delivery || '15-25 phút',
        items: itemsMap[o.id] || [],
        total_amount: Number(o.total_amount),
        payment_status: o.payment_status,
        payment_method: o.payment_method === 'MOMO' ? 'MoMo E-Wallet' : o.payment_method === 'BANK_TRANSFER' ? 'VietQR' : 'Tiền mặt',
        driver,
      };
    });

    return res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('[Order] getAllOrders error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải danh sách đơn hàng' });
  }
}

export async function getMyOrders(req, res) {
  try {
    const customerId = req.user?.id || req.query.customerId || req.query.userId;
    const phone = req.query.phone || req.user?.phone;

    if (!customerId && !phone) {
      // Yêu cầu bảo mật: Chưa đăng nhập không được xem đơn hàng của ai cả
      return res.json({
        success: true,
        data: [],
      });
    }

    const pool = await getDbPool();
    const reqDb = pool.request();
    let query = `
      SELECT 
        o.id, o.order_code, o.daily_queue_number, o.status, o.total_amount,
        o.payment_method, o.payment_status, o.recipient_name, o.recipient_phone,
        o.shipping_address, o.driver_name, o.driver_phone, o.driver_vehicle,
        o.estimated_delivery, o.created_at, o.customer_id
      FROM orders o
      WHERE 1=1
    `;

    if (customerId) {
      query += ` AND o.customer_id = @customerId`;
      reqDb.input('customerId', sql.BigInt, customerId);
    } else if (phone) {
      query += ` AND o.recipient_phone = @phone`;
      reqDb.input('phone', sql.VarChar(15), phone);
    }

    query += ` ORDER BY o.id DESC`;

    const ordersRes = await reqDb.query(query);

    const orderIds = ordersRes.recordset.map(o => o.id);
    let itemsMap = {};

    if (orderIds.length > 0) {
      const itemsRes = await pool.request().query(`
        SELECT order_id, product_name_snapshot as name, quantity, unit_final_price as price,
               line_total_amount as totalPrice, options_summary_text as options
        FROM order_items
        WHERE order_id IN (${orderIds.join(',')})
      `);

      for (const it of itemsRes.recordset) {
        if (!itemsMap[it.order_id]) itemsMap[it.order_id] = [];
        itemsMap[it.order_id].push({
          name: it.name,
          quantity: it.quantity,
          price: Number(it.price),
          totalPrice: Number(it.totalPrice),
          options: it.options,
        });
      }
    }

    const orders = ordersRes.recordset.map(o => ({
      id: Number(o.id),
      orderCode: o.order_code,
      sequence_number: o.daily_queue_number,
      status: o.status,
      customer_name: o.recipient_name,
      phone: o.recipient_phone,
      address: o.shipping_address,
      created_at: formatRelativeTime(o.created_at),
      estimated_delivery: o.estimated_delivery || '15-25 phút',
      items: itemsMap[o.id] || [],
      total_amount: Number(o.total_amount),
      payment_status: o.payment_status,
      payment_method: o.payment_method === 'MOMO' ? 'MoMo E-Wallet' : o.payment_method === 'BANK_TRANSFER' ? 'VietQR' : 'Tiền mặt',
      driver: o.driver_name ? { name: o.driver_name, phone: o.driver_phone, vehicle: o.driver_vehicle } : null,
    }));

    return res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('[Order] getMyOrders error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải lịch sử đơn hàng' });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, cancel_reason } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái đơn hàng không hợp lệ' });
    }

    const pool = await getDbPool();
    const staffId = req.user?.id || 2;

    let timestampColumn = '';
    if (status === 'CONFIRMED') timestampColumn = ', confirmed_at = SYSDATETIME(), staff_id = @staffId';
    else if (status === 'READY') timestampColumn = ', ready_at = SYSDATETIME()';
    else if (status === 'COMPLETED') timestampColumn = `, completed_at = SYSDATETIME(), payment_status = 'PAID'`;
    else if (status === 'CANCELLED') timestampColumn = `, cancelled_at = SYSDATETIME(), cancelled_by = @staffId, cancel_reason = @cancelReason`;

    const request = pool.request();
    request.input('id', sql.BigInt, Number(id));
    request.input('status', sql.VarChar(20), status);
    request.input('staffId', sql.BigInt, staffId);
    request.input('cancelReason', sql.NVarChar(255), cancel_reason || null);

    const updateQuery = `
      UPDATE orders
      SET status = @status,
          version = version + 1
          ${timestampColumn}
      WHERE id = @id;

      SELECT * FROM orders WHERE id = @id;
    `;

    const result = await request.query(updateQuery);
    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    const updated = result.recordset[0];

    // Build payload to broadcast
    const broadcastOrder = {
      id: Number(updated.id),
      orderCode: updated.order_code,
      order_code: updated.order_code,
      sequence_number: updated.daily_queue_number,
      daily_queue_number: updated.daily_queue_number,
      status: updated.status,
      customer_id: Number(updated.customer_id),
      customer_name: updated.recipient_name,
      phone: updated.recipient_phone,
      address: updated.shipping_address,
      total_amount: Number(updated.total_amount),
      payment_status: updated.payment_status,
      cancel_reason: updated.cancel_reason,
    };

    emitOrderStatusUpdated(broadcastOrder);

    // Automatically send push notification for Order Status Updated (Requirement A.2)
    notifyOrderStatusUpdated(broadcastOrder).catch(err => {
      console.warn('[Push Notification] notifyOrderStatusUpdated background error:', err.message);
    });

    return res.json({
      success: true,
      message: `Đơn hàng đã chuyển sang trạng thái ${status}`,
      data: broadcastOrder,
    });
  } catch (error) {
    console.error('[Order] updateOrderStatus error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái đơn hàng' });
  }
}

function formatRelativeTime(date) {
  if (!date) return 'Hôm nay';
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} Hôm nay`;
}
