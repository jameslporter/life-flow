import { Button, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { activityBackgroundTint, buttonStyle, font, foregroundStyle, padding, strikethrough } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

import type { GlanceProps } from './types';

/**
 * Live Activity (Lock Screen and Dynamic Island) with the tasks for the current
 * period. Each task is a button; the press reaches the app, which checks the task
 * off and updates the activity.
 *
 * This function runs in the widget's own JS runtime: it can only use Expo UI
 * components and modifiers, and nothing from module scope.
 */
function TasksActivity(props: GlanceProps, environment: LiveActivityEnvironment) {
  'widget';
  const tasks = props.tasks ?? [];
  const done = tasks.filter((t) => t.done).length;
  const left = tasks.filter((t) => !t.done);
  // Lock Screen banners follow the phone's appearance, so match it instead of
  // forcing white text, and use the system's text colors so they stay readable.
  const dark = environment.colorScheme === 'dark';
  const accent = (dark ? props.colorDark : props.color) ?? 'orange';
  const primary = { type: 'hierarchical', style: 'primary' } as const;
  const secondary = { type: 'hierarchical', style: 'secondary' } as const;
  const summary = tasks.length === 0 ? 'Nothing planned' : left.length === 0 ? 'All done 🎉' : `${done}/${tasks.length}`;

  const rows = (limit: number) =>
    left.slice(0, limit).map((task) => (
      <Button key={task.id} target={`toggle:${task.id}`} modifiers={[buttonStyle('plain'), foregroundStyle(primary)]}>
        <HStack spacing={10} modifiers={[padding({ vertical: 3 })]}>
          <Image systemName="circle" size={22} color={accent} />
          <Text modifiers={[font({ size: 18 }), foregroundStyle(primary)]}>{task.title}</Text>
          <Spacer />
        </HStack>
      </Button>
    ));

  const header = (
    <HStack>
      <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(accent)]}>
        {`${props.emoji ?? ''} ${props.label ?? 'Today'}`}
      </Text>
      <Spacer />
      <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(secondary)]}>{summary}</Text>
    </HStack>
  );

  return {
    banner: (
      <VStack
        alignment="leading"
        spacing={6}
        modifiers={[padding({ all: 16 }), activityBackgroundTint(dark ? '#1F1D1A' : '#FFFFFF')]}>
        {header}
        {/* The Lock Screen caps banners at about 160pt, so only 3 of the larger rows fit. */}
        {rows(environment.isActivityFullscreen ? 8 : 3)}
        {left.length > 3 && !environment.isActivityFullscreen ? (
          <Text modifiers={[font({ size: 12 }), foregroundStyle(secondary)]}>{`+${left.length - 3} more`}</Text>
        ) : null}
      </VStack>
    ),
    compactLeading: <Text modifiers={[font({ size: 14 })]}>{props.emoji ?? '✓'}</Text>,
    compactTrailing: (
      <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(accent)]}>
        {tasks.length === 0 ? '–' : `${done}/${tasks.length}`}
      </Text>
    ),
    minimal: (
      <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(accent)]}>{`${left.length}`}</Text>
    ),
    expandedLeading: (
      <Text modifiers={[font({ size: 15, weight: 'bold' }), foregroundStyle(accent)]}>
        {`${props.emoji ?? ''} ${props.label ?? 'Today'}`}
      </Text>
    ),
    expandedTrailing: (
      <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(secondary)]}>{summary}</Text>
    ),
    expandedBottom: <VStack alignment="leading" spacing={2}>{rows(3)}</VStack>,
  };
}

export default createLiveActivity<GlanceProps>('TasksActivity', TasksActivity);
