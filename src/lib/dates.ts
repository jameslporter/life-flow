import { ALL_WEEK, DAY_SHORT, DISPLAY_ORDER, WEEKDAYS } from './types';

export function dateKey(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function startOfWeek(d: Date): Date {
  // Monday-based week.
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - offset);
  return copy;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function sameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}

function sameSet(a: number[], b: number[]) {
  return a.length === b.length && b.every((x) => a.includes(x));
}

export function describeDays(days: number[]): string {
  if (sameSet(days, ALL_WEEK)) return 'Every day';
  if (sameSet(days, WEEKDAYS)) return 'Weekdays';
  if (sameSet(days, [0, 6])) return 'Weekends';
  if (days.length === 0) return 'No days';
  return DISPLAY_ORDER.filter((d) => days.includes(d))
    .map((d) => DAY_SHORT[d])
    .join(', ');
}

export function formatLongDate(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}
