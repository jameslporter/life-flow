import { Button, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { activityBackgroundTint, buttonStyle, font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

import type { GlanceProps } from './types';

/**
 * Live Activity (Lock Screen and Dynamic Island) with the tasks for the current
 * period. Each task is a button; the press reaches the app, which checks the task
 * off and updates the activity.
 *
 * This function runs in the widget's own JS runtime: it can only use Expo UI
 * components and modifiers, and nothing from module scope. Shared pieces are
 * small components defined inside it, and colors and sizes come from `props.style`.
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
  // Only data pushed before `style` existed lacks it; these match GLANCE_STYLE.
  const style = props.style ?? {
    light: { surface: '#FFFFFF', text: '#1D1B18', muted: '#6F6A62' },
    dark: { surface: '#1F1D1A', text: '#F1EEE8', muted: '#A39D93' },
    size: { header: 15, row: 17, mark: 20, rowPad: 3, note: 13, small: 12 },
  };
  const colors = dark ? style.dark : style.light;
  // The Lock Screen is read at a glance, often from arm's length, so rows are a bit larger.
  const size = { ...style.size, row: style.size.row + 1, mark: style.size.mark + 2 };
  const label = `${props.emoji ?? ''} ${props.label ?? 'Today'}`;

  const Title = () => <Text modifiers={[font({ size: size.header, weight: 'bold' }), foregroundStyle(accent)]}>{label}</Text>;

  const Summary = () => (
    <Text modifiers={[font({ size: size.note, weight: 'semibold' }), foregroundStyle(secondary)]}>{summary}</Text>
  );

  // A plain function, not a component: a component returning a list would add a
  // fragment node to the tree, and the rows need to sit right inside their stack.
  const rows = (limit: number) =>
    left.slice(0, limit).map((task) => (
      <Button key={task.id} target={`toggle:${task.id}`} modifiers={[buttonStyle('plain'), foregroundStyle(primary)]}>
        <HStack spacing={10} modifiers={[padding({ vertical: size.rowPad })]}>
          <Image systemName="circle" size={size.mark} color={accent} />
          <Text modifiers={[font({ size: size.row }), foregroundStyle(primary)]}>{task.title}</Text>
          <Spacer />
        </HStack>
      </Button>
    ));

  // The Lock Screen caps banners at about 160pt, so only 3 of the larger rows fit.
  const bannerRows = environment.isActivityFullscreen ? 8 : 3;

  return {
    banner: (
      <VStack alignment="leading" spacing={6} modifiers={[padding({ all: 16 }), activityBackgroundTint(colors.surface)]}>
        <HStack>
          <Title />
          <Spacer />
          <Summary />
        </HStack>
        {rows(bannerRows)}
        {left.length > bannerRows ? (
          <Text modifiers={[font({ size: size.small }), foregroundStyle(secondary)]}>{`+${left.length - bannerRows} more`}</Text>
        ) : null}
      </VStack>
    ),
    // The Dynamic Island's compact and minimal spots are fixed and tiny, so their sizes stay put.
    compactLeading: <Text modifiers={[font({ size: 14 })]}>{props.emoji ?? '✓'}</Text>,
    compactTrailing: (
      <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle(accent)]}>
        {tasks.length === 0 ? '–' : `${done}/${tasks.length}`}
      </Text>
    ),
    minimal: <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(accent)]}>{`${left.length}`}</Text>,
    expandedLeading: <Title />,
    expandedTrailing: <Summary />,
    expandedBottom: (
      <VStack alignment="leading" spacing={2}>
        {rows(3)}
      </VStack>
    ),
  };
}

export default createLiveActivity<GlanceProps>('TasksActivity', TasksActivity);
