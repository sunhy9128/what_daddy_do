import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type NotificationType = 'prenatal' | 'checkin' | 'vaccine' | 'reminder';

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  const existing = await Notifications.getPermissionsAsync() as any;
  const existingStatus = existing.status as string;
  let finalStatus = existingStatus;

  if (existingStatus !== Notifications.PermissionStatus.GRANTED) {
    const requested = await Notifications.requestPermissionsAsync() as any;
    finalStatus = requested.status as string;
  }

  if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
    return false;
  }

  // Android-specific: set notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '默认',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B6B',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: '每日提醒',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4ECDC4',
    });
  }

  return true;
}

/**
 * Schedule a notification for a prenatal checkup reminder
 */
export async function schedulePrenatalReminder(params: {
  id: string;
  title: string;
  body: string;
  triggerDate: Date;
}): Promise<string | null> {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `产检提醒：${params.title}`,
        body: params.body,
        data: { type: 'prenatal', taskId: params.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: params.triggerDate,
      },
    });
    return identifier;
  } catch (e) {
    console.warn('Failed to schedule prenatal notification:', e);
    return null;
  }
}

/**
 * Schedule daily check-in reminder
 */
export async function scheduleDailyCheckinReminder(params: {
  hour: number;
  minute: number;
}): Promise<string | null> {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '每日打卡提醒 ⭐',
        body: '今天还有待完成的任务哦，点击看看~',
        data: { type: 'checkin' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: params.hour,
        minute: params.minute,
      },
    });
    return identifier;
  } catch (e) {
    console.warn('Failed to schedule checkin notification:', e);
    return null;
  }
}

/**
 * Schedule vaccine reminder
 */
export async function scheduleVaccineReminder(params: {
  id: string;
  vaccineName: string;
  doseInfo: string;
  triggerDate: Date;
}): Promise<string | null> {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `疫苗提醒：${params.vaccineName}`,
        body: `${params.doseInfo}，别忘了带宝宝去打疫苗哦~`,
        data: { type: 'vaccine', taskId: params.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: params.triggerDate,
      },
    });
    return identifier;
  } catch (e) {
    console.warn('Failed to schedule vaccine notification:', e);
    return null;
  }
}

/**
 * Cancel a specific notification by its identifier
 */
export async function cancelNotification(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (e) {
    console.warn('Failed to cancel notification:', e);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('Failed to cancel all notifications:', e);
  }
}

/**
 * Get all pending notification identifiers
 */
export async function getPendingNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('Failed to get pending notifications:', e);
    return [];
  }
}

/**
 * Send an immediate notification (for testing or direct alerts)
 */
export async function sendImmediateNotification(params: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: params.title,
        body: params.body,
        data: params.data,
      },
      trigger: null, // null means immediate
    });
  } catch (e) {
    console.warn('Failed to send immediate notification:', e);
  }
}
