import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { registerBackgroundRefresh } from '@/lib/backgroundRefresh';
import { dateKey } from '@/lib/dates';
import { glanceChanges, onGlancePress, pushWidget, syncActivity } from '@/lib/glance';
import { onMorningReminderOpened, requestReminderPermission, scheduleMorningReminders } from '@/lib/reminders';
import { useStore } from '@/lib/store';

/**
 * Keeps the morning reminder, the home screen widget and the Live Activity
 * (iOS) or pinned notification (Android) in step with the store. Renders nothing.
 */
export function GlanceSync() {
  const store = useStore();
  const { ready, tasks, completions, settings, setDone, reload } = store;
  const latest = useRef(store);
  latest.current = store;
  // Don't push to the widget until we've picked up check-offs made on it.
  const [caughtUp, setCaughtUp] = useState(false);
  // Whether the app may post notifications, asked for once per launch.
  const [canNotify, setCanNotify] = useState(false);

  // Pull in check-offs made on the widget or activity while the app wasn't open.
  useEffect(() => {
    if (!ready) return;
    registerBackgroundRefresh();
    const catchUp = async (fromBackground: boolean) => {
      const s0 = latest.current;
      let allowed = false;
      if (s0.settings.reminderEnabled || s0.settings.liveActivityOnOpen) {
        // Asks only the first time; after that the OS answers without a prompt.
        allowed = await requestReminderPermission().catch(() => false);
        setCanNotify(allowed);
      }
      try {
        // A background refresh may have saved check-offs while we were away.
        if (fromBackground) await reload();
        setDone(await glanceChanges());
      } catch (e) {
        console.warn('[life-flow] Reading widget changes failed', e);
      }
      setCaughtUp(true);
      const s = latest.current;
      // Android's pinned task list is a notification, so it needs the permission.
      if (s.settings.liveActivityOnOpen && (Platform.OS !== 'android' || allowed)) {
        syncActivity(s.tasks, s.completions, { start: true });
      }
    };
    catchUp(false);
    let previous = AppState.currentState;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && previous !== 'active') {
        setCaughtUp(false);
        catchUp(true);
      }
      previous = state;
    });
    return () => sub.remove();
  }, [ready, setDone, reload]);

  // Mirror the store to the widget and any running activity.
  useEffect(() => {
    if (!ready || !caughtUp) return;
    pushWidget(tasks, completions).catch((e) => console.warn('[life-flow] Widget update failed', e));
    syncActivity(tasks, completions);
  }, [ready, caughtUp, tasks, completions]);

  // Reschedule the morning reminder whenever tasks or settings change.
  useEffect(() => {
    if (!ready) return;
    scheduleMorningReminders(tasks, settings).catch((e) =>
      console.warn('[life-flow] Scheduling reminders failed', e)
    );
  }, [ready, tasks, settings, canNotify]);

  // Tapping the morning reminder starts the Live Activity / pinned notification.
  useEffect(() => {
    if (!ready) return;
    return onMorningReminderOpened(() => {
      const s = latest.current;
      syncActivity(s.tasks, s.completions, { start: true });
    });
  }, [ready]);

  // Presses on the widget and activity.
  useEffect(() => {
    if (!ready) return;
    return onGlancePress({
      onCheck: (taskId) => setDone([{ taskId, day: dateKey(new Date()), done: true }]),
      onChanged: async () => setDone(await glanceChanges()),
    });
  }, [ready, setDone]);

  return null;
}
