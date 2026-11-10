import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GlanceEntry, GlanceProps, GlanceStyle } from '@/widgets/types';

import { addDays, dateKey } from './dates';
import { periodAt, periodEnd, periodStart } from './periods';
import type { Completions, DoneChange } from './persist';
import { darkTheme, lightTheme } from './theme';
import { GROUPS, Group, Task } from './types';

/** The look every widget surface shares. Change sizes here to change them everywhere. */
export const GLANCE_STYLE: GlanceStyle = {
  light: { surface: lightTheme.card, text: lightTheme.text, muted: lightTheme.muted },
  dark: { surface: darkTheme.card, text: darkTheme.text, muted: darkTheme.muted },
  size: { header: 15, row: 17, mark: 20, rowPad: 3, note: 13, small: 12 },
};

const PUSHED_KEY = 'life-flow/widget-pushed';
const ORDER: Group[] = ['morning', 'work', 'evening'];

export function propsFor(tasks: Task[], completions: Completions, day: Date, period: Group): GlanceProps {
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
  return { ...propsFor(tasks, completions, now, periodAt(now)), style: GLANCE_STYLE };
}

/** The current period, the rest of today's periods, and tomorrow morning, each with its start time. */
export function glanceEntries(tasks: Task[], completions: Completions, now = new Date()): GlanceEntry[] {
  const current = periodAt(now);
  const style = GLANCE_STYLE;
  const entries: GlanceEntry[] = [{ startsAt: now.getTime(), ...propsFor(tasks, completions, now, current), style }];
  for (const period of ORDER.slice(ORDER.indexOf(current) + 1)) {
    entries.push({ startsAt: periodStart(now, period).getTime(), ...propsFor(tasks, completions, now, period), style });
  }
  const tomorrow = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), 1);
  entries.push({ startsAt: tomorrow.getTime(), ...propsFor(tasks, completions, tomorrow, 'morning'), style });
  return entries;
}

/**
 * What the Live Activity / pinned notification shows: the current period, or the next
 * one today that still has tasks to do, with the periods after it in `later`. Null once
 * nothing is left from now until the end of the day.
 * Keep in step with `advance` in modules/activity-checks/ios/ActivityChecks.swift.
 */
export function activityGlance(tasks: Task[], completions: Completions, now = new Date()): GlanceProps | null {
  const open = ORDER.slice(ORDER.indexOf(periodAt(now)))
    .map((period) => propsFor(tasks, completions, now, period))
    .filter((props) => props.tasks.some((t) => !t.done));
  if (open.length === 0) return null;
  // `style` only once, at the top: ActivityKit caps a Live Activity's data at 4 KB.
  return { ...open[0], style: GLANCE_STYLE, later: open.slice(1) };
}

// What we last sent to the widget and the activity, as `${day}|${taskId}` -> done.
// A difference between this and what they hold now means the user checked a task there.
let pushed: Record<string, boolean> | null = null;

/** Remembers what the widget and activity now show: every period today, plus tomorrow morning. */
export async function recordPushed(tasks: Task[], completions: Completions, now = new Date()) {
  const tomorrow = addDays(now, 1);
  const propsList = [...ORDER.map((p) => propsFor(tasks, completions, now, p)), propsFor(tasks, completions, tomorrow, 'morning')];
  const next: Record<string, boolean> = {};
  for (const props of propsList) for (const t of props.tasks) next[`${props.day}|${t.id}`] = t.done;
  pushed = next;
  await AsyncStorage.setItem(PUSHED_KEY, JSON.stringify(next)).catch(() => {});
}

/** Check-offs in `propsList` that differ from what the app last pushed. */
export async function changesSincePush(propsList: Partial<GlanceProps>[]): Promise<DoneChange[]> {
  if (!pushed) {
    try {
      pushed = JSON.parse((await AsyncStorage.getItem(PUSHED_KEY)) ?? '{}');
    } catch {
      pushed = {};
    }
  }
  const seen = new Set<string>();
  const changes: DoneChange[] = [];
  for (const props of propsList) {
    for (const t of props.tasks ?? []) {
      const key = `${props.day}|${t.id}`;
      const before = pushed![key];
      if (before === undefined || before === t.done || seen.has(key)) continue;
      seen.add(key);
      changes.push({ taskId: t.id, day: props.day!, done: t.done });
    }
  }
  return changes;
}
