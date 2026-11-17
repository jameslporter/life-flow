import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

type WidgetPropsModule = {
  getProps(name: string): string | null;
  scheduleRefreshes(
    times: number[],
    widgets: string[],
    notificationName: string | null,
    notificationId: string | null,
    notificationTarget: string | null
  ): void;
  // Added later than the rest, so a build from before then lacks them.
  canRequestPin?(): boolean;
  placedCount?(name: string): number;
  requestPin?(name: string): boolean;
};

const native = Platform.OS === 'android' ? requireOptionalNativeModule<WidgetPropsModule>('WidgetProps') : null;

/** The props an Android widget currently shows, including check-offs made on it. */
export function getWidgetProps<T>(name: string): T | null {
  const raw = native?.getProps(name);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Redraws the given widgets, and presses `notification.target` on the pinned notification,
 * at each of `times` (Unix ms) still ahead. Replaces what was scheduled before. Runs
 * natively, so it works while the app isn't running.
 */
export function scheduleRefreshes(
  times: number[],
  widgets: string[],
  notification?: { name: string; id: string; target: string }
) {
  native?.scheduleRefreshes(times, widgets, notification?.name ?? null, notification?.id ?? null, notification?.target ?? null);
}

/** Whether the launcher can add a widget to the home screen for us after the user confirms. */
export function canRequestPin(): boolean {
  return native?.canRequestPin?.() ?? false;
}

/** How many copies of the widget are on the home screen. */
export function placedCount(name: string): number {
  return native?.placedCount?.(name) ?? 0;
}

/**
 * Opens the launcher's "Add to home screen" dialog for the widget. Returns false when that
 * isn't possible. The user can still cancel the dialog, so check `placedCount` afterwards.
 */
export function requestPin(name: string): boolean {
  return native?.requestPin?.(name) ?? false;
}
