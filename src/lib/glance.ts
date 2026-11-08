// Web has no widget or Live Activity. See glance.ios.ts and glance.android.ts.
import type { Completions, DoneChange } from './persist';
import type { Task } from './types';

export const glanceSupported = false;
export const activityName = '';

export async function pushWidget(_tasks: Task[], _completions: Completions) {}

export async function glanceChanges(): Promise<DoneChange[]> {
  return [];
}

export async function syncActivity(_tasks: Task[], _completions: Completions, _opts?: { start?: boolean }) {}

export function onGlancePress(_handlers: { onCheck: (taskId: string) => void; onChanged: () => void }) {
  return () => {};
}
