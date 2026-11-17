import AsyncStorage from '@react-native-async-storage/async-storage';

/** Where everything lived before the move to TinyBase. Read once to migrate, never written. */
const LEGACY_KEY = 'life-flow/v1';
/** Device-only settings. They never sync, because each device has its own reminders. */
const SETTINGS_KEY = 'life-flow/settings';

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

/** A new install starts with the morning reminder and the Live Activity / pinned notification on. */
export const NEW_USER_SETTINGS: Partial<Settings> = { reminderEnabled: true, liveActivityOnOpen: true };

/** The v1 data shape, kept only for the migration. */
export type LegacyData = {
  tasks: { id: string; title: string; group: string; days: number[]; createdAt: number }[];
  completions: Record<string, string[]>;
  settings?: Partial<Settings>;
};

/** Reads the v1 blob, or null when there is none or it can't be read. */
export async function loadLegacy(): Promise<LegacyData | null> {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Reads device settings, carrying them over from v1 the first time. */
export async function loadSettings(): Promise<Partial<Settings>> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Fall through to the defaults below.
  }
  const legacy = await loadLegacy();
  return legacy ? (legacy.settings ?? {}) : NEW_USER_SETTINGS;
}

export async function saveSettings(settings: Partial<Settings>) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
