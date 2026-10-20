import { getDbPool, sql } from '../config/db.js';
import { 
  createMoMoPayment as momoCreatePayment, 
  verifyMoMoIpnSignature, 
  queryMoMoPaymentStatus 
} from '../services/momoService.js';
import { emitOrderPaymentUpdated, emitOrderStatusUpdated } from '../socket/socketHandler.js';

/**
 * 1. Khởi tạo thanh toán MoMo cho đơn hàng
 * POST /api/v1/payment/momo/create
 */
export async function createPayment(req, res) {
  try {
    const { orderCode, orderId, amount, orderInfo, redirectUrl, ipnUrl } = req.body;

    let targetOrderCode = orderCode;
    let targetAmount = amount;

    // Nếu truyền orderId hoặc orderCode, tra cứu trong DB để lấy thông tin chính xác
    if (orderId || orderCode) {
      const pool = await getDbPool();
      const dbReq = pool.request();
      if (orderId) {
        dbReq.input('id', sql.BigInt, orderId);
      }
      if (orderCode) {
        dbReq.input('code', sql.VarChar(30), orderCode);
      }

      const q = orderId 
        ? 'SELECT id, order_code, total_amount, payment_status FROM orders WHERE id = @id'
        : 'SELECT id, order_code, total_amount, payment_status FROM orders WHERE order_code = @code';

      const result = await dbReq.query(q);
      if (result.recordset.length > 0) {
        const ord = result.recordset[0];
        targetOrderCode = ord.order_code;
        targetAmount = Number(ord.total_amount);

        if (ord.payment_status === 'PAID') {
          return res.status(400).json({
            success: false,
            message: 'Đơn hàng này đã được thanh toán trước đó.',
          });
        }
      }
    }

    if (!targetOrderCode || !targetAmount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin mã đơn hàng (orderCode) hoặc tổng tiền (amount).',
      });
    }

    const paymentResult = await momoCreatePayment({
      orderCode: targetOrderCode,
      amount: targetAmount,
      orderInfo: orderInfo || `Thanh toán Ant Coffee cho đơn ${targetOrderCode}`,
      redirectUrl,
      ipnUrl,
    });

    return res.status(200).json({
      success: true,
      message: 'Khởi tạo giao dịch MoMo thành công',
      data: paymentResult,
    });
  } catch (error) {
    console.error('[PaymentController] createPayment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi khởi tạo thanh toán MoMo',
      error: error.message,
    });
  }
}

/**
 * 2. Xử lý IPN Webhook từ cổng MoMo (Server-to-Server)
 * POST /api/v1/payment/momo/ipn
 */
