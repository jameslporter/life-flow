import AsyncStorage from '@react-native-async-storage/async-storage';
import { addUserInteractionListener, type LiveActivity } from 'expo-widgets';

import TasksActivity from '@/widgets/TasksActivity';
import TodayWidget from '@/widgets/TodayWidget';
import { GlanceProps, TOGGLE_PREFIX } from '@/widgets/types';

import { addDays, dateKey } from './dates';
import { periodAt, periodEnd, periodStart } from './periods';
import { darkTheme, lightTheme } from './theme';
import { GROUPS, Group, Task } from './types';

type Completions = Record<string, string[]>;
export type DoneChange = { taskId: string; day: string; done: boolean };

const PUSHED_KEY = 'life-flow/widget-pushed';
const ACTIVITY_URL = 'lifeflow://';

export const glanceSupported = true;

function propsFor(tasks: Task[], completions: Completions, day: Date, period: Group): GlanceProps {
  const key = dateKey(day);
  const group = GROUPS.find((g) => g.key === period)!;
  const done = completions[key] ?? [];
  return {
    day: key,
    period,
    label: group.label,
    emoji: group.emoji,
    color: lightTheme.groups[period],
    colorDark: darkTheme.groups[period],
    tasks: tasks
      .filter((t) => t.group === period && t.days.includes(day.getDay()))
      .map((t) => ({ id: t.id, title: t.title, done: done.includes(t.id) })),
    endsAt: periodEnd(day, period).getTime(),
  };
}

export function currentGlance(tasks: Task[], completions: Completions, now = new Date()): GlanceProps {
  return propsFor(tasks, completions, now, periodAt(now));
}

// What we last sent to the widget, as `${day}|${taskId}` -> done. A difference
// between this and the widget's timeline means the user checked a task on the widget.
let pushed: Record<string, boolean> | null = null;

async function loadPushed() {
  if (pushed) return pushed;
  try {
    pushed = JSON.parse((await AsyncStorage.getItem(PUSHED_KEY)) ?? '{}');
  } catch {
    pushed = {};
  }
  return pushed!;
}

/** Sends the rest of today, period by period, plus tomorrow morning to the widget. */
export async function pushWidget(tasks: Task[], completions: Completions, now = new Date()) {
  const current = periodAt(now);
  const order: Group[] = ['morning', 'work', 'evening'];
  const entries = [{ date: now, props: propsFor(tasks, completions, now, current) }];
  for (const period of order.slice(order.indexOf(current) + 1)) {
    entries.push({ date: periodStart(now, period), props: propsFor(tasks, completions, now, period) });
  }
  const tomorrow = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 1);
  entries.push({ date: tomorrow, props: propsFor(tasks, completions, tomorrow, 'morning') });

  TodayWidget.updateTimeline(entries);

  const next: Record<string, boolean> = {};
  for (const { props } of entries) for (const t of props.tasks) next[`${props.day}|${t.id}`] = t.done;
  pushed = next;
  AsyncStorage.setItem(PUSHED_KEY, JSON.stringify(next)).catch(() => {});
}

/** Check-offs made on the widget since the last push. */
export async function widgetChanges(): Promise<DoneChange[]> {
  const last = await loadPushed();
  const changes: DoneChange[] = [];
  for (const { props } of await TodayWidget.getTimeline()) {
    for (const t of props.tasks ?? []) {
      const before = last[`${props.day}|${t.id}`];
      if (before !== undefined && before !== t.done) changes.push({ taskId: t.id, day: props.day, done: t.done });
    }
  }
  return changes;
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
  const today = dateKey(now);
  const doneToday = completions[today] ?? [];
  const allDone = tasks.filter((t) => t.days.includes(now.getDay())).every((t) => doneToday.includes(t.id));
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
export function onGlancePress(handlers: { onActivityCheck: (taskId: string) => void; onWidgetPress: () => void }) {
  const sub = addUserInteractionListener((e) => {
    if (e.source === 'TasksActivity' && e.target?.startsWith(TOGGLE_PREFIX)) {
      handlers.onActivityCheck(e.target.slice(TOGGLE_PREFIX.length));
    } else if (e.source === 'TodayWidget') {
      handlers.onWidgetPress();
    }
  });
  return () => sub.remove();
}
