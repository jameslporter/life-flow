import { dateKey, describeDays, fromDateKey } from './dates';
import type { Schedule, Task } from './types';

/** Whether the task shows up on the given local day. */
export function occursOn(task: Pick<Task, 'schedule'>, day: Date): boolean {
  const s = task.schedule;
  return s.kind === 'weekly' ? s.days.includes(day.getDay()) : s.date === dateKey(day);
}

/** Short text for a task's schedule, such as "Weekdays" or "Tue, Nov 18". */
export function describeSchedule(schedule: Schedule): string {
  if (schedule.kind === 'weekly') return describeDays(schedule.days);
  return formatShortDate(fromDateKey(schedule.date));
}

export function formatShortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
