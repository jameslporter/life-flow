import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { canRequestPin, placedCount, requestPin } from '../../modules/widget-props';

const WIDGET_NAME = 'TodayWidget';

/**
 * Whether the Today widget is on the home screen, and a way to add it in one tap.
 * Only Android lets an app ask for this, and only on launchers that support it, so
 * `canAdd` is false on iOS, web and other launchers.
 */
export function useHomeWidget() {
  const [canAdd] = useState(canRequestPin);
  const [placed, setPlaced] = useState(() => canAdd && placedCount(WIDGET_NAME) > 0);

  // The launcher's dialog sends the app to the background, so look again when it comes back.
  // That also notices a widget added or removed by hand while the app was away.
  useEffect(() => {
    if (!canAdd) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setPlaced(placedCount(WIDGET_NAME) > 0);
    });
    return () => sub.remove();
  }, [canAdd]);

  const add = useCallback(() => requestPin(WIDGET_NAME), []);

  return { canAdd, placed, add };
}