export async function handleMoMoIPN(req, res) {
  try {
    const ipnBody = req.body;
    console.log('[PaymentController] IPN Received from MoMo:', JSON.stringify(ipnBody));

    // 1. Kiểm tra chữ ký bảo mật HMAC-SHA256
    const isSignatureValid = verifyMoMoIpnSignature(ipnBody);
    if (!isSignatureValid) {
      console.warn('[PaymentController] MoMo IPN signature invalid!');
      return res.status(400).json({
        resultCode: 99,
        message: 'Invalid signature',
      });
    }

    const { orderId, resultCode, transId, message } = ipnBody;
    
    // orderId có dạng `${orderCode}_${timestamp}` hoặc `${orderCode}`
    const orderCode = String(orderId).split('_')[0];

    // 2. Nếu thanh toán thành công (resultCode === 0)
    if (Number(resultCode) === 0) {
      const pool = await getDbPool();
      
        await pool.request()
        .input('orderCode', sql.VarChar(30), orderCode)
        .input('transId', sql.VarChar(100), String(transId || 'MOMO_' + Date.now()))
        .query(`
          UPDATE orders 
          SET 
            payment_status = 'PAID',
            payment_method = 'MOMO',
            payment_transaction_ref = @transId
          WHERE order_code = @orderCode;
        `);

      const updateRes = await pool.request()
        .input('orderCode', sql.VarChar(30), orderCode)
        .query(`
          SELECT 
            id, order_code, daily_queue_number, status, 
            payment_status, payment_method, payment_transaction_ref, 
            total_amount, customer_id
          FROM orders 
          WHERE order_code = @orderCode;
        `);

      if (updateRes.recordset.length > 0) {
        const updatedOrder = updateRes.recordset[0];
        console.log(`[PaymentController] Order #${orderCode} updated to PAID successfully via MoMo IPN.`);

        // 3. Phát sự kiện WebSocket theo thời gian thực
        emitOrderPaymentUpdated(updatedOrder);
        emitOrderStatusUpdated(updatedOrder);
      } else {
        console.warn(`[PaymentController] Order #${orderCode} not found in database to update.`);
      }
    } else {
      console.log(`[PaymentController] MoMo payment failed or cancelled for order #${orderCode}: code ${resultCode} - ${message}`);
    }

    // MoMo quy ước phản hồi lại HTTP 204 hoặc 200 với JSON
    return res.status(200).json({
      partnerCode: ipnBody.partnerCode,
      orderId: ipnBody.orderId,
      resultCode: 0,
      message: 'Acknowledged',
    });
  } catch (error) {
    console.error('[PaymentController] IPN Handler error:', error);
    return res.status(500).json({
      resultCode: 99,
      message: error.message,
    });
  }
}

/**
 * 3. Xử lý Callback chuyển hướng khách hàng sau khi thanh toán
 * GET /api/v1/payment/momo/callback
 */
