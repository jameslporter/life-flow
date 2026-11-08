import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { dateKey } from '@/lib/dates';
import { onGlancePress, pushWidget, syncActivity, widgetChanges } from '@/lib/glance';
import { onMorningReminderOpened, scheduleMorningReminders } from '@/lib/reminders';
import { useStore } from '@/lib/store';

/**
 * Keeps the morning reminder, the home screen widget and the Live Activity in
 * step with the store. Renders nothing.
 */
export function GlanceSync() {
  const store = useStore();
  const { ready, tasks, completions, settings, setDone } = store;
  const latest = useRef(store);
  latest.current = store;
  // Don't push to the widget until we've picked up check-offs made on it.
  const [caughtUp, setCaughtUp] = useState(false);

  // Pull in check-offs made on the widget while the app wasn't running.
  useEffect(() => {
    if (!ready) return;
    const catchUp = async () => {
      try {
        setDone(await widgetChanges());
      } catch (e) {
        console.warn('[life-flow] Reading widget changes failed', e);
      }
      setCaughtUp(true);
      const s = latest.current;
      if (s.settings.liveActivityOnOpen) syncActivity(s.tasks, s.completions, { start: true });
    };
    catchUp();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setCaughtUp(false);
        catchUp();
      }
    });
    return () => sub.remove();
  }, [ready, setDone]);

  // Mirror the store to the widget and any running Live Activity.
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
  }, [ready, tasks, settings]);

  // Tapping the morning reminder starts the Live Activity.
  useEffect(() => {
    if (!ready) return;
    return onMorningReminderOpened(() => {
      const s = latest.current;
      syncActivity(s.tasks, s.completions, { start: true });
    });
  }, [ready]);

  // Presses on the widget and Live Activity.
  useEffect(() => {
    if (!ready) return;
    return onGlancePress({
      onActivityCheck: (taskId) => setDone([{ taskId, day: dateKey(new Date()), done: true }]),
      onWidgetPress: async () => setDone(await widgetChanges()),
    });
  }, [ready, setDone]);

  return null;
}
