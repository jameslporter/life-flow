import { Column, Host, Row, Spacer, Text } from '@expo/ui';
import { Button, Text as ComposeText, TextButton } from '@expo/ui/jetpack-compose';

import { useStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { useHomeWidget } from '@/lib/useHomeWidget';

/**
 * Asks to add the Today widget to the home screen, on Android launchers that let us do
 * that in one tap. Only Android can ask, so other platforms get the empty AddWidgetPrompt.tsx. Hidden once the widget is placed, or after the user closes it.
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
          <TextButton
            colors={{ contentColor: theme.primary }}
            onClick={() => updateSettings({ widgetPromptDismissed: true })}>
            <ComposeText>Not now</ComposeText>
          </TextButton>
          <Button colors={{ containerColor: theme.primary, contentColor: theme.primaryText }} onClick={add}>
            <ComposeText>Add widget</ComposeText>
          </Button>
        </Row>
      </Column>
    </Host>
  );
}