export async function handleMoMoCallback(req, res) {
  try {
    const { orderId, resultCode, message } = req.query;
    const isSuccess = Number(resultCode) === 0;
    const orderCode = orderId ? String(orderId).split('_')[0] : 'ANT';

    // Trả về trang HTML thông báo kết quả thân thiện
    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kết quả thanh toán MoMo - Ant Coffee</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0E0F12; color: #FFF; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #181920; border-radius: 20px; padding: 32px 24px; max-width: 420px; width: 100%; text-align: center; border: 1px solid #2B2D3A; box-shadow: 0 12px 40px rgba(0,0,0,0.5); }
          .icon { width: 72px; height: 72px; border-radius: 36px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 36px; }
          .icon.success { background: #1B382B; color: #22C55E; border: 2px solid #22C55E; }
          .icon.fail { background: #3B1E1E; color: #EF4444; border: 2px solid #EF4444; }
          h2 { margin: 0 0 10px; font-size: 22px; }
          p { color: #9E9EA7; margin: 0 0 24px; font-size: 15px; line-height: 1.5; }
          .btn { display: inline-block; background: #A50064; color: #FFF; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 16px; transition: opacity 0.2s; }
          .btn:hover { opacity: 0.9; }
          .meta { font-size: 13px; color: #6C6C75; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon ${isSuccess ? 'success' : 'fail'}">${isSuccess ? '✓' : '✕'}</div>
          <h2>${isSuccess ? 'Thanh toán MoMo thành công!' : 'Thanh toán chưa hoàn tất'}</h2>
          <p>${isSuccess ? `Đơn hàng <strong>${orderCode}</strong> đã được thanh toán thành công qua Ví MoMo. Ant Coffee đang chuẩn bị món cho bạn!` : (message || 'Giao dịch bị hủy hoặc không thành công.')}</p>
          <a class="btn" href="javascript:window.close();">Quay lại Ant Coffee App</a>
          <div class="meta">Mã đơn: ${orderCode}</div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error) {
    return res.status(500).send('Lỗi xử lý kết quả thanh toán');
  }
}

/**
 * 4. Tra cứu trạng thái thanh toán của đơn hàng
 * GET /api/v1/payment/momo/status/:orderCode
 */
export async function queryPaymentStatus(req, res) {
  try {
    const { orderCode } = req.params;
    const pool = await getDbPool();

    const orderRes = await pool.request()
      .input('orderCode', sql.VarChar(30), orderCode)
      .query(`
        SELECT 
          id, order_code, daily_queue_number, status, total_amount,
          payment_method, payment_status, payment_transaction_ref, created_at
        FROM orders 
        WHERE order_code = @orderCode
      `);

    if (orderRes.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy đơn hàng #${orderCode}`,
      });
    }

    const order = orderRes.recordset[0];

    return res.status(200).json({
      success: true,
      data: {
        orderCode: order.order_code,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        transactionRef: order.payment_transaction_ref,
        isPaid: order.payment_status === 'PAID',
        totalAmount: Number(order.total_amount),
        order,
      },
    });
  } catch (error) {
    console.error('[PaymentController] queryPaymentStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi tra cứu thanh toán',
      error: error.message,
    });
  }
}

/**
 * 5. Giả lập thanh toán MoMo thành công (Sandbox / Development Helper)
 * Cho phép kiểm thử toàn bộ luồng thanh toán MoMo mà không bắt buộc có IP tĩnh / webhook tunnel
 * POST /api/v1/payment/momo/simulate
 */
export async function simulateMoMoPayment(req, res) {
  try {
    const { orderCode, orderId } = req.body;
    if (!orderCode && !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp orderCode hoặc orderId',
      });
    }

    const pool = await getDbPool();
    const transId = `SIM_MOMO_${Date.now()}`;

    const updateReq = pool.request();
    if (orderCode) updateReq.input('orderCode', sql.VarChar(30), orderCode);
    if (orderId) updateReq.input('orderId', sql.BigInt, orderId);

    const condition = orderCode ? 'order_code = @orderCode' : 'id = @orderId';

    await updateReq.query(`
      UPDATE orders 
      SET 
        payment_status = 'PAID',
        payment_method = 'MOMO',
        payment_transaction_ref = '${transId}'
      WHERE ${condition};
    `);

    const selectReq = pool.request();
    if (orderCode) selectReq.input('orderCode', sql.VarChar(30), orderCode);
    if (orderId) selectReq.input('orderId', sql.BigInt, orderId);

    const updateRes = await selectReq.query(`
      SELECT 
        id, order_code, daily_queue_number, 
        status, payment_status, payment_method, 
        payment_transaction_ref, total_amount, customer_id
      FROM orders
      WHERE ${condition};
    `);

    if (updateRes.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng cần giả lập thanh toán',
      });
    }

    const updatedOrder = updateRes.recordset[0];
    console.log(`[PaymentController - Simulation] Order #${updatedOrder.order_code} marked as PAID via simulation.`);

    // Phát WebSocket thông báo tức thì cho Client & Thu ngân
    emitOrderPaymentUpdated(updatedOrder);
    emitOrderStatusUpdated(updatedOrder);

    return res.status(200).json({
      success: true,
      message: `Giả lập thanh toán MoMo thành công cho đơn hàng #${updatedOrder.order_code}`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error('[PaymentController] simulateMoMoPayment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi giả lập thanh toán',
      error: error.message,
    });
  }
}

/**
 * 6. Giả lập thanh toán VietQR thành công
 * POST /api/v1/payment/vietqr/simulate
 */
