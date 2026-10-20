import { getDbPool, sql } from '../config/db.js';
import { emitStoreStatusUpdated } from '../socket/socketHandler.js';

export async function getStoreStatus(req, res) {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT 
        id, store_name, phone, address, wifi_name, wifi_password,
        is_accepting_orders,
        CONVERT(VARCHAR(5), open_time, 108) as open_time,
        CONVERT(VARCHAR(5), close_time, 108) as close_time,
        default_shipping_fee,
        updated_at
      FROM store_settings
      WHERE id = 1
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Chưa có cấu hình quán' });
    }

    const store = result.recordset[0];
    return res.json({
      success: true,
      data: {
        id: store.id,
        store_name: store.store_name,
        phone: store.phone,
        address: store.address,
        wifi_name: store.wifi_name,
        wifi_password: store.wifi_password,
        is_accepting_orders: Boolean(store.is_accepting_orders),
        open_time: store.open_time,
        close_time: store.close_time,
        default_shipping_fee: Number(store.default_shipping_fee),
        rating: 4.8,
        review_count: '1.2k+',
        delivery_time: '15-25 phút',
      },
    });
  } catch (error) {
    console.error('[Store] getStoreStatus error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy thông tin quán' });
  }
}

export async function updateStoreSettings(req, res) {
  try {
    const { store_name, phone, address, wifi_name, wifi_password, default_shipping_fee, open_time, close_time } = req.body;
    const pool = await getDbPool();

    const request = pool.request();
    request.input('store_name', sql.NVarChar(150), store_name || null);
    request.input('phone', sql.VarChar(20), phone || null);
    request.input('address', sql.NVarChar(255), address || null);
    request.input('wifi_name', sql.NVarChar(100), wifi_name || null);
    request.input('wifi_password', sql.VarChar(100), wifi_password || null);
    request.input('default_shipping_fee', sql.BigInt, default_shipping_fee || null);
    request.input('open_time', sql.VarChar(10), open_time || null);
    request.input('close_time', sql.VarChar(10), close_time || null);
    request.input('userId', sql.BigInt, req.user?.id || 1);

    await request.query(`
      UPDATE store_settings
      SET 
        store_name = COALESCE(@store_name, store_name),
        phone = COALESCE(@phone, phone),
        address = COALESCE(@address, address),
        wifi_name = COALESCE(@wifi_name, wifi_name),
        wifi_password = COALESCE(@wifi_password, wifi_password),
        default_shipping_fee = COALESCE(@default_shipping_fee, default_shipping_fee),
        open_time = COALESCE(CAST(@open_time AS TIME), open_time),
        close_time = COALESCE(CAST(@close_time AS TIME), close_time),
        updated_by = @userId,
        updated_at = SYSDATETIME()
      WHERE id = 1
    `);

    // Fetch updated settings
    const updated = await pool.request().query('SELECT * FROM store_settings WHERE id = 1');
    const storeData = updated.recordset[0];
    emitStoreStatusUpdated(storeData);

    return res.json({
      success: true,
      message: 'Cập nhật cấu hình quán thành công',
      data: storeData,
    });
  } catch (error) {
    console.error('[Store] updateStoreSettings error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật cấu hình quán' });
  }
}

export async function toggleAcceptingOrders(req, res) {
  try {
    const pool = await getDbPool();

    // Toggle current status
    const updateRes = await pool.request()
      .input('userId', sql.BigInt, req.user?.id || 1)
      .query(`
        UPDATE store_settings
        SET is_accepting_orders = CASE WHEN is_accepting_orders = 1 THEN 0 ELSE 1 END,
            updated_by = @userId,
            updated_at = SYSDATETIME()
        OUTPUT INSERTED.is_accepting_orders, INSERTED.store_name, INSERTED.phone, INSERTED.address, INSERTED.default_shipping_fee
        WHERE id = 1
      `);

    const updated = updateRes.recordset[0];
    const isAccepting = Boolean(updated.is_accepting_orders);

    // Broadcast via WebSocket
    emitStoreStatusUpdated({
      ...updated,
      is_accepting_orders: isAccepting,
    });

    return res.json({
      success: true,
      message: isAccepting ? 'Đã BẬT nhận đơn online' : 'Đã TẮT nhận đơn online',
      data: {
        is_accepting_orders: isAccepting,
      },
    });
  } catch (error) {
    console.error('[Store] toggleAcceptingOrders error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi bật/tắt nhận đơn' });
  }
}
