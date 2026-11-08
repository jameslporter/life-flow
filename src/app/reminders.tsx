import { Button, FieldGroup, Host, Picker, Row, Spacer, Switch, Text } from '@expo/ui';
import { Alert, Platform } from 'react-native';

import { glanceSupported, syncActivity } from '@/lib/glance';
import { remindersSupported, requestReminderPermission } from '@/lib/reminders';
import { useStore } from '@/lib/store';

// Every 15 minutes from 5:00 to 11:45, stored as minutes after midnight.
const TIMES = Array.from({ length: 28 }, (_, i) => 5 * 60 + i * 15);

function formatTime(minutes: number) {
  const d = new Date();
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function notify(title: string, message: string) {
  if (Platform.OS === 'web') return;
  Alert.alert(title, message);
}

export default function Reminders() {
  const { settings, updateSettings, tasks, completions } = useStore();
  const time = settings.reminderHour * 60 + settings.reminderMinute;

  const setReminder = async (on: boolean) => {
    if (on && !(await requestReminderPermission())) {
      notify('Notifications are off', 'Turn on notifications for Life flow in Settings to get the morning reminder.');
      return;
    }
    updateSettings({ reminderEnabled: on });
  };

  return (
    <Host style={{ flex: 1 }}>
      <FieldGroup>
        {remindersSupported ? (
          <FieldGroup.Section title="Morning reminder">
            <Switch label="Remind me each morning" value={settings.reminderEnabled} onValueChange={setReminder} />
            <Row alignment="center">
              <Text>Time</Text>
              <Spacer />
              <Picker
                selectedValue={time}
                enabled={settings.reminderEnabled}
                onValueChange={(v) => updateSettings({ reminderHour: Math.floor(v / 60), reminderMinute: v % 60 })}>
                {TIMES.map((m) => (
                  <Picker.Item key={m} label={formatTime(m)} value={m} />
                ))}
              </Picker>
            </Row>
            <FieldGroup.SectionFooter>
              <Text>Sent only on days that have tasks. Tap it to see your tasks for the morning.</Text>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>
        ) : (
          <FieldGroup.Section title="Morning reminder">
            <Text>Morning reminders work in the mobile app. The Live Activity and widget are iPhone only.</Text>
          </FieldGroup.Section>
        )}

        {glanceSupported && (
          <FieldGroup.Section title="Live Activity">
            <Switch
              label="Start when I open the app"
              value={settings.liveActivityOnOpen}
              onValueChange={(v) => updateSettings({ liveActivityOnOpen: v })}
            />
            <Button label="Start it now" variant="text" onPress={() => syncActivity(tasks, completions, { start: true })} />
            <FieldGroup.SectionFooter>
              <Text>
                Shows the tasks for the current part of the day on the Lock Screen and Dynamic Island. It
                also starts when you tap the morning reminder, and ends once everything for today is done.
              </Text>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>
        )}
      </FieldGroup>
    </Host>
  );
}
