import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { ALL_WEEK, DAY_SHORT, DISPLAY_ORDER, GROUPS, Group, WEEKDAYS } from '@/lib/types';

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function EditTask() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string; group?: string }>();
  const { ready, tasks, addTask, updateTask, deleteTask } = useStore();
  const isNew = params.id === 'new';
  const existing = tasks.find((t) => t.id === params.id);

  const initialGroup = (GROUPS.some((g) => g.key === params.group) ? params.group : 'morning') as Group;
  const [title, setTitle] = useState('');
  const [group, setGroup] = useState<Group>(initialGroup);
  const [days, setDays] = useState<number[]>(WEEKDAYS);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  // Fill the form once the task is available (storage loads asynchronously).
  useEffect(() => {
    if (existing && loadedId !== existing.id) {
      setTitle(existing.title);
      setGroup(existing.group);
      setDays(existing.days);
      setLoadedId(existing.id);
    }
  }, [existing, loadedId]);

  const allWeek = ALL_WEEK.every((d) => days.includes(d));
  const weekdaysOnly = days.length === WEEKDAYS.length && WEEKDAYS.every((d) => days.includes(d));
  const canSave = title.trim().length > 0 && days.length > 0;

  const save = () => {
    if (!canSave) return;
    const input = { title: title.trim(), group, days: [...days].sort() };
    if (existing) updateTask(existing.id, input);
    else addTask(input);
    close();
  };

  const toggleDay = (d: number) =>
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  if (ready && !isNew && !existing) {
    return (
      <Screen>
        <Text style={{ color: theme.text, paddingTop: 24 }}>That task no longer exists.</Text>
      </Screen>
    );
  }

  const chip = (active: boolean, color = theme.primary) => [
    styles.chip,
    { borderColor: active ? color : theme.border, backgroundColor: active ? color : theme.card },
  ];

  return (
    <>
      <Stack.Screen options={{ title: isNew ? 'New task' : 'Edit task' }} />
      <Screen>
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.muted }]}>Task</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Take vitamins"
            placeholderTextColor={theme.muted}
            autoFocus={isNew}
            onSubmitEditing={save}
            style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.muted }]}>Part of the day</Text>
          <View style={styles.chips}>
            {GROUPS.map((g) => {
              const active = group === g.key;
              return (
                <Pressable key={g.key} onPress={() => setGroup(g.key)} style={chip(active, theme.groups[g.key])}>
                  <Text style={{ color: active ? '#fff' : theme.text, fontWeight: '600' }}>
                    {g.emoji} {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.muted }]}>Repeats on</Text>
          <View style={[styles.toggleRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Pressable
              style={[styles.segment, weekdaysOnly && { backgroundColor: theme.primary }]}
              onPress={() => setDays(WEEKDAYS)}>
              <Text style={{ color: weekdaysOnly ? theme.primaryText : theme.text, fontWeight: '600' }}>Weekdays</Text>
            </Pressable>
            <Pressable
              style={[styles.segment, allWeek && { backgroundColor: theme.primary }]}
              onPress={() => setDays(ALL_WEEK)}>
              <Text style={{ color: allWeek ? theme.primaryText : theme.text, fontWeight: '600' }}>All week</Text>
            </Pressable>
          </View>
          <View style={styles.chips}>
            {DISPLAY_ORDER.map((d) => {
              const active = days.includes(d);
              return (
                <Pressable key={d} onPress={() => toggleDay(d)} style={[chip(active), styles.dayChip]}>
                  <Text style={{ color: active ? theme.primaryText : theme.text }}>{DAY_SHORT[d]}</Text>
                </Pressable>
              );
            })}
          </View>
          {days.length === 0 && <Text style={{ color: theme.danger }}>Pick at least one day.</Text>}
        </View>

        <Pressable
          onPress={save}
          disabled={!canSave}
          style={[styles.button, { backgroundColor: theme.primary, opacity: canSave ? 1 : 0.4 }]}>
          <Text style={{ color: theme.primaryText, fontWeight: '700', fontSize: 16 }}>
            {isNew ? 'Add task' : 'Save changes'}
          </Text>
        </Pressable>

        {existing && (
          <Pressable
            onPress={() => {
              deleteTask(existing.id);
              close();
            }}
            style={[styles.button, { borderWidth: 1, borderColor: theme.border }]}>
            <Text style={{ color: theme.danger, fontWeight: '600' }}>Delete task</Text>
          </Pressable>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8, paddingTop: 4 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  dayChip: { minWidth: 52, alignItems: 'center' },
  toggleRow: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 4, gap: 4 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
  button: { alignItems: 'center', padding: 16, borderRadius: 14 },
});
