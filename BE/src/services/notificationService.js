import { getDbPool, sql } from '../config/db.js';
import { getIO } from '../socket/socketHandler.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Save or update user push token
 */
export async function savePushToken({ userId, pushToken, deviceName, platform }) {
  if (!pushToken) return null;

  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('userId', sql.BigInt, userId || null)
      .input('pushToken', sql.VarChar(255), pushToken)
      .input('deviceName', sql.NVarChar(100), deviceName || 'Mobile Device')
      .input('platform', sql.VarChar(20), platform || 'android')
      .query(`
        IF EXISTS (SELECT 1 FROM user_push_tokens WHERE push_token = @pushToken)
        BEGIN
          UPDATE user_push_tokens
          SET user_id = COALESCE(@userId, user_id),
              device_name = @deviceName,
              platform = @platform,
              updated_at = SYSDATETIME()
          WHERE push_token = @pushToken;
        END
        ELSE
        BEGIN
          INSERT INTO user_push_tokens (user_id, push_token, device_name, platform)
          VALUES (@userId, @pushToken, @deviceName, @platform);
        END
      `);
    console.log(`[Push Notification] Stored token for user ${userId || 'guest'}: ${pushToken.slice(0, 20)}...`);
    return true;
  } catch (err) {
    console.error('[Push Notification] Error saving push token:', err.message);
    return false;
  }
}

/**
 * Send payload to Expo Push Server
 */
export async function sendExpoPushNotification(messages) {
  if (!messages || messages.length === 0) return null;

  try {
    const validMessages = messages.filter(m => m.to && typeof m.to === 'string');
    if (validMessages.length === 0) return null;

    console.log(`[Push Notification] Sending ${validMessages.length} push notification(s) via Expo...`);

    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validMessages),
    });

    const result = await response.json();
    console.log('[Push Notification] Expo response status:', response.status, JSON.stringify(result).slice(0, 150));
    return result;
  } catch (err) {
    console.warn('[Push Notification] Failed to send push via Expo:', err.message);
    return null;
  }
}

/**
 * Create a persistent notification record and dispatch push + socket event
 */
export async function createAndSendNotification({ userId, title, body, data = {}, type = 'ORDER_STATUS' }) {
  try {
    const pool = await getDbPool();
    const dataJson = JSON.stringify(data);

    // 1. Insert into notifications table
    const insertRes = await pool.request()
      .input('userId', sql.BigInt, userId || null)
      .input('title', sql.NVarChar(200), title)
      .input('body', sql.NVarChar(1000), body)
      .input('dataJson', sql.NVarChar(sql.MAX), dataJson)
      .input('type', sql.VarChar(50), type)
      .query(`
        INSERT INTO notifications (user_id, title, body, data_json, type, is_read, created_at)
        OUTPUT INSERTED.id, INSERTED.user_id, INSERTED.title, INSERTED.body, INSERTED.data_json, INSERTED.type, INSERTED.is_read, INSERTED.created_at
        VALUES (@userId, @title, @body, @dataJson, @type, 0, SYSDATETIME())
      `);

    const createdRecord = insertRes.recordset[0];
    const notificationPayload = {
      id: Number(createdRecord.id),
      userId: createdRecord.user_id ? Number(createdRecord.user_id) : null,
      title: createdRecord.title,
      body: createdRecord.body,
      data: data,
      type: createdRecord.type,
      is_read: false,
      created_at: createdRecord.created_at,
    };

    // 2. Real-time broadcast to socket clients
    const io = getIO();
    if (io) {
      if (userId) {
        io.to(`customer_${userId}`).emit('notification:new', notificationPayload);
      }
      io.to('room:orders').emit('notification:new', notificationPayload);
      io.emit('notification:new', notificationPayload); // Fallback for active preview
    }

    // 3. Send remote push notification if user has tokens registered
    let tokensQuery = 'SELECT push_token FROM user_push_tokens';
    const tokenReq = pool.request();
    if (userId) {
      tokensQuery += ' WHERE user_id = @userId';
      tokenReq.input('userId', sql.BigInt, userId);
    }
    const tokensRes = await tokenReq.query(tokensQuery);

    if (tokensRes.recordset.length > 0) {
      const messages = tokensRes.recordset.map(r => ({
        to: r.push_token,
        sound: 'notification_ting.wav',
        title: title,
        body: body,
        data: data,
        priority: 'high',
        channelId: 'antcafe_orders_v2',
      }));
      sendExpoPushNotification(messages);
    }

    return notificationPayload;
  } catch (err) {
    console.error('[Push Notification] createAndSendNotification error:', err);
    return null;
  }
}

