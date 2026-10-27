import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { registerPushTokenApi } from '../api/services';

// Configure notification presentation when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let pushTokenCached = null;
let notificationListener = null;
let responseListener = null;

/**
 * Configure Android notification channels
 */
export async function setupNotificationChannels() {
  if (Platform.OS === 'android') {
    try {
      // Channel v2 with custom gentle "ting ting" chime
      await Notifications.setNotificationChannelAsync('antcafe_orders_v2', {
        name: 'Đơn hàng Ant Coffee (Ting Ting)',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 120, 80, 120], // subtle, polite vibration
        lightColor: '#8B5CF6',
        sound: 'notification_ting.wav',
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync('antcafe_reminders_v2', {
        name: 'Nhắc nhở & Ưu đãi',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 120],
        lightColor: '#2563EB',
        sound: 'notification_ting.wav',
        enableVibrate: true,
        showBadge: true,
      });
    } catch (channelErr) {
      console.warn('[Push Notification] Channel setup note:', channelErr.message);
    }
  }
}

/**
 * Request notification permissions and register push token with backend
 */
export async function registerForPushNotificationsAsync(currentUser = null) {
  let token = null;

  try {
    await setupNotificationChannels();

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('[Push Notification] Permission not granted for push notifications.');
        return null;
      }

      // Project ID from Expo config
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId ||
        undefined;

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined
        );
        token = tokenData.data;
        console.log('[Push Notification] Expo Push Token obtained:', token);
      } catch (tokenErr) {
        console.warn('[Push Notification] Remote push token note:', tokenErr.message);
        // Fallback token for Expo Go / Emulator testing
        token = `ExponentPushToken[SIMULATOR_${Platform.OS}_${Date.now().toString().slice(-6)}]`;
      }
    } else {
      console.log('[Push Notification] Running on Emulator/Simulator. Using fallback token.');
      token = `ExponentPushToken[EMULATOR_${Platform.OS}_${Date.now().toString().slice(-6)}]`;
    }

    pushTokenCached = token;

    // Send token to backend linked with current user if available
    if (token) {
      const deviceName = Device.modelName || (Device.isDevice ? 'Physical Device' : 'Android Emulator');
      await registerPushTokenApi({
        pushToken: token,
        userId: currentUser?.id || null,
        deviceName,
        platform: Platform.OS,
      });
    }

    return token;
  } catch (error) {
    console.error('[Push Notification] registerForPushNotificationsAsync error:', error);
    return null;
  }
}

/**
 * Get cached push token
 */
export function getCachedPushToken() {
  return pushTokenCached;
}

/**
 * Setup notification listeners for all 3 states:
 * 1. Foreground: Handled by listener
 * 2. Background: Handled by responseListener when user taps tray
 * 3. App Killed: Handled by getLastNotificationResponseAsync
 */
export function setupNotificationListeners({ onNotificationReceived, onNotificationResponse }) {
  // Clear any existing subscriptions
  if (notificationListener) {
    notificationListener.remove();
  }
  if (responseListener) {
    responseListener.remove();
  }

  // 1. Foreground notification received
  notificationListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[Push Notification] Received foreground:', notification.request.content.title);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // 2. Notification response received (user tapped notification in background/tray)
  responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    console.log('[Push Notification] User clicked notification with data:', data);
    if (onNotificationResponse) {
      onNotificationResponse(data, response);
    }
  });

  // 3. App launched from killed state via notification click
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      const data = response.notification.request.content.data;
      console.log('[Push Notification] App opened from killed state via notification:', data);
      if (onNotificationResponse) {
        onNotificationResponse(data, response);
      }
    }
  }).catch((err) => {
    console.warn('[Push Notification] getLastNotificationResponseAsync error:', err.message);
  });

  return () => {
    if (notificationListener) notificationListener.remove();
    if (responseListener) responseListener.remove();
  };
}

/**
 * Schedule a local notification (Requirement A.5)
 * E.g. Coffee break reminder, voucher expiration, daily morning alert
 */
export async function scheduleLocalCoffeeReminder({
  seconds = 5,
  title = '☕ Ant Coffee - Giờ giải lao!',
  body = 'Đã đến lúc thưởng thức một ly cà phê thơm ngon rồi! Chạm vào đây để xem thực đơn hôm nay.',
  data = { screen: 'MENU' },
} = {}) {
  try {
    await setupNotificationChannels();
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'notification_ting.wav',
        channelId: 'antcafe_reminders_v2',
        vibrate: [0, 120],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, seconds),
      },
    });

    console.log(`[Push Notification] Scheduled local notification #${identifier} in ${seconds}s`);
    return identifier;
  } catch (error) {
    console.error('[Push Notification] scheduleLocalCoffeeReminder error:', error);
    return null;
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[Push Notification] Cancelled all scheduled notifications');
    return true;
  } catch (error) {
    console.error('[Push Notification] cancelAllScheduledNotifications error:', error);
    return false;
  }
}

/**
 * Get all pending scheduled notifications
 */
export async function getAllScheduledNotifications() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('[Push Notification] getAllScheduledNotifications error:', error);
    return [];
  }
}

/**
 * Present an immediate notification to the system tray (Heads-up banner)
 * Plays the gentle "ting ting" custom audio chime
 */
export async function presentLocalNotification({
  title = 'Ant Coffee Thông Báo',
  body = '',
  data = {},
  channelId = 'antcafe_orders_v2',
} = {}) {
  try {
    await setupNotificationChannels();

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'notification_ting.wav',
        channelId,
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 120, 80, 120],
      },
      trigger: null, // Trigger immediately
    });

    console.log(`[Push Notification] Presented immediate notification #${identifier}: ${title}`);
    return identifier;
  } catch (error) {
    console.error('[Push Notification] presentLocalNotification error:', error);
    return null;
  }
}

export default {
  registerForPushNotificationsAsync,
  setupNotificationListeners,
  scheduleLocalCoffeeReminder,
  presentLocalNotification,
  cancelAllScheduledNotifications,
  getAllScheduledNotifications,
  getCachedPushToken,
};
