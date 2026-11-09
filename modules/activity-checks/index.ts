import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

type ActivityChecksModule = { takePending(): { taskId: string; day: string }[] };

const native = Platform.OS === 'ios' ? requireOptionalNativeModule<ActivityChecksModule>('ActivityChecks') : null;

/**
 * Tasks checked off on the Live Activity that the app hasn't applied yet. The native
 * side records them (and updates the activity) even when the app isn't running.
 * Each call returns them once.
 */
export function takePendingActivityChecks(): { taskId: string; day: string }[] {
  try {
    return native?.takePending() ?? [];
  } catch {
    return [];
  }
}
