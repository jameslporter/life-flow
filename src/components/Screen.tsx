import { ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '@/lib/theme';

/** Scrollable page body, centered and width-capped so it reads well on desktop web. */
export function Screen({ children, scrollEnabled = true }: { children: React.ReactNode; scrollEnabled?: boolean }) {
  const theme = useTheme();
  return (
    <ScrollView scrollEnabled={scrollEnabled} style={{ backgroundColor: theme.background }} contentContainerStyle={styles.outer}>
      <View style={styles.inner}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  outer: { paddingHorizontal: 16, paddingBottom: 48, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 640, gap: 20 },
});
