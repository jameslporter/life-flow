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
