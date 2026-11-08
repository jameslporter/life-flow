import { Link, Stack } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HeaderLink } from '@/components/HeaderButton';
import { Screen } from '@/components/Screen';
import { describeDays } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { GROUPS } from '@/lib/types';

export default function AllTasks() {
  const theme = useTheme();
  const { tasks } = useStore();

  return (
    <>
      <Stack.Screen
        options={{ headerRight: () => <HeaderLink href={{ pathname: '/task/[id]', params: { id: 'new' } }} label="New" /> }}
      />
      <Screen>
        <View style={{ height: 4 }} />
        {GROUPS.map((g) => {
          const items = tasks.filter((t) => t.group === g.key);
          return (
            <View key={g.key} style={{ gap: 8 }}>
              <Text style={[styles.groupTitle, { color: theme.groups[g.key] }]}>
                {g.emoji} {g.label}
              </Text>
              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {items.length === 0 ? (
                  <Text style={{ color: theme.muted, padding: 14 }}>No tasks yet.</Text>
                ) : (
                  items.map((t, i) => (
                    <Link key={t.id} href={{ pathname: '/task/[id]', params: { id: t.id } }} asChild>
                      <Pressable
                        style={StyleSheet.flatten([
                          styles.row,
                          i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
                        ])}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.text, fontSize: 16 }}>{t.title}</Text>
                          <Text style={{ color: theme.muted, fontSize: 12 }}>{describeDays(t.days)}</Text>
                        </View>
                        <Text style={{ color: theme.muted, fontSize: 18 }}>›</Text>
                      </Pressable>
                    </Link>
                  ))
                )}
              </View>
            </View>
          );
        })}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  groupTitle: { fontSize: 18, fontWeight: '700' },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
});
