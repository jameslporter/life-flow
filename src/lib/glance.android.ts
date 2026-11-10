import { addUserInteractionListener } from 'expo-widgets';

import { getWidgetProps, scheduleRefreshes } from '../../modules/widget-props';
import AndroidTasksNotification from '@/widgets/AndroidTasksNotification';
import AndroidTodayWidget, { type AndroidWidgetProps } from '@/widgets/AndroidTodayWidget';
import { TICK_TARGET, type GlanceProps } from '@/widgets/types';

import { activityGlance, changesSincePush, glanceEntries, recordPushed } from './glance-common';
import type { Completions, DoneChange } from './persist';
import type { Task } from './types';

const NOTIFICATION_ID = 'today';
const NOTIFICATION_CHANNEL = 'tasks-pinned';

export const glanceSupported = true;
export const activityName = 'Pinned notification';

/** Sends the rest of today, period by period, plus tomorrow morning to the widget. */
export async function pushWidget(tasks: Task[], completions: Completions, now = new Date()) {
  const entries = glanceEntries(tasks, completions, now);
  AndroidTodayWidget.updateSnapshot({ entries });
  // Move the widget and the pinned notification on when each later part of the day starts,
  // even if the app doesn't get to run then.
  scheduleRefreshes(
    entries.slice(1).map((e) => e.startsAt),
    ['TodayWidget'],
    { name: 'TasksNotification', id: NOTIFICATION_ID, target: TICK_TARGET }
  );
  await recordPushed(tasks, completions, now);
}

/** Check-offs made on the widget or the pinned notification since the last push. */
export async function glanceChanges(): Promise<DoneChange[]> {
  const propsList: Partial<GlanceProps>[] = [];
  const checked: DoneChange[] = [];
  propsList.push(...(getWidgetProps<AndroidWidgetProps>('TodayWidget')?.entries ?? []));
  try {
    const active = await AndroidTasksNotification.get(NOTIFICATION_ID);
    if (active) {
      const props = await active.getProps();
      propsList.push(props);
      // Tasks from earlier periods are no longer in `tasks` once it has moved on.
      checked.push(...(props.checked ?? []).map((taskId) => ({ taskId, day: props.day!, done: true })));
    }
  } catch {
    // The notification was dismissed in the meantime.
  }
  return [...(await changesSincePush(propsList)), ...checked];
}

async function ensureChannel() {
  const Notifications = await import('expo-notifications');
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL, {
    name: 'Today’s tasks',
    description: 'Pinned list of the tasks for this part of the day',
    importance: Notifications.AndroidImportance.LOW,
    showBadge: false,
  });
}

/**
 * Keeps the pinned notification in step with the day. It shows the current period, or
 * the next one with tasks left once that's done, and goes away when nothing is left today.
 * Posts one only when `start` is set and something is left to do.
 */
export async function syncActivity(tasks: Task[], completions: Completions, { start = false } = {}) {
  const now = new Date();
  const props = activityGlance(tasks, completions, now);

  try {
    const existing = await AndroidTasksNotification.get(NOTIFICATION_ID);
    if (existing) {
      if (!props) await existing.cancel();
      else await existing.update(props);
    } else if (start && props) {
      await ensureChannel();
      await AndroidTasksNotification.post(props, {
        id: NOTIFICATION_ID,
        channelId: NOTIFICATION_CHANNEL,
        title: `${props.emoji} ${props.label}`,
        text: 'Your tasks for this part of the day',
        ongoing: true,
        alertOnlyOnce: true,
        url: 'lifeflow://',
      });
    }
  } catch (e) {
    // Notifications may be turned off for the app.
    console.warn('[life-flow] Pinned notification update failed', e);
  }
}

/** Listens for presses on the widget and the pinned notification. Both update themselves. */
export function onGlancePress(handlers: { onCheck: (taskId: string) => void; onChanged: () => void }) {
  const sub = addUserInteractionListener(() => handlers.onChanged());
  return () => sub.remove();
}
