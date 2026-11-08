import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

type WidgetPropsModule = { getProps(name: string): string | null };

const native = Platform.OS === 'android' ? requireOptionalNativeModule<WidgetPropsModule>('WidgetProps') : null;

/** The props an Android widget currently shows, including check-offs made on it. */
export function getWidgetProps<T>(name: string): T | null {
  const raw = native?.getProps(name);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
