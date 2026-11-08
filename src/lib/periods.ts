import { Group } from './types';

/**
 * Hour (local time, 24h) each period starts at. Morning runs until work starts,
 * work until evening starts, and evening until midnight.
 */
export const PERIOD_START: Record<Group, number> = { morning: 0, work: 9, evening: 17 };

export function periodAt(d: Date): Group {
  const h = d.getHours();
  if (h >= PERIOD_START.evening) return 'evening';
  if (h >= PERIOD_START.work) return 'work';
  return 'morning';
}

/** When the given period ends on the same day as `d` (midnight for evening). */
export function periodEnd(d: Date, group: Group): Date {
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (group === 'morning') end.setHours(PERIOD_START.work);
  else if (group === 'work') end.setHours(PERIOD_START.evening);
  else end.setDate(end.getDate() + 1);
  return end;
}

/** When the given period starts on the same day as `d`. */
export function periodStart(d: Date, group: Group): Date {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  start.setHours(PERIOD_START[group]);
  return start;
}
