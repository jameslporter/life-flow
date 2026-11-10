import { Column, Row, Spacer, Text, TextButton } from '@expo/ui/jetpack-compose';
import { background, cornerRadius, fillMaxSize, fillMaxWidth, height, padding, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { GlanceEntry, GlanceTask } from './types';

export type AndroidWidgetProps = { entries: GlanceEntry[] };

/**
 * Android home screen widget with the tasks for the current period. Tapping a
 * task checks it off right on the widget; the app picks the change up next time it runs.
 *
 * Android widgets have no timeline, so the app sends every period left today and
 * the widget picks the current one each time it draws.
 *
 * This function runs in the widget's own JS runtime: it can only use Expo UI
 * components and modifiers, and nothing from module scope. Shared pieces are
 * small components defined inside it, and colors and sizes come from `entry.style`.
 */
function AndroidTodayWidget(props: AndroidWidgetProps, environment: WidgetEnvironment) {
  'widget';
  const entries = props.entries ?? [];
  const now = Date.now();
  let index = 0;
  for (let i = 0; i < entries.length; i++) if (entries[i].startsAt <= now) index = i;
  const entry = entries[index];

  const dark = environment.colorScheme === 'dark';
  // Only data pushed before `style` existed lacks it; these match GLANCE_STYLE.
  const style = entry?.style ?? {
    light: { surface: '#FFFFFF', text: '#1D1B18', muted: '#6F6A62' },
    dark: { surface: '#1F1D1A', text: '#F1EEE8', muted: '#A39D93' },
    size: { header: 15, row: 17, mark: 20, rowPad: 3, note: 13, small: 12 },
  };
  const colors = dark ? style.dark : style.light;
  const size = style.size;

  const Note = ({ children }: { children: string }) => (
    <Text color={colors.muted} style={{ fontSize: size.note }}>
      {children}
    </Text>
  );

  if (!entry) {
    return (
      <Column modifiers={[fillMaxSize(), background(colors.surface), cornerRadius(20), paddingAll(14)]}>
        <Note>Open Life flow to load your tasks.</Note>
      </Column>
    );
  }

  const accent = dark ? entry.colorDark : entry.color;
  const tasks = entry.tasks ?? [];
  const done = tasks.filter((t) => t.done).length;
  const shown = tasks.filter((t) => !t.done).concat(tasks.filter((t) => t.done)).slice(0, 6);

  const TaskRow = ({ task }: { task: GlanceTask }) => (
    <TextButton
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
      {/* Compose dp padding looks a touch tighter than SwiftUI's, hence the extra 2. */}
      <Row verticalAlignment="center" modifiers={[fillMaxWidth(), padding(0, size.rowPad + 2, 0, size.rowPad + 2)]}>
        {/* Not a Checkbox: Android ticks a widget checkbox by itself when tapped and swallows
            the tap, so the button's press never runs and the app never hears about it. */}
        <Text color={accent} style={{ fontSize: size.mark, fontWeight: 'bold' }}>
          {task.done ? '✓  ' : '○  '}
        </Text>
        <Text
          color={task.done ? colors.muted : colors.text}
          maxLines={1}
          style={{ fontSize: size.row, textDecoration: task.done ? 'lineThrough' : 'none' }}>
          {task.title}
        </Text>
      </Row>
    </TextButton>
  );

  return (
    <Column modifiers={[fillMaxSize(), background(colors.surface), cornerRadius(20), paddingAll(12)]}>
      <Text color={accent} style={{ fontSize: size.header, fontWeight: 'bold' }}>
        {tasks.length > 0 ? `${entry.emoji} ${entry.label} · ${done}/${tasks.length}` : `${entry.emoji} ${entry.label}`}
      </Text>
      <Spacer modifiers={[height(4)]} />
      {tasks.length === 0 ? <Note>Nothing planned.</Note> : done === tasks.length ? <Note>All done 🎉</Note> : null}
      {shown.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </Column>
  );
}

export default createWidget<AndroidWidgetProps>('TodayWidget', AndroidTodayWidget);
