# Store assets

Play Store listing art for Life flow. Everything here is generated from code, so it can be redrawn after a design or UI change.

## Files

| File | Use in Play Console |
| --- | --- |
| `play/icon-512.png` | App icon (512 x 512, 32-bit PNG) |
| `play/feature-graphic-1024x500.png` | Feature graphic (1024 x 500) |
| `play/screenshots/*.png` | Phone screenshots (1080 x 1920, 9:16) |

The app's own icons live in `assets/images/` and are wired up in `app.json`:

- `icon.png`: full square icon (iOS, fallback)
- `android-icon-foreground.png`, `android-icon-background.png`, `android-icon-monochrome.png`: Android adaptive icon layers (themed icons use the monochrome one)
- `splash-icon.png`, `favicon.png`

## The design

Three checklist rows, one per part of the day (morning amber, work blue, evening violet), each with a wavy "flow" line. The top two are checked and the evening one is still open. Colors come from `src/lib/theme.ts`.

## Regenerating

Both scripts use Playwright's Chromium (not a project dependency).

```sh
node store-assets/src/render.js          # icons + feature graphic
npx expo export --platform web           # build dist/ for screenshots
node store-assets/src/screenshots.js     # phone screenshots with sample tasks
```

If `playwright` isn't found, install it globally or prefix with `NODE_PATH=$(npm root -g)`.
