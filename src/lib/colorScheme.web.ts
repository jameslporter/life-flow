import { useSyncExternalStore } from 'react';
import { Appearance, type ColorSchemeName } from 'react-native';

function subscribe(onChange: () => void) {
  const sub = Appearance.addChangeListener(onChange);
  return () => sub.remove();
}

/**
 * The web build is pre-rendered in light mode. React keeps the pre-rendered
 * styles of anything it hydrates, so reading the real scheme during hydration
 * left the page background light for dark mode users. Reporting the build-time
 * value while hydrating, then the real one, makes React re-render with it.
 */
export function useColorScheme(): ColorSchemeName {
  return useSyncExternalStore(subscribe, () => Appearance.getColorScheme() ?? 'light', () => 'light');
}
