import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GlanceSync } from '@/components/GlanceSync';
import { StoreProvider } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export default function RootLayout() {
  const theme = useTheme();
  return (
    <StoreProvider>
      <GlanceSync />
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.background },
        }}>
        <Stack.Screen name="index" options={{ title: 'Life flow' }} />
        <Stack.Screen name="tasks" options={{ title: 'All tasks' }} />
        <Stack.Screen name="reminders" options={{ title: 'Reminders' }} />
        <Stack.Screen name="task/[id]" options={{ presentation: 'modal', title: 'Task' }} />
      </Stack>
    </StoreProvider>
  );
}
