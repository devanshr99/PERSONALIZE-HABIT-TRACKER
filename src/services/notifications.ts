/**
 * Browser notification service for Streakly.
 * Handles requesting permission and scheduling daily reminders.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export function showNotification(title: string, body: string): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'streakly-reminder',
      renotify: true
    } as NotificationOptions);
  } catch {
    // Notification failed silently
  }
}

/**
 * Schedule a daily notification at a given time (HH:MM).
 * This is a simple in-memory timer; for persistent notifications, 
 * a service worker with push API would be needed.
 * For PWA on Android, we use this basic approach.
 */
let reminderTimeout: ReturnType<typeof setTimeout> | null = null;

export function scheduleReminder(timeStr: string): void {
  clearReminder();

  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const msUntil = target.getTime() - now.getTime();

  reminderTimeout = setTimeout(() => {
    showNotification(
      "Don't break your streak 🔥",
      "Complete today's habits to keep your streak alive!"
    );
    // Re-schedule for next day
    scheduleReminder(timeStr);
  }, msUntil);
}

export function clearReminder(): void {
  if (reminderTimeout !== null) {
    clearTimeout(reminderTimeout);
    reminderTimeout = null;
  }
}