/**
 * Event 1: Triggered when an order is created
 */
export async function notifyOrderCreated(order) {
  const code = order.order_code || order.orderCode;
  const queue = order.daily_queue_number || order.sequence_number || 'Mới';
  const customerId = order.customer_id;

  return createAndSendNotification({
    userId: customerId,
    title: `☕ Đặt hàng thành công #${code}`,
    body: `Đơn hàng của bạn (Số thứ tự ${queue}) đã được gửi tới quầy. Ant Coffee đang chuẩn bị nguyên liệu!`,
    data: {
      screen: 'ORDER_DETAIL',
      orderId: order.id,
      orderCode: code,
    },
    type: 'ORDER_CREATED',
  });
}

/**
 * Event 2: Triggered when order status changes
 */
export async function notifyOrderStatusUpdated(order) {
  const code = order.order_code || order.orderCode;
  const status = order.status;
  const customerId = order.customer_id;

  let title = `📦 Cập nhật đơn hàng #${code}`;
  let body = `Trạng thái đơn hàng của bạn đã chuyển sang ${status}.`;

  if (status === 'CONFIRMED') {
    title = `☕ Đơn #${code} đã được tiếp nhận`;
    body = `Barista Ant Coffee đang tiến hành pha chế những ly nước thơm ngon cho bạn!`;
  } else if (status === 'READY') {
    title = `✨ Đơn #${code} đã sẵn sàng!`;
    body = `Thức uống đã sẵn sàng tại quầy. Mời bạn nhận món hoặc tài xế đang trên đường giao tới!`;
  } else if (status === 'COMPLETED') {
    title = `❤️ Đơn #${code} hoàn tất`;
    body = `Cảm ơn bạn đã lựa chọn Ant Coffee & Tea. Chúc bạn có một ngày tràn đầy năng lượng!`;
  } else if (status === 'CANCELLED') {
    title = `⚠️ Đơn #${code} đã bị hủy`;
    body = order.cancel_reason ? `Lý do: ${order.cancel_reason}` : `Đơn hàng đã được hủy theo yêu cầu.`;
  }

  return createAndSendNotification({
    userId: customerId,
    title,
    body,
    data: {
      screen: 'ORDER_DETAIL',
      orderId: order.id,
      orderCode: code,
      status: status,
    },
    type: 'ORDER_STATUS',
  });
}

/**
 * Event 3: Payment status updated
 */
export async function notifyOrderPaymentUpdated(order) {
  const code = order.order_code || order.orderCode;
  const customerId = order.customer_id;
  const method = order.payment_method || 'MoMo/VietQR';

  return createAndSendNotification({
    userId: customerId,
    title: `💳 Thanh toán thành công #${code}`,
    body: `Đơn hàng #${code} đã được xác nhận thanh toán qua ${method}. Cảm ơn quý khách!`,
    data: {
      screen: 'ORDER_DETAIL',
      orderId: order.id,
      orderCode: code,
    },
    type: 'PAYMENT_SUCCESS',
  });
}

/**
 * Fetch notification history for user
 */
export async function getNotifications(userId, limit = 30) {
  if (!userId) {
    return [];
  }

  const pool = await getDbPool();
  const req = pool.request();
  req.input('limit', sql.Int, limit);
  req.input('userId', sql.BigInt, userId);

  const query = `
    SELECT TOP (@limit)
      id, user_id, title, body, data_json, type, is_read, created_at
    FROM notifications
    WHERE (user_id = @userId OR user_id IS NULL)
    ORDER BY created_at DESC
  `;

  const res = await req.query(query);
  return res.recordset.map(r => ({
    id: Number(r.id),
    userId: r.user_id ? Number(r.user_id) : null,
    title: r.title,
    body: r.body,
    data: r.data_json ? JSON.parse(r.data_json) : {},
    type: r.type,
    is_read: Boolean(r.is_read),
    created_at: r.created_at,
  }));
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId, userId) {
  const pool = await getDbPool();
  const req = pool.request().input('id', sql.BigInt, notificationId);
  let query = 'UPDATE notifications SET is_read = 1 WHERE id = @id';
  if (userId) {
    query += ' AND (user_id = @userId OR user_id IS NULL)';
    req.input('userId', sql.BigInt, userId);
  }
  await req.query(query);
  return true;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(userId) {
  const pool = await getDbPool();
  const req = pool.request();
  let query = 'UPDATE notifications SET is_read = 1 WHERE 1=1';
  if (userId) {
    query += ' AND (user_id = @userId OR user_id IS NULL)';
    req.input('userId', sql.BigInt, userId);
  }
  await req.query(query);
  return true;
}
