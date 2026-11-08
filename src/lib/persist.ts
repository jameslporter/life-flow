import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Task } from './types';

const STORAGE_KEY = 'life-flow/v1';

/** dateKey -> ids of the tasks done that day. */
export type Completions = Record<string, string[]>;

export type DoneChange = { taskId: string; day: string; done: boolean };

export type Settings = {
  /** Send a local notification each morning on days that have tasks. */
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  /** Start the Live Activity (iOS) or pinned notification (Android) whenever the app opens. */
  liveActivityOnOpen: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  reminderEnabled: false,
  reminderHour: 7,
  reminderMinute: 0,
  liveActivityOnOpen: false,
};

export type Persisted = { tasks: Task[]; completions: Completions; settings?: Partial<Settings> };

/** Reads the saved data, or null when there is none or it can't be read. */
export async function loadPersisted(): Promise<Persisted | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function savePersisted(data: Persisted) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function applyDone(completions: Completions, changes: DoneChange[]): Completions {
  const next = { ...completions };
  for (const { taskId, day, done } of changes) {
    const current = next[day] ?? [];
    const has = current.includes(taskId);
    if (done && !has) next[day] = [...current, taskId];
    if (!done && has) next[day] = current.filter((x) => x !== taskId);
  }
  return next;
}