export async function simulateVietQRPayment(req, res) {
  try {
    const { orderCode, orderId } = req.body;
    if (!orderCode && !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp orderCode hoặc orderId',
      });
    }

    const pool = await getDbPool();
    const transId = `SIM_VIETQR_${Date.now()}`;

    const updateReq = pool.request();
    if (orderCode) updateReq.input('orderCode', sql.VarChar(30), orderCode);
    if (orderId) updateReq.input('orderId', sql.BigInt, orderId);

    const condition = orderCode ? 'order_code = @orderCode' : 'id = @orderId';

    await updateReq.query(`
      UPDATE orders 
      SET 
        payment_status = 'PAID',
        payment_method = 'VietQR',
        payment_transaction_ref = '${transId}'
      WHERE ${condition};
    `);

    const selectReq = pool.request();
    if (orderCode) selectReq.input('orderCode', sql.VarChar(30), orderCode);
    if (orderId) selectReq.input('orderId', sql.BigInt, orderId);

    const updateRes = await selectReq.query(`
      SELECT 
        id, order_code, daily_queue_number, 
        status, payment_status, payment_method, 
        payment_transaction_ref, total_amount, customer_id,
        recipient_name, recipient_phone, shipping_address, estimated_delivery, created_at
      FROM orders
      WHERE ${condition};
    `);

    if (updateRes.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng cần giả lập thanh toán VietQR',
      });
    }

    const updatedOrder = updateRes.recordset[0];
    console.log(`[PaymentController - VietQR] Order #${updatedOrder.order_code} marked as PAID via VietQR simulation.`);

    // Phát WebSocket thông báo tức thì cho Client & Quán
    emitOrderPaymentUpdated(updatedOrder);
    emitOrderStatusUpdated(updatedOrder);

    return res.status(200).json({
      success: true,
      message: `Giả lập thanh toán VietQR thành công cho đơn hàng #${updatedOrder.order_code}`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error('[PaymentController] simulateVietQRPayment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi giả lập thanh toán VietQR',
      error: error.message,
    });
  }
}

/**
 * 7. Đổi phương thức thanh toán cho đơn hàng
 * POST /api/v1/payment/switch-method
 */
export async function switchPaymentMethod(req, res) {
  try {
    const { orderCode, orderId, paymentMethod } = req.body;
    if ((!orderCode && !orderId) || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin mã đơn hàng hoặc phương thức thanh toán mới',
      });
    }

    const pool = await getDbPool();
    const updateReq = pool.request();
    if (orderCode) updateReq.input('orderCode', sql.VarChar(30), orderCode);
    if (orderId) updateReq.input('orderId', sql.BigInt, orderId);

    const formattedMethod = 
      paymentMethod === 'MOMO' ? 'MOMO' :
      paymentMethod === 'BANK' || paymentMethod === 'VietQR' ? 'BANK_TRANSFER' : 'CASH';

    const methodDisplay = 
      formattedMethod === 'MOMO' ? 'Ví MoMo' :
      formattedMethod === 'BANK_TRANSFER' ? 'VietQR' : 'Tiền mặt khi nhận';

    updateReq.input('method', sql.VarChar(30), formattedMethod);

    const condition = orderCode ? 'order_code = @orderCode' : 'id = @orderId';

    await updateReq.query(`
      UPDATE orders 
      SET 
        payment_method = @method
      WHERE ${condition};
    `);

    const selectReq = pool.request();
    if (orderCode) selectReq.input('orderCode', sql.VarChar(30), orderCode);
    if (orderId) selectReq.input('orderId', sql.BigInt, orderId);

    const updateRes = await selectReq.query(`
      SELECT 
        id, order_code, daily_queue_number, 
        status, payment_status, payment_method, 
        payment_transaction_ref, total_amount, customer_id,
        recipient_name, recipient_phone, shipping_address, estimated_delivery, created_at
      FROM orders
      WHERE ${condition};
    `);

    if (updateRes.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng cần đổi phương thức thanh toán',
      });
    }

    const updatedOrder = {
      ...updateRes.recordset[0],
      payment_method: methodDisplay,
    };

    emitOrderStatusUpdated(updatedOrder);

    return res.status(200).json({
      success: true,
      message: `Đã đổi phương thức thanh toán sang ${methodDisplay}`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error('[PaymentController] switchPaymentMethod error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi đổi phương thức thanh toán',
      error: error.message,
    });
  }
}

