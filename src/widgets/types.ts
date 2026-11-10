import type { Group } from '@/lib/types';

/** One task as shown on the widget and the Live Activity. Must stay JSON-serializable. */
export type GlanceTask = { id: string; title: string; done: boolean };

/** Colors for one appearance, from the app's theme (src/lib/theme.ts). */
export type GlanceColors = { surface: string; text: string; muted: string };

/**
 * Look shared by every widget surface, sent by the app so the theme and sizes live in
 * one place (GLANCE_STYLE in src/lib/glance-common.ts). Sizes are in pt / dp. Surfaces
 * may nudge them a little (the Lock Screen draws rows a bit larger, small widgets smaller).
 */
export type GlanceStyle = {
  light: GlanceColors;
  dark: GlanceColors;
  size: {
    /** Period name in the header. */
    header: number;
    /** Task title. */
    row: number;
    /** The ○ / ✓ mark in front of a task. */
    mark: number;
    /** Space above and below each task row. */
    rowPad: number;
    /** "Nothing planned." and similar notes. */
    note: number;
    /** Counts and "+N more". */
    small: number;
  };
};

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
  /** Theme colors and sizes. Missing on data pushed by app versions before it was added. */
  style?: GlanceStyle;
  /**
   * Live Activity / pinned notification only: the rest of today's periods that still
   * have tasks, in order. Shown next once every task in this period is checked off.
   */
  later?: Omit<GlanceProps, 'later' | 'checked' | 'style'>[];
  /**
   * Android pinned notification only: ids of tasks checked off on it, kept even after
   * it moves on to the next period, so the app can pick them all up.
   */
  checked?: string[];
};

/** Button target for checking off a task: `toggle:<taskId>`. */
export const TOGGLE_PREFIX = 'toggle:';

/**
 * Android pinned notification only: a hidden button the app presses natively when a part
 * of the day starts, so the notification moves on to the next one. Must match the
 * target in AndroidTasksNotification.tsx.
 */
export const TICK_TARGET = 'tick';

/** GlanceProps for one period, plus when that period starts (Unix ms). */
export type GlanceEntry = GlanceProps & { startsAt: number };
