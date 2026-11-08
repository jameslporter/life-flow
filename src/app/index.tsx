import { Link, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HeaderLink } from '@/components/HeaderButton';
import { Screen } from '@/components/Screen';
import { addDays, dateKey, describeDays, formatLongDate, sameDay, startOfWeek } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { DAY_SHORT, GROUPS } from '@/lib/types';

export default function Today() {
  const theme = useTheme();
  const { ready, tasks, isDone, toggleDone } = useStore();
  const today = new Date();
  const [selected, setSelected] = useState(today);
  const key = dateKey(selected);
  const weekStart = startOfWeek(today);
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dueToday = useMemo(
    () => tasks.filter((t) => t.days.includes(selected.getDay())),
    [tasks, selected]
  );
  const doneCount = dueToday.filter((t) => isDone(t.id, key)).length;
  const isToday = sameDay(selected, today);

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => <HeaderLink href="/reminders" label="Reminders" />,
          headerRight: () => <HeaderLink href="/tasks" label="All tasks" />,
        }}
      />
      <Screen>
        <View style={{ gap: 4, paddingTop: 8 }}>
          <Text style={[styles.kicker, { color: theme.muted }]}>{isToday ? 'Today' : 'Planned for'}</Text>
          <Text style={[styles.title, { color: theme.text }]}>{formatLongDate(selected)}</Text>
          {dueToday.length > 0 && (
            <Text style={{ color: theme.muted }}>
              {doneCount} of {dueToday.length} done
            </Text>
          )}
        </View>

        <View style={styles.week}>
          {week.map((d) => {
            const active = sameDay(d, selected);
            return (
              <Pressable
                key={dateKey(d)}
                onPress={() => setSelected(d)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[
                  styles.dayPill,
                  { borderColor: theme.border, backgroundColor: active ? theme.primary : theme.card },
                ]}>
                <Text style={{ fontSize: 12, color: active ? theme.primaryText : theme.muted }}>
                  {DAY_SHORT[d.getDay()]}
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: sameDay(d, today) ? '800' : '500',
                    color: active ? theme.primaryText : theme.text,
                  }}>
                  {d.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {ready &&
          GROUPS.map((g) => {
            const items = dueToday.filter((t) => t.group === g.key);
            return (
              <View key={g.key} style={{ gap: 8 }}>
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: theme.groups[g.key] }]}>
                    {g.emoji} {g.label}
                  </Text>
                  <Link href={{ pathname: '/task/[id]', params: { id: 'new', group: g.key } }} asChild>
                    <Pressable hitSlop={8}>
                      <Text style={{ color: theme.primary, fontWeight: '600' }}>+ Add</Text>
                    </Pressable>
                  </Link>
                </View>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  {items.length === 0 ? (
                    <Text style={{ color: theme.muted, padding: 14 }}>Nothing planned.</Text>
                  ) : (
                    items.map((t, i) => {
                      const done = isDone(t.id, key);
                      return (
                        <View
                          key={t.id}
                          style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.border }]}>
                          <Pressable
                            style={styles.rowMain}
                            onPress={() => toggleDone(t.id, key)}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: done }}>
                            <View
                              style={[
                                styles.check,
                                { borderColor: theme.groups[g.key] },
                                done && { backgroundColor: theme.groups[g.key] },
                              ]}>
                              {done && <Text style={styles.checkMark}>✓</Text>}
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.taskTitle,
                                  { color: done ? theme.muted : theme.text },
                                  done && { textDecorationLine: 'line-through' },
                                ]}>
                                {t.title}
                              </Text>
                              <Text style={{ color: theme.muted, fontSize: 12 }}>{describeDays(t.days)}</Text>
                            </View>
                          </Pressable>
                          <Link href={{ pathname: '/task/[id]', params: { id: t.id } }} asChild>
                            <Pressable hitSlop={8} style={styles.edit} accessibilityLabel={`Edit ${t.title}`}>
                              <Text style={{ color: theme.muted, fontSize: 13 }}>Edit</Text>
                            </Pressable>
                          </Link>
                        </View>
                      );
                    })
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
  kicker: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '700' },
  week: { flexDirection: 'row', gap: 6 },
  dayPill: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 12, borderWidth: 1, gap: 2 },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupTitle: { fontSize: 18, fontWeight: '700' },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#fff', fontWeight: '800', fontSize: 14 },
  taskTitle: { fontSize: 16 },
  edit: { paddingHorizontal: 14, paddingVertical: 14 },
});
