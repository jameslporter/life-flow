import { addUserInteractionListener, type LiveActivity } from 'expo-widgets';

import { takePendingActivityChecks } from '../../modules/activity-checks';

import TasksActivity from '@/widgets/TasksActivity';
import TodayWidget from '@/widgets/TodayWidget';
import { GlanceProps, TOGGLE_PREFIX } from '@/widgets/types';

import { activityGlance, changesSincePush, currentGlance, glanceEntries, recordPushed } from './glance-common';
import type { Completions, DoneChange } from './persist';
import type { Task } from './types';

const ACTIVITY_URL = 'lifeflow://';

export const glanceSupported = true;
export const activityName = 'Live Activity';

/** Sends the rest of today, period by period, plus tomorrow morning to the widget. */
export async function pushWidget(tasks: Task[], completions: Completions, now = new Date()) {
  const entries = glanceEntries(tasks, completions, now);
  TodayWidget.updateTimeline(
    entries.map(({ startsAt, ...props }, i) => ({
      date: new Date(startsAt),
      // The rest of that day, so the widget can move on by itself once this period is done.
      props: { ...props, later: entries.slice(i + 1).filter((e) => e.day === props.day).map(({ startsAt: _, style: __, ...p }) => p) },
    }))
  );
  await recordPushed(tasks, completions, now);
}

/** Check-offs made on the widget or the Live Activity since the last push. */
export async function glanceChanges(): Promise<DoneChange[]> {
  const timeline = await TodayWidget.getTimeline();
  // Tasks from later periods can be checked off on the widget too once it has moved on.
  const fromWidget = await changesSincePush(timeline.flatMap((e) => [e.props, ...(e.props.later ?? [])]));
  // Recorded natively, so presses made while the app wasn't running aren't lost.
  const fromActivity = takePendingActivityChecks().map((c) => ({ ...c, done: true }));
  return [...fromWidget, ...fromActivity];
}

function activity(): LiveActivity<GlanceProps> | undefined {
  return TasksActivity.getInstances()[0];
}

/**
 * Keeps the Live Activity in step with the day. It shows the current period, or the
 * next one with tasks left once that's done, and ends when nothing is left today.
 * Starts one only when `start` is set and something is left to do.
 */
export async function syncActivity(tasks: Task[], completions: Completions, { start = false } = {}) {
  const now = new Date();
  const props = activityGlance(tasks, completions, now);

  const existing = activity();
  try {
    if (existing) {
      if (!props) await existing.end('default', currentGlance(tasks, completions, now));
      else await existing.update(props, new Date(props.endsAt));
    } else if (start && props) {
      TasksActivity.start(props, ACTIVITY_URL, new Date(props.endsAt));
    }
  } catch (e) {
    // Live Activities can be turned off in Settings, or unsupported on this device.
    console.warn('[life-flow] Live Activity update failed', e);
  }
}

/** Listens for presses on the widget and Live Activity. */
export function onGlancePress(handlers: { onCheck: (taskId: string) => void; onChanged: () => void }) {
  const sub = addUserInteractionListener((e) => {
    if (e.source === 'TasksActivity' && e.target?.startsWith(TOGGLE_PREFIX)) {
      // The native side has already updated the activity and recorded the check-off.
      // Apply this one now, then any recorded while the app wasn't running.
      handlers.onCheck(e.target.slice(TOGGLE_PREFIX.length));
      handlers.onChanged();
    } else {
      handlers.onChanged();
    }
  });
  return () => sub.remove();
}
