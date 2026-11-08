import { Button, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { buttonStyle, containerBackground, font, foregroundStyle, strikethrough } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { GlanceProps } from './types';

/**
 * Home screen widget with the tasks for the current period. Tapping a task
 * checks it off right on the widget; the app picks the change up next time it runs.
 *
 * This function runs in the widget's own JS runtime: it can only use Expo UI
 * components and modifiers, and nothing from module scope.
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

  return (
    <VStack alignment="leading" spacing={small ? 4 : 6} modifiers={[containerBackground(dark ? '#1F1D1A' : '#FFFFFF', 'widget')]}>
      <HStack>
        <Text modifiers={[font({ size: small ? 13 : 15, weight: 'bold' }), foregroundStyle(accent)]}>
          {`${props.emoji ?? ''} ${props.label ?? 'Today'}`}
        </Text>
        <Spacer />
        {tasks.length > 0 ? (
          <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle('secondary')]}>{`${done}/${tasks.length}`}</Text>
        ) : null}
      </HStack>
      {tasks.length === 0 ? (
        <Text modifiers={[font({ size: 13 }), foregroundStyle('secondary')]}>Nothing planned.</Text>
      ) : done === tasks.length ? (
        <Text modifiers={[font({ size: 13 }), foregroundStyle('secondary')]}>All done 🎉</Text>
      ) : null}
      {shown.map((task) => (
        <Button
          key={task.id}
          target={`toggle:${task.id}`}
          modifiers={[buttonStyle('plain')]}
          onPress={() => ({
            tasks: tasks.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)),
          })}>
          <HStack spacing={6}>
            <Image
              systemName={task.done ? 'checkmark.circle.fill' : 'circle'}
              size={small ? 14 : 16}
              color={accent}
            />
            <Text
              modifiers={[
                font({ size: small ? 12 : 14 }),
                foregroundStyle(task.done ? 'secondary' : 'primary'),
                strikethrough({ isActive: task.done, pattern: 'solid' }),
              ]}>
              {task.title}
            </Text>
            <Spacer />
          </HStack>
        </Button>
      ))}
      <Spacer />
    </VStack>
  );
}

export default createWidget<GlanceProps>('TodayWidget', TodayWidget);
