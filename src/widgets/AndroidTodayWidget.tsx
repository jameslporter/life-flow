import { Checkbox, Column, Row, Spacer, Text, TextButton } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxSize, fillMaxWidth, height, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { GlanceEntry } from './types';

export type AndroidWidgetProps = { entries: GlanceEntry[] };

/**
 * Android home screen widget with the tasks for the current period. Tapping a
 * task checks it off right on the widget; the app picks the change up next time it runs.
 *
 * Android widgets have no timeline, so the app sends every period left today and
 * the widget picks the current one each time it draws.
 *
 * This function runs in the widget's own JS runtime: it can only use Expo UI
 * components and modifiers, and nothing from module scope.
 */
function AndroidTodayWidget(props: AndroidWidgetProps, environment: WidgetEnvironment) {
  'widget';
  const entries = props.entries ?? [];
  const now = Date.now();
  let index = 0;
  for (let i = 0; i < entries.length; i++) if (entries[i].startsAt <= now) index = i;
  const entry = entries[index];

  const dark = environment.colorScheme === 'dark';
  const surface = dark ? '#1F1D1A' : '#FFFFFF';
  const text = dark ? '#F1EEE8' : '#1D1B18';
  const muted = dark ? '#A39D93' : '#6F6A62';

  if (!entry) {
    return (
      <Column modifiers={[fillMaxSize(), background(surface), cornerRadius(20), paddingAll(14)]}>
        <Text color={muted}>Open Life flow to load your tasks.</Text>
      </Column>
    );
  }

  const accent = dark ? entry.colorDark : entry.color;
  const tasks = entry.tasks ?? [];
  const done = tasks.filter((t) => t.done).length;
  const shown = tasks.filter((t) => !t.done).concat(tasks.filter((t) => t.done)).slice(0, 6);

  return (
    <Column modifiers={[fillMaxSize(), background(surface), cornerRadius(20), paddingAll(12)]}>
      <Text color={accent} style={{ fontSize: 15, fontWeight: 'bold' }}>
        {tasks.length > 0 ? `${entry.emoji} ${entry.label} · ${done}/${tasks.length}` : `${entry.emoji} ${entry.label}`}
      </Text>
      <Spacer modifiers={[height(4)]} />
      {tasks.length === 0 ? (
        <Text color={muted} style={{ fontSize: 13 }}>Nothing planned.</Text>
      ) : done === tasks.length ? (
        <Text color={muted} style={{ fontSize: 13 }}>All done 🎉</Text>
      ) : null}
      {shown.map((task) => (
        <TextButton
          key={task.id}
          // `target` names the press; the TS types for Compose buttons don't list it yet.
          {...({ target: `toggle:${task.id}` } as object)}
          modifiers={[fillMaxWidth()]}
          onClick={() =>
            ({
              entries: entries.map((e, i) =>
                i === index ? { ...e, tasks: e.tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)) } : e
              ),
            }) as unknown as void
          }>
          <Row verticalAlignment="center" modifiers={[fillMaxWidth()]}>
            <Checkbox value={task.done} colors={{ checkedColor: accent, uncheckedColor: accent }} />
            <Text
              color={task.done ? muted : text}
              maxLines={1}
              style={{ fontSize: 14, textDecoration: task.done ? 'lineThrough' : 'none' }}>
              {task.title}
            </Text>
          </Row>
        </TextButton>
      ))}
    </Column>
  );
}

export default createWidget<AndroidWidgetProps>('TodayWidget', AndroidTodayWidget);
