#!/usr/bin/env node
// Іконки зі знака «ШВ» і OG-зображення 1200×630 з першого екрана головної.
// Запуск із теки site/ (потрібен Playwright і доступ до Google Fonts):
//   python3 -m http.server 8080 &     # локальний сервер, див. README
//   node tools/make-icons-og.cjs http://localhost:8080
//   python3 tools/make-favicon-ico.py # збирає favicon.ico з PNG
const path = require('path');
const fs = require('fs');
function pw() {
  try { return require('playwright'); } catch (e) {
    const g = require('child_process').execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(path.join(g, 'playwright'));
  }
}
const { chromium } = pw();
const ROOT = path.resolve(__dirname, '..');
const BASE = (process.argv[2] || 'http://localhost:8080').replace(/\/$/, '');
const FONT = '<link href="https://fonts.googleapis.com/css2?family=Onest:wght@600&display=block" rel="stylesheet">';

// size, radius (частка), кегль (частка), повна заливка (без прозорих кутів)
const ICONS = [
  ['icons/favicon-16.png', 16, 0.22, 0.56, false],
  ['icons/favicon-32.png', 32, 0.22, 0.5, false],
  ['icons/favicon-48.png', 48, 0.22, 0.46, false],
  ['icons/apple-touch-icon.png', 180, 0, 0.38, true],
  ['icons/icon-192.png', 192, 0, 0.36, true],
  ['icons/icon-512.png', 512, 0, 0.36, true],
];

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 1 });
  for (const [file, size, r, fs_, full] of ICONS) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<!doctype html><html><head>${FONT}<style>
      html,body{margin:0;background:transparent}
      .m{width:${size}px;height:${size}px;border-radius:${full ? 0 : Math.round(size * r)}px;background:#000;color:#fff;
         display:grid;place-items:center;font:600 ${Math.round(size * fs_)}px/1 Onest,sans-serif;letter-spacing:.02em}
      </style></head><body><div class="m">ШВ</div></body></html>`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(ROOT, file), omitBackground: !full });
    console.log('✓', file);
  }
  // OG: перший екран головної на 1200 px, градієнт нерухомий, без кнопки паузи
  const og = await b.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' });
  await og.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await og.addStyleTag({ content: '.hero{height:630px!important;min-height:630px!important;max-height:none!important}.pause{display:none!important}' });
  await og.evaluate(() => document.fonts.ready);
  await og.screenshot({ path: path.join(ROOT, 'img/og.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log('✓ img/og.png');
  await b.close();
})();
