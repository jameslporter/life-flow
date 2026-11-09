// Renders the icon set and Play Store graphics with Playwright's Chromium.
// Usage: node store-assets/src/render.js
const path = require('path');
const { chromium } = require('playwright');
const art = require('./icon');

const root = path.resolve(__dirname, '../..');
const images = path.join(root, 'assets/images');
const store = path.join(root, 'store-assets/play');

async function shot(page, html, size, file, transparent = false) {
  await page.setViewportSize(size);
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${html}</body></html>`,
  );
  await page.waitForTimeout(50);
  await page.screenshot({ path: file, omitBackground: transparent, clip: { x: 0, y: 0, ...size } });
  console.log('wrote', path.relative(root, file));
}

const fit = (svg, px) => svg.replace('width="1024" height="1024"', `width="${px}" height="${px}"`);

function feature() {
  const { C } = art;
  return `<div style="width:1024px;height:500px;position:relative;overflow:hidden;
      background:linear-gradient(160deg, ${C.bgTop}, ${C.bgBottom});font-family:Inter, sans-serif;">
    <svg width="1024" height="500" style="position:absolute;inset:0;opacity:.16">
      <path d="M-20,430 C180,380 300,480 520,430 S860,380 1060,430" stroke="${C.morning}" stroke-width="22" fill="none"/>
      <path d="M-20,468 C200,418 320,518 540,468 S880,418 1060,468" stroke="${C.work}" stroke-width="22" fill="none"/>
    </svg>
    <div style="position:absolute;left:84px;top:90px;width:320px;height:320px;border-radius:72px;overflow:hidden;
        box-shadow:0 18px 50px rgba(0,0,0,.28)">${fit(art.icon(), 320)}</div>
    <div style="position:absolute;left:460px;top:128px;right:60px;color:#fff">
      <div style="font-size:84px;font-weight:800;letter-spacing:-2px;line-height:1">Life flow</div>
      <div style="font-size:32px;font-weight:500;margin-top:22px;line-height:1.3;color:#E7F1EE">
        Daily tasks for your morning, work day, and evening.</div>
      <div style="display:flex;gap:12px;margin-top:30px">
        ${[['Morning', C.morning], ['Work', C.work], ['Evening', C.evening]]
          .map(([t, c]) => `<span style="background:${c};color:#1D1B18;font-weight:700;font-size:22px;
            padding:8px 18px;border-radius:999px">${t}</span>`).join('')}
      </div>
    </div>
  </div>`;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const s1024 = { width: 1024, height: 1024 };
  await shot(page, art.icon(), s1024, path.join(images, 'icon.png'));
  await shot(page, art.foreground(), s1024, path.join(images, 'android-icon-foreground.png'), true);
  await shot(page, art.background(), s1024, path.join(images, 'android-icon-background.png'));
  await shot(page, art.monochrome(), s1024, path.join(images, 'android-icon-monochrome.png'), true);
  await shot(page, art.splash(), s1024, path.join(images, 'splash-icon.png'), true);
  await shot(page, fit(art.icon(), 48), { width: 48, height: 48 }, path.join(images, 'favicon.png'));
  // Play wants a 32-bit PNG with alpha, so keep the alpha channel.
  await shot(page, fit(art.icon(), 512), { width: 512, height: 512 }, path.join(store, 'icon-512.png'), true);
  await shot(page, feature(), { width: 1024, height: 500 }, path.join(store, 'feature-graphic-1024x500.png'));
  await browser.close();
})();
