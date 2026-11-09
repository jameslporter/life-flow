// Captures phone screenshots (1080x1920) of the web build with sample tasks.
// Usage: npx expo export --platform web && node store-assets/src/screenshots.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../..');
const dist = path.join(root, 'dist');
const out = path.join(root, 'store-assets/play/screenshots');
const ORIGIN = 'http://life-flow.test';

const WD = [1, 2, 3, 4, 5];
const ALL = [0, 1, 2, 3, 4, 5, 6];
const tasks = [
  ['m1', 'Drink a glass of water', 'morning', ALL],
  ['m2', 'Stretch for 10 minutes', 'morning', ALL],
  ['m3', 'Pack lunch', 'morning', WD],
  ['w1', 'Review today’s calendar', 'work', WD],
  ['w2', 'Clear inbox to zero', 'work', WD],
  ['w3', 'Stand up and walk at lunch', 'work', WD],
  ['e1', 'Tidy the kitchen', 'evening', ALL],
  ['e2', 'Lay out tomorrow’s clothes', 'evening', WD],
  ['e3', 'Read for 20 minutes', 'evening', ALL],
].map(([id, title, group, days], i) => ({ id, title, group, days, createdAt: 1767225600000 + i }));

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fileFor(urlPath) {
  let p = decodeURIComponent(urlPath.replace(/^\/life-flow/, '')) || '/';
  if (p === '/') p = '/index';
  const direct = path.join(dist, p);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  if (fs.existsSync(direct + '.html')) return direct + '.html';
  if (p.startsWith('/task/')) return path.join(dist, 'task/[id].html');
  return path.join(dist, '+not-found.html');
}

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.json': 'application/json' };

async function capture(browser, name, route, scheme, scroll = 0) {
  const context = await browser.newContext({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    colorScheme: scheme,
    isMobile: true,
    hasTouch: true,
  });
  await context.route(`${ORIGIN}/**`, (r) => {
    const file = fileFor(new URL(r.request().url()).pathname);
    r.fulfill({ path: file, contentType: types[path.extname(file)] || 'application/octet-stream' });
  });
  const today = dateKey(new Date());
  const data = { tasks, completions: { [today]: ['m1', 'm2', 'm3', 'w1'] },
    settings: { reminderEnabled: true, reminderHour: 7, reminderMinute: 0 } };
  await context.addInitScript((d) => localStorage.setItem('life-flow/v1', d), JSON.stringify(data));
  const page = await context.newPage();
  await page.goto(`${ORIGIN}/life-flow${route}`, { waitUntil: 'networkidle' });
  if (scroll) {
    await page.mouse.move(180, 400);
    await page.mouse.wheel(0, scroll);
  }
  await page.waitForTimeout(800);
  const file = path.join(out, `${name}.png`);
  await page.screenshot({ path: file });
  console.log('wrote', path.relative(root, file));
  await context.close();
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  await capture(browser, '1-today', '/', 'light');
  await capture(browser, '2-all-tasks', '/tasks', 'light');
  await capture(browser, '3-edit-task', '/task/w2', 'light');
  await capture(browser, '4-today-evening', '/', 'light', 700);
  await capture(browser, '5-today-dark', '/', 'dark');
  await browser.close();
})();
