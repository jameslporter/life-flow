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
npm install
npm start          # Expo dev server (press w for web, or scan with Expo Go)
npm run typecheck
npm run export:web # static web build in dist/
```

Routes live in `src/app/`, shared code in `src/lib/` and `src/components/`.

## Deploy

Every push to `main` builds the web export and publishes it to GitHub Pages via `.github/workflows/deploy-pages.yml`. The site is served from `/life-flow`, set by `experiments.baseUrl` in `app.json`.

## Native builds with EAS

`eas.json` has three build profiles:

- `development`: a dev-client build for testing on your own devices
- `preview`: an internal build (APK on Android) to share with testers
- `production`: store builds, with version numbers managed by EAS

`.eas/workflows/release.yml` builds both platforms on EAS and submits iOS to TestFlight and Android to the Google Play internal track. Start it from the Workflows tab on expo.dev or with `npx eas-cli workflow:run release.yml`.

One-time setup:

1. `npx eas-cli@latest login`, then `npx eas-cli@latest init` to link the project (adds `extra.eas.projectId` and `owner` to `app.json`; commit that).
2. On expo.dev, connect this GitHub repo to the project (Project settings → GitHub) so workflows can run.
3. iOS: an Apple Developer account. Run `npx eas-cli@latest build -p ios --profile production` once to set up signing, then `npx eas-cli@latest submit -p ios` to create the App Store Connect app and API key.
4. Android: create the app in Google Play Console, upload the first build by hand (Google requires that), and add a Google service account key to EAS (`npx eas-cli@latest credentials -p android`).

Manual commands:

```bash
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --profile production --platform all
```

## Claude Code

`.claude/settings.json` enables Expo's official Claude Code plugin (`expo@claude-plugins-official`), so Claude sessions in this repo get the Expo skills.

## Morning reminder, Live Activity and widget

- **Morning reminder** (iOS and Android): turn it on under **Reminders** on the Today screen and pick a time. It's a local notification, sent only on days that have tasks.
- **Live Activity** (iPhone, iOS 17+): shows the tasks for the current part of the day on the Lock Screen and Dynamic Island. Tap a task to check it off. It starts when you tap the morning reminder (or when you open the app, if that's switched on), and ends once everything for today is done. Built with `expo-widgets` and Expo UI in `src/widgets/TasksActivity.tsx`.
- **Home screen widget** (iPhone, iOS 17+ for check-off): "Today" in small, medium and large sizes, in `src/widgets/TodayWidget.tsx`. It switches between Morning, Work and Evening on its own; period start times are in `src/lib/periods.ts`.

These need a development or store build (not Expo Go). The widget extension and its App Group (`group.com.jameslporter.lifeflow`) are created by the `expo-widgets` config plugin, and EAS sets up the matching Apple identifiers on the next `eas build`.
