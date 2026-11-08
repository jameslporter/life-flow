export type Group = 'morning' | 'work' | 'evening';

export type Task = {
  id: string;
  title: string;
  group: Group;
  /** Days the task repeats on. 0 = Sunday ... 6 = Saturday. */
  days: number[];
  createdAt: number;
};

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
