import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

export default function NotFound() {
  const theme = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: theme.background }}>
        <Text style={{ color: theme.text, fontSize: 18 }}>This page doesn’t exist.</Text>
        <Link href="/" style={{ color: theme.primary, fontWeight: '600' }}>
          Go to today
        </Link>
      </View>
    </>
  );
}
