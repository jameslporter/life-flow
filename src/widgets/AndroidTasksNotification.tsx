import { Checkbox, Column, Row, Text, TextButton } from '@expo/ui/jetpack-compose';
import { fillMaxWidth, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { createCustomNotification, type CustomNotificationEnvironment } from 'expo-widgets';

import type { GlanceProps } from './types';

/**
 * Android's counterpart to the iOS Live Activity: a pinned notification with the
 * tasks for the current period. Tapping a task checks it off in the notification;
 * the app picks the change up next time it runs.
 *
 * This function runs in the widget's own JS runtime: it can only use Expo UI
 * components and modifiers, and nothing from module scope.
 */
function AndroidTasksNotification(props: GlanceProps, environment: CustomNotificationEnvironment) {
  'widget';
  const dark = environment.colorScheme === 'dark';
  const accent = dark ? props.colorDark : props.color;
  const muted = dark ? '#A39D93' : '#6F6A62';
  const text = dark ? '#F1EEE8' : '#1D1B18';
  const tasks = props.tasks ?? [];
  const done = tasks.filter((t) => t.done).length;
  const left = tasks.filter((t) => !t.done);
  // This period is over and nothing later today is left. The app takes the notification
  // down next time it runs; until then, don't show stale tasks.
  const over = props.endsAt <= Date.now() && (props.later ?? []).length === 0;
  const summary = over
    ? 'Nothing left for today'
    : tasks.length === 0 ? 'Nothing planned' : left.length === 0 ? 'All done 🎉' : `${done} of ${tasks.length} done`;

  const header = (
    <Text color={accent} style={{ fontSize: 15, fontWeight: 'bold' }}>
      {`${props.emoji} ${props.label} · ${summary}`}
    </Text>
  );

  return {
    // Not drawn: only `collapsed` and `expanded` are. The app presses this button natively
    // when a part of the day starts (see GlanceRefreshReceiver.kt), and its handler moves
    // on to the next period with tasks left, which redraws the notification.
    tick: (
      <TextButton
        {...({ target: 'tick' } as object)}
        onClick={() => {
          const now = Date.now();
          let next = { ...props, later: props.later ?? [] };
          while (next.endsAt <= now && next.later.length > 0) {
            const [upcoming, ...rest] = next.later;
            next = { ...next, ...upcoming, later: rest };
          }
          return next as unknown as void;
        }}>
        <Text>{''}</Text>
      </TextButton>
    ),
    collapsed: (
      <Column modifiers={[fillMaxWidth()]}>
        {header}
        <Text color={muted} maxLines={1} style={{ fontSize: 13 }}>
          {over ? 'See you tomorrow.' : left.length > 0 ? `Next: ${left[0].title}` : 'Nice work.'}
        </Text>
      </Column>
    ),
    expanded: (
      <Column modifiers={[fillMaxWidth(), paddingAll(4)]}>
        {header}
        {(over ? [] : left).slice(0, 4).map((task) => (
          <TextButton
            key={task.id}
            // `target` names the press; the TS types for Compose buttons don't list it yet.
            {...({ target: `toggle:${task.id}` } as object)}
            modifiers={[fillMaxWidth()]}
            onClick={() => {
              // Check the task off; once this period is done, show the next one with tasks left.
              const mark = (list: typeof tasks) => list.map((t) => (t.id === task.id ? { ...t, done: true } : t));
              let next = { ...props, checked: [...(props.checked ?? []), task.id], tasks: mark(tasks), later: (props.later ?? []).map((p) => ({ ...p, tasks: mark(p.tasks) })) };
              while (next.tasks.every((t) => t.done) && next.later.length > 0) {
                const [upcoming, ...rest] = next.later;
                next = { ...next, ...upcoming, later: rest };
              }
              return next as unknown as void;
            }}>
            <Row verticalAlignment="center" modifiers={[fillMaxWidth()]}>
              <Checkbox value={false} colors={{ uncheckedColor: accent }} />
              <Text color={text} maxLines={1} style={{ fontSize: 14 }}>
                {task.title}
              </Text>
            </Row>
          </TextButton>
        ))}
        {!over && left.length > 4 ? (
          <Text color={muted} style={{ fontSize: 12 }}>{`+${left.length - 4} more`}</Text>
        ) : null}
      </Column>
    ),
  };
}

export default createCustomNotification<GlanceProps>('TasksNotification', AndroidTasksNotification);
