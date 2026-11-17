export type Group = 'morning' | 'work' | 'evening';

/**
 * When a task shows up. Weekly tasks repeat on the given days (0 = Sunday ... 6 = Saturday);
 * one-off tasks show only on their date ('YYYY-MM-DD', a local calendar day).
 */
export type Schedule = { kind: 'weekly'; days: number[] } | { kind: 'once'; date: string };

export type Task = {
  id: string;
  /** The list the task belongs to. Every task is in the Personal list until sharing arrives. */
  listId: string;
  title: string;
  group: Group;
  schedule: Schedule;
  /** Fractional index that orders the task within its group. */
  sortKey: string;
  createdAt: number;
};

/** What the person did with a task on a given day. 'open' means un-checked. */
export type CheckState = 'done' | 'skipped' | 'open';

export const GROUPS: { key: Group; label: string; emoji: string }[] = [
  { key: 'morning', label: 'Morning', emoji: '🌅' },
  { key: 'work', label: 'Work', emoji: '💼' },
  { key: 'evening', label: 'Evening', emoji: '🌙' },
];

export const WEEKDAYS = [1, 2, 3, 4, 5];
export const ALL_WEEK = [0, 1, 2, 3, 4, 5, 6];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// Week displayed Monday first.
export const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
