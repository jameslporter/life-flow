import { Button, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { buttonStyle, containerBackground, font, foregroundStyle, padding, strikethrough } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { GlanceProps, GlanceTask } from './types';

/**
 * Home screen widget with the tasks for the current period. Tapping a task
 * checks it off right on the widget; the app picks the change up next time it runs.
 *
 * This function runs in the widget's own JS runtime: it can only use Expo UI
 * components and modifiers, and nothing from module scope. Shared pieces are
 * small components defined inside it, and colors and sizes come from `props.style`.
 */
function TodayWidget(props: GlanceProps, environment: WidgetEnvironment) {
  'widget';
  const max = environment.widgetFamily === 'systemLarge' ? 8 : 3;
  const tasks = props.tasks ?? [];
  const shown = tasks.filter((t) => !t.done).concat(tasks.filter((t) => t.done)).slice(0, max);
  const done = tasks.filter((t) => t.done).length;
  const small = environment.widgetFamily === 'systemSmall';
  const dark = environment.colorScheme === 'dark';
  const accent = (dark ? props.colorDark : props.color) ?? 'primary';
  // Only data pushed before `style` existed lacks it; these match GLANCE_STYLE.
  const style = props.style ?? {
    light: { surface: '#FFFFFF', text: '#1D1B18', muted: '#6F6A62' },
    dark: { surface: '#1F1D1A', text: '#F1EEE8', muted: '#A39D93' },
    size: { header: 15, row: 17, mark: 20, rowPad: 3, note: 13, small: 12 },
  };
  const colors = dark ? style.dark : style.light;
  // Small widgets are tight, so everything is a few points smaller there.
  const shrink = small ? 3 : 0;
  const size = {
    header: style.size.header - (small ? 2 : 0),
    row: style.size.row - shrink,
    mark: style.size.mark - shrink,
    rowPad: small ? 1 : style.size.rowPad,
    note: style.size.note,
    small: style.size.small,
  };

  // Text keeps the system's primary/secondary styles rather than the theme's text colors,
  // so it stays readable in tinted and clear Home Screen modes.
  const Note = ({ children }: { children: string }) => (
    <Text modifiers={[font({ size: size.note }), foregroundStyle('secondary')]}>{children}</Text>
  );

  const TaskRow = ({ task }: { task: GlanceTask }) => (
    <Button
      target={`toggle:${task.id}`}
      modifiers={[buttonStyle('plain')]}
      onPress={() => ({
        tasks: tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)),
      })}>
      <HStack spacing={8} modifiers={[padding({ vertical: size.rowPad })]}>
        <Image systemName={task.done ? 'checkmark.circle.fill' : 'circle'} size={size.mark} color={accent} />
        <Text
          modifiers={[
            font({ size: size.row }),
            foregroundStyle(task.done ? 'secondary' : 'primary'),
            strikethrough({ isActive: task.done, pattern: 'solid' }),
          ]}>
          {task.title}
        </Text>
        <Spacer />
      </HStack>
    </Button>
  );

  return (
    <VStack alignment="leading" spacing={small ? 4 : 6} modifiers={[containerBackground(colors.surface, 'widget')]}>
      <HStack>
        <Text modifiers={[font({ size: size.header, weight: 'bold' }), foregroundStyle(accent)]}>
          {`${props.emoji ?? ''} ${props.label ?? 'Today'}`}
        </Text>
        <Spacer />
        {tasks.length > 0 ? (
          <Text modifiers={[font({ size: size.small, weight: 'semibold' }), foregroundStyle('secondary')]}>
            {`${done}/${tasks.length}`}
          </Text>
        ) : null}
      </HStack>
      {tasks.length === 0 ? <Note>Nothing planned.</Note> : done === tasks.length ? <Note>All done 🎉</Note> : null}
      {shown.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
      <Spacer />
    </VStack>
  );
}

export default createWidget<GlanceProps>('TodayWidget', TodayWidget);
