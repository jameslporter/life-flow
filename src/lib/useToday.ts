import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { dateKey } from './dates';

/**
 * Today's date, kept current: it rolls over at midnight while the app is open
 * and is checked again whenever the app comes back to the foreground.
 */
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const refresh = () =>
      setToday((prev) => {
        const now = new Date();
        return dateKey(now) === dateKey(prev) ? prev : now;
      });

    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleMidnight = () => {
      clearTimeout(timer);
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      // A second past midnight, so the new date is certain to have begun.
      timer = setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, midnight.getTime() - now.getTime() + 1000);
    };

    // The date may have changed while the screen wasn't rendering.
    refresh();
    scheduleMidnight();
    // Timers don't run while the app is suspended, so check again on resume.
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      refresh();
      scheduleMidnight();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return today;
}
