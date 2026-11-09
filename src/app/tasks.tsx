import { Link, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HeaderLink } from '@/components/HeaderButton';
import { ReorderableList } from '@/components/ReorderableList';
import { Screen } from '@/components/Screen';
import { describeDays } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { GROUPS, Task } from '@/lib/types';

export default function AllTasks() {
  const theme = useTheme();
  const { tasks, moveTask } = useStore();
  const [dragging, setDragging] = useState(false);

  const renderTask = useCallback(
    (t: Task) => (
      <Link href={{ pathname: '/task/[id]', params: { id: t.id } }} asChild>
        <Pressable style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 16 }}>{t.title}</Text>
            <Text style={{ color: theme.muted, fontSize: 12 }}>{describeDays(t.days)}</Text>
          </View>
          <Text style={{ color: theme.muted, fontSize: 18 }}>›</Text>
        </Pressable>
      </Link>
    ),
    [theme]
  );

  return (
    <>
      <Stack.Screen
        options={{ headerRight: () => <HeaderLink href={{ pathname: '/task/[id]', params: { id: 'new' } }} label="New" /> }}
      />
      <Screen scrollEnabled={!dragging}>
        <Text style={{ color: theme.muted, fontSize: 13, marginTop: 4 }}>
          Drag ≡ to change the order. Today and your widgets follow it.
        </Text>
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
                  <ReorderableList
                    data={items}
                    keyExtractor={(t) => t.id}
                    itemLabel={(t) => t.title}
                    renderItem={renderTask}
                    onMove={(from, to) => moveTask(g.key, from, to)}
                    onDragChange={setDragging}
                    rowBackground={theme.card}
                    borderColor={theme.border}
                    handleColor={theme.muted}
                  />
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
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingRight: 14, gap: 12 },
});
