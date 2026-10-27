import {
  savePushToken,
  getNotifications,
  markAsRead,
  markAllAsRead,
  createAndSendNotification,
} from '../services/notificationService.js';

export async function registerPushToken(req, res) {
  try {
    const { push_token, pushToken, device_name, deviceName, platform } = req.body;
    const token = push_token || pushToken;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Thiếu push_token' });
    }

    const userId = req.user?.id || req.body.userId || req.body.customerId || null;
    const name = device_name || deviceName || 'Mobile';
    const plat = platform || 'android';

    await savePushToken({
      userId,
      pushToken: token,
      deviceName: name,
      platform: plat,
    });

    return res.json({
      success: true,
      message: 'Đăng ký push token thành công',
      data: { push_token: token, user_id: userId },
    });
  } catch (error) {
    console.error('[Notification Controller] registerPushToken error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi đăng ký token', error: error.message });
  }
}

export async function listNotifications(req, res) {
  try {
    const userId = req.user?.id || req.query.userId || req.query.customerId || null;
    const limit = parseInt(req.query.limit, 10) || 30;

    // Khi chưa đăng nhập (không có userId) => Không trả về thông báo nào
    if (!userId) {
      return res.json({
        success: true,
        data: [],
        unread_count: 0,
        message: 'Khách vãng lai chưa đăng nhập',
      });
    }

    const notifications = await getNotifications(userId, limit);

    return res.json({
      success: true,
      data: notifications,
      unread_count: notifications.filter(n => !n.is_read).length,
    });
  } catch (error) {
    console.error('[Notification Controller] listNotifications error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải thông báo', error: error.message });
  }
}

export async function markSingleAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.body.userId || null;

    await markAsRead(id, userId);

    return res.json({
      success: true,
      message: 'Đã đánh dấu đã đọc',
    });
  } catch (error) {
    console.error('[Notification Controller] markSingleAsRead error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái', error: error.message });
  }
}

export async function markAllRead(req, res) {
  try {
    const userId = req.user?.id || req.body.userId || null;

    await markAllAsRead(userId);

    return res.json({
      success: true,
      message: 'Đã đánh dấu đã đọc tất cả thông báo',
    });
  } catch (error) {
    console.error('[Notification Controller] markAllRead error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái', error: error.message });
  }
}

export async function sendCustomNotification(req, res) {
  try {
    const { title, body, data, type, userId } = req.body;
    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'Tiêu đề và nội dung là bắt buộc' });
    }

    const notif = await createAndSendNotification({
      userId: userId || req.user?.id || null,
      title,
      body,
      data: data || {},
      type: type || 'SYSTEM_ANNOUNCEMENT',
    });

    return res.status(201).json({
      success: true,
      message: 'Gửi thông báo thành công',
      data: notif,
    });
  } catch (error) {
    console.error('[Notification Controller] sendCustomNotification error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi gửi thông báo', error: error.message });
  }
}
