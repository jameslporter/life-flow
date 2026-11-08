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
