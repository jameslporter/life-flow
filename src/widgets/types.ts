import type { Group } from '@/lib/types';

/** One task as shown on the widget and the Live Activity. Must stay JSON-serializable. */
export type GlanceTask = { id: string; title: string; done: boolean };

/** Everything the widget and Live Activity need to draw the current period. */
export type GlanceProps = {
  /** dateKey of the day these tasks belong to. */
  day: string;
  period: Group;
  label: string;
  emoji: string;
  /** Group accent color for light and dark appearance. */
  color: string;
  colorDark: string;
  tasks: GlanceTask[];
  /** Ends of the period, as a Unix time in ms. */
  endsAt: number;
  /**
   * Live Activity / pinned notification only: the rest of today's periods that still
   * have tasks, in order. Shown next once every task in this period is checked off.
   */
  later?: Omit<GlanceProps, 'later' | 'checked'>[];
  /**
   * Android pinned notification only: ids of tasks checked off on it, kept even after
   * it moves on to the next period, so the app can pick them all up.
   */
  checked?: string[];
};

/** Button target for checking off a task: `toggle:<taskId>`. */
export const TOGGLE_PREFIX = 'toggle:';

/** GlanceProps for one period, plus when that period starts (Unix ms). */
export type GlanceEntry = GlanceProps & { startsAt: number };
