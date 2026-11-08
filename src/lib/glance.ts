// The widget and Live Activity are iOS only for now. See glance.ios.ts.
import type { Task } from './types';

type Completions = Record<string, string[]>;
export type DoneChange = { taskId: string; day: string; done: boolean };

export const glanceSupported = false;

export async function pushWidget(_tasks: Task[], _completions: Completions) {}

export async function widgetChanges(): Promise<DoneChange[]> {
  return [];
}

export async function syncActivity(_tasks: Task[], _completions: Completions, _opts?: { start?: boolean }) {}

export function onGlancePress(_handlers: { onActivityCheck: (taskId: string) => void; onWidgetPress: () => void }) {
  return () => {};
}
