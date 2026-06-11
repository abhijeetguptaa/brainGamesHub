import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export async function requestNotificationPermission() {
  if (Capacitor.getPlatform() === 'web') return false;

  const status = await LocalNotifications.checkPermissions();
  if (status.display !== 'granted') {
    const newStatus = await LocalNotifications.requestPermissions();
    return newStatus.display === 'granted';
  }
  return true;
}

export async function scheduleDailyReminder(t: any) {
  if (Capacitor.getPlatform() === 'web') return;

  // Cancel any existing notifications first
  await LocalNotifications.cancel({ notifications: [{ id: 1 }] });

  await LocalNotifications.schedule({
    notifications: [
      {
        title: t('notifications.reminderTitle', 'Time to play! 🌟'),
        body: t(
          'notifications.reminderBody',
          'Your streak is waiting! Come earn some stars today.',
        ),
        id: 1,
        schedule: {
          at: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours from now
          allowWhileIdle: true,
        },
        sound: 'res://platform_default',
        actionTypeId: '',
        extra: null,
      },
    ],
  });
}
