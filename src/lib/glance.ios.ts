import { addUserInteractionListener, type LiveActivity } from 'expo-widgets';

import TasksActivity from '@/widgets/TasksActivity';
import TodayWidget from '@/widgets/TodayWidget';
import { GlanceProps, TOGGLE_PREFIX } from '@/widgets/types';

import { allDoneToday, changesSincePush, currentGlance, glanceEntries, recordPushed } from './glance-common';
import type { Completions, DoneChange } from './persist';
import type { Task } from './types';

const ACTIVITY_URL = 'lifeflow://';

export const glanceSupported = true;
export const activityName = 'Live Activity';

/** Sends the rest of today, period by period, plus tomorrow morning to the widget. */
export async function pushWidget(tasks: Task[], completions: Completions, now = new Date()) {
  const entries = glanceEntries(tasks, completions, now);
  TodayWidget.updateTimeline(entries.map((props) => ({ date: new Date(props.startsAt), props })));
  await recordPushed(tasks, completions, now);
}

/** Check-offs made on the widget since the last push. (Live Activity presses arrive as events.) */
export async function glanceChanges(): Promise<DoneChange[]> {
  const timeline = await TodayWidget.getTimeline();
  return changesSincePush(timeline.map((e) => e.props));
}

function activity(): LiveActivity<GlanceProps> | undefined {
  return TasksActivity.getInstances()[0];
}

/**
 * Keeps the Live Activity in step with the current period. Starts one only when
 * `start` is set and something is left to do; ends it once every task due today is done.
 */
export async function syncActivity(tasks: Task[], completions: Completions, { start = false } = {}) {
  const now = new Date();
  const props = currentGlance(tasks, completions, now);
  const allDone = allDoneToday(tasks, completions, now);
  const staleDate = new Date(props.endsAt);

  const existing = activity();
  try {
    if (existing) {
      if (allDone) await existing.end('default', props);
      else await existing.update(props, staleDate);
    } else if (start && !allDone) {
      TasksActivity.start(props, ACTIVITY_URL, staleDate);
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
      // Live Activity buttons don't change its props, so the app does the check-off.
      handlers.onCheck(e.target.slice(TOGGLE_PREFIX.length));
    } else {
      handlers.onChanged();
    }
  });
  return () => sub.remove();
}
