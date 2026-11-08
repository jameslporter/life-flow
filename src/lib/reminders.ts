import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Settings } from './store';
import { DAY_SHORT, Task } from './types';

/** Notification data used to recognize a tap on the morning reminder. */
export const MORNING_REMINDER_KIND = 'morning-reminder';
const ID_PREFIX = 'morning-reminder-';

export const remindersSupported = Platform.OS === 'ios' || Platform.OS === 'android';

if (remindersSupported) {
  // Show the reminder as a banner even if the app happens to be open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function requestReminderPermission(): Promise<boolean> {
  if (!remindersSupported) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

function bodyFor(count: number, morningCount: number) {
  const tasks = count === 1 ? '1 task' : `${count} tasks`;
  if (morningCount > 0) {
    return `You have ${tasks} today. Tap to start checking off your morning.`;
  }
  return `You have ${tasks} today. Tap to see them.`;
}

/**
 * Replaces the scheduled morning reminders: one weekly notification for each
 * weekday that has at least one task, at the time chosen in settings.
 */
export async function scheduleMorningReminders(tasks: Task[], settings: Settings) {
  if (!remindersSupported) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(ID_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );

  if (!settings.reminderEnabled) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Morning reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  for (let day = 0; day < 7; day++) {
    const dayTasks = tasks.filter((t) => t.days.includes(day));
    if (dayTasks.length === 0) continue;
    const morningCount = dayTasks.filter((t) => t.group === 'morning').length;
    await Notifications.scheduleNotificationAsync({
      identifier: `${ID_PREFIX}${DAY_SHORT[day].toLowerCase()}`,
      content: {
        title: 'Good morning',
        body: bodyFor(dayTasks.length, morningCount),
        data: { kind: MORNING_REMINDER_KIND },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        // expo-notifications counts weekdays from 1 (Sunday).
        weekday: day + 1,
        hour: settings.reminderHour,
        minute: settings.reminderMinute,
        channelId: 'reminders',
      },
    });
  }
}

/** Calls `onOpen` when the user taps a morning reminder, including the tap that launched the app. */
export function onMorningReminderOpened(onOpen: () => void): () => void {
  if (!remindersSupported) return () => {};

  const isMorning = (r: Notifications.NotificationResponse | null) =>
    r?.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER &&
    r.notification.request.content.data?.kind === MORNING_REMINDER_KIND;

  const launch = Notifications.getLastNotificationResponse();
  if (isMorning(launch)) {
    onOpen();
    Notifications.clearLastNotificationResponse();
  }

  const sub = Notifications.addNotificationResponseReceivedListener((r) => {
    if (isMorning(r)) onOpen();
  });
  return () => sub.remove();
}
