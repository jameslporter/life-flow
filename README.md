# Life flow

A small Expo Router app (iOS, Android, web) that reminds you of your daily tasks, grouped into **Morning**, **Work**, and **Evening**. New tasks repeat on weekdays (Mon–Fri) by default; switch a task to **All week** or pick individual days.

Live web version: https://jameslporter.github.io/life-flow/

## Features (v1)

- Today view with tasks grouped by part of the day, tap to check off
- Week strip to look at any day this week
- Add, edit, and delete tasks; choose Weekdays, All week, or specific days
- Data saved on the device (AsyncStorage / browser localStorage)

## Develop

```bash
bun install
bun start          # Expo dev server (press w for web, a for Android, i for iOS)
bun run typecheck
bun run export:web # static web build in dist/
```

Routes live in `src/app/`, shared code in `src/lib/` and `src/components/`.

This app uses native modules (`expo-widgets`, `expo-background-task`, `modules/widget-props`) that aren't in Expo Go, so `bun start` needs a development build installed on the simulator/device/emulator — see below.

## Deploy

Every push to `main` builds the web export and publishes it to GitHub Pages via `.github/workflows/deploy-pages.yml`. The site is served from `/life-flow`, set by `experiments.baseUrl` in `app.json`.

## Development builds (CNG)

There's no `ios/` or `android/` directory in this repo — Expo's Continuous Native Generation (CNG) creates native projects on demand from `app.json` and the config plugins, and they're gitignored. Never hand-edit generated `ios/`/`android/` folders; change native behavior through `app.json` or a config plugin instead.

Because this app has native modules (`expo-widgets`, `expo-background-task`, `modules/widget-props`), it needs a development build rather than Expo Go:

```bash
bun run android   # bunx expo run:android — builds + installs on an emulator/device, needs Android Studio's SDK
bun run ios       # bunx expo run:ios — builds + installs on a simulator/device, needs Xcode (macOS only)
```

Rebuild only when native deps change (new library with native code, config plugin change, or `app.json` edit); otherwise `bun start` reuses the installed dev client. To build in the cloud instead of locally, use the `development` EAS profile below.

## Native builds with EAS

EAS is already set up for this project: `app.json` has `extra.eas.projectId`/`owner`, and this GitHub repo is connected on expo.dev so workflows can run.

`eas.json` has three build profiles:

- `development`: a dev-client build for testing on your own devices (cloud equivalent of `expo run:android|ios` above)
- `preview`: an internal build (APK on Android) to share with testers
- `production`: store builds, with version numbers managed by EAS

`.eas/workflows/release.yml` builds both platforms on EAS and submits iOS to TestFlight and Android to the Google Play internal track. Start it from the Workflows tab on expo.dev or with `bunx eas-cli workflow:run release.yml`.

Manual commands:

```bash
bunx eas-cli@latest build --profile development --platform android   # cloud dev-client build
bunx eas-cli@latest build --profile production --platform all
bunx eas-cli@latest submit --profile production --platform all
```

## Claude Code

`.claude/settings.json` enables Expo's official Claude Code plugin (`expo@claude-plugins-official`), so Claude sessions in this repo get the Expo skills.

## Morning reminder, Live Activity and widgets

- **Morning reminder** (iOS and Android): on by default for new installs (the app asks for notification permission on first launch); change it under **Reminders** on the Today screen and pick a time. It's a local notification, sent only on days that have tasks.
- **Live Activity** (iPhone, iOS 17+): shows the tasks for the current part of the day on the Lock Screen and Dynamic Island. Tap a task to check it off. `src/widgets/TasksActivity.tsx`.
- **Pinned notification** (Android): the Android counterpart, an ongoing notification listing the current tasks with tap-to-check. `src/widgets/AndroidTasksNotification.tsx`.
- **Home screen widget** "Today": iOS in `src/widgets/TodayWidget.tsx`, Android in `src/widgets/AndroidTodayWidget.tsx`. Tap a task to check it off on the widget.

The Live Activity / pinned notification starts when you tap the morning reminder (or whenever the app opens, which is on by default for new installs). Checking off the last task in a part of the day moves it on to the next part that still has tasks, and it goes away once nothing is left for today. On iOS, presses on the Live Activity are handled natively by `modules/activity-checks` (it updates the activity and records the check-off for the app), because the app's JavaScript may not be running when the button is pressed. A background task (`src/lib/backgroundRefresh.native.ts`) moves the widget and activity on to the next part of the day about every 30 minutes; the period start times are in `src/lib/periods.ts`.

Everything is drawn with Expo UI through `expo-widgets` (SwiftUI on iOS, Jetpack Compose / Glance on Android). The one piece of native code is `modules/widget-props`, a small local module that reads an Android widget's state so the app can pick up check-offs made on it.

These need a development or store build (not Expo Go). The iOS widget extension and its App Group (`group.com.jameslporter.lifeflow`) are created by the `expo-widgets` config plugin, and EAS sets up the matching Apple identifiers on the next `eas build`.
