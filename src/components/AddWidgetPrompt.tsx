import { Button, Column, Host, Row, Spacer, Text } from '@expo/ui';

import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { useHomeWidget } from '@/lib/useHomeWidget';

/**
 * Asks to add the Today widget to the home screen, on Android launchers that let us do
 * that in one tap. Hidden once the widget is placed, or after the user closes it.
 */
export function AddWidgetPrompt() {
  const theme = useTheme();
  const { ready, settings, updateSettings } = useStore();
  const { canAdd, placed, add } = useHomeWidget();

  if (!ready || !canAdd || placed || settings.widgetPromptDismissed) return null;

  return (
    <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
      <Column
        spacing={6}
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 14,
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: 6,
          width: '100%',
        }}>
        <Text textStyle={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Add Life flow to your home screen</Text>
        <Text textStyle={{ fontSize: 14, color: theme.muted }}>
          See this part of the day’s tasks and check them off without opening the app.
        </Text>
        <Row alignment="center">
          <Spacer flexible />
          <Button label="Not now" variant="text" onPress={() => updateSettings({ widgetPromptDismissed: true })} />
          <Button label="Add widget" onPress={add} />
        </Row>
      </Column>
    </Host>
  );
}
