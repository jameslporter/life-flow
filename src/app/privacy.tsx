import { Button, FieldGroup, Host, Text } from '@expo/ui';
import { Linking } from 'react-native';

const EFFECTIVE_DATE = 'November 9, 2026';
const CONTACT_URL = 'https://github.com/jameslporter/life-flow/issues';

/**
 * The app's privacy policy. Its web build is the public URL listed in the app stores:
 * https://jameslporter.github.io/life-flow/privacy
 */
const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'The short version',
    body: [
      'Life flow keeps everything on your device. There are no accounts, no servers and no tracking. We never collect, see, sell or share your data.',
    ],
  },
  {
    title: 'What the app stores',
    body: [
      'The tasks you create, the days you check them off and your settings (such as your reminder time) are saved only on your device, in the app’s own storage. On the web version they are saved in your browser’s local storage.',
      'This data never leaves your device. Life flow has no backend: it does not send your data to us or to anyone else.',
    ],
  },
  {
    title: 'What we don’t collect',
    body: [
      'We don’t collect personal information such as your name, email address, contacts, location or device identifiers.',
      'Life flow has no analytics, no advertising, no crash reporting services and no third-party tracking code. It does not track you across other apps or websites.',
    ],
  },
  {
    title: 'Permissions',
    body: [
      'Notifications: when you first open the app, Life flow asks to send notifications for the morning reminder, which is on by default. Reminders are scheduled on your device as local notifications; nothing is sent through a push server. On Android the same permission is used to pin the current part of your day’s tasks to your notifications so you can check them off there.',
      'Live Activity (iPhone): when it is on (the default), your tasks for the current part of the day appear on the Lock Screen and in the Dynamic Island. This is shown by your device and is not sent anywhere.',
      'Home screen widget: the widget shows your tasks for the current part of the day. To do this the app shares your task list with its own widget through storage on your device.',
      'Background refresh: the app may run briefly in the background so the widget and reminders stay up to date. This happens on your device and makes no network requests.',
      'You can turn any of these off at any time in the app’s Reminders screen or in your device’s settings.',
    ],
  },
  {
    title: 'Sharing and selling',
    body: ['We don’t share, sell or transfer any data, because we never receive any.'],
  },
  {
    title: 'Keeping and deleting your data',
    body: [
      'Your data stays on your device until you delete it. You can delete individual tasks in the app, or remove everything by uninstalling the app. On the web, clearing this site’s data in your browser removes it.',
      'Because we hold no copy of your data, we can’t recover it for you, and there is nothing for us to delete on request.',
    ],
  },
  {
    title: 'Children',
    body: [
      'Life flow is a general-audience app. It does not knowingly collect information from anyone, including children under 13.',
    ],
  },
  {
    title: 'Changes to this policy',
    body: [
      'If this policy changes, the new version will be posted on this page with a new effective date. If the app ever starts collecting data, this policy will be updated before that happens.',
    ],
  },
  {
    title: 'Contact',
    body: ['Questions about this policy? Open an issue on the project’s GitHub page.'],
  },
];

export default function Privacy() {
  return (
    <Host style={{ flex: 1 }}>
      <FieldGroup>
        <FieldGroup.Section>
          <Text textStyle={{ fontSize: 22, fontWeight: 'bold' }}>Life flow privacy policy</Text>
          <Text>{`Effective ${EFFECTIVE_DATE}`}</Text>
        </FieldGroup.Section>
        {SECTIONS.map((s) => (
          <FieldGroup.Section key={s.title} title={s.title}>
            <Text>{s.body.join('\n\n')}</Text>
            {s.title === 'Contact' && (
              <Button label="Open GitHub issues" variant="text" onPress={() => Linking.openURL(CONTACT_URL)} />
            )}
          </FieldGroup.Section>
        ))}
      </FieldGroup>
    </Host>
  );
}
