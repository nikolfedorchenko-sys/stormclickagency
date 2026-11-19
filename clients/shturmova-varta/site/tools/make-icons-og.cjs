#!/usr/bin/env node
// Іконки зі знака «ШВ» і OG-зображення img/og.jpg 1200×630 (окрема композиція, не скриншот сторінки).
// Шрифт Onest береться з fonts/ (вбудовується в сторінку), сервер і мережа не потрібні.
// Запуск із теки site/ (потрібен Playwright: npm i -g playwright && npx playwright install chromium):
//   node tools/make-icons-og.cjs
//   python3 tools/make-favicon-ico.py   # збирає favicon.ico з PNG
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
const b64 = f => fs.readFileSync(path.join(ROOT, 'fonts', f)).toString('base64');
const FONT = `<style>
@font-face{font-family:Onest;font-weight:400 600;font-display:block;src:url(data:font/woff2;base64,${b64('onest-cyrillic.woff2')}) format("woff2");unicode-range:U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116}
@font-face{font-family:Onest;font-weight:400 600;font-display:block;src:url(data:font/woff2;base64,${b64('onest-latin.woff2')}) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212}
</style>`;

// файл, розмір, радіус (частка), кегль (частка), повна заливка (без прозорих кутів)
// maskable: знак у безпечній зоні (коло 80 % у центрі) – кегль менший, тло на весь квадрат
const ICONS = [
  ['icons/favicon-16.png', 16, 0.22, 0.56, false],
  ['icons/favicon-32.png', 32, 0.22, 0.5, false],
  ['icons/favicon-48.png', 48, 0.22, 0.46, false],
  ['icons/apple-touch-icon.png', 180, 0, 0.38, true],
  ['icons/icon-192.png', 192, 0, 0.36, true],
  ['icons/icon-512.png', 512, 0, 0.36, true],
  ['icons/maskable-192.png', 192, 0, 0.27, true],
  ['icons/maskable-512.png', 512, 0, 0.27, true],
];

// OG: той самий теплий градієнт першого екрана (токени --hero-grad, --b1…--b5 з css/style.css),
// знак «ШВ» з назвою, заголовок і телефон. Усе важливе – у центральних ~1000×520 (поля 100/55 px).
const OG = `<!doctype html><html lang="uk"><head><meta charset="utf-8">${FONT}<style>
  html,body{margin:0}
  .og{position:relative;width:1200px;height:630px;overflow:hidden;font-family:Onest,sans-serif;color:#000;
      background:linear-gradient(125deg,#ffe07a 0%,#ffbd6e 26%,#ff9a86 48%,#b3b5ff 72%,#7fd3f2 100%)}
  .og span.b{position:absolute;border-radius:50%;filter:blur(70px);opacity:.85}
  .b1{width:744px;height:744px;left:-216px;top:-360px;background:#fff07e}
  .b2{width:648px;height:648px;right:-192px;top:-264px;background:#8fd8ff}
  .b3{width:600px;height:600px;left:264px;bottom:-408px;background:#ff8f73}
  .b4{width:480px;height:480px;right:72px;bottom:-312px;background:#9e9cff}
  .b5{width:408px;height:408px;left:-72px;bottom:-216px;background:#7fe8c9;opacity:.7!important}
  .in{position:absolute;left:100px;right:100px;top:55px;bottom:55px;display:flex;flex-direction:column;justify-content:space-between}
  .logo{display:flex;align-items:center;gap:20px}
  .mark{width:72px;height:72px;border-radius:12px;background:#000;color:#fff;display:grid;place-items:center;font-weight:600;font-size:29px;letter-spacing:.02em}
  .word{font-weight:600;font-size:27px;line-height:1.05}
  h1{margin:0;font-weight:500;font-size:88px;line-height:1.02;letter-spacing:-.03em;max-width:960px}
  .tel{display:flex;align-items:center;gap:16px;font-weight:500;font-size:36px;letter-spacing:-.01em}
  .tel i{width:60px;height:60px;border-radius:50%;background:#000;display:grid;place-items:center}
  .tel svg{width:28px;height:28px;fill:none;stroke:#fff;stroke-width:1.9;stroke-linejoin:round}
</style></head><body><div class="og">
  <span class="b b1"></span><span class="b b2"></span><span class="b b3"></span><span class="b b4"></span><span class="b b5"></span>
  <div class="in">
    <div class="logo"><span class="mark">ШВ</span><span class="word">Штурмова<br>варта</span></div>
    <h1>Охорона об’єктів і&nbsp;людей онлайн</h1>
    <div class="tel"><i><svg viewBox="0 0 24 24"><path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 0 1 5 4Z"/></svg></i>+380 67 549 5710</div>
  </div>
</div></body></html>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 1 });
  for (const [file, size, r, fs_, full] of ICONS) {
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<!doctype html><html><head>${FONT}<style>
      html,body{margin:0;background:transparent}
      .m{width:${size}px;height:${size}px;border-radius:${full ? 0 : Math.round(size * r)}px;background:#000;color:#fff;
         display:grid;place-items:center;font:600 ${Math.round(size * fs_)}px/1 Onest,sans-serif;letter-spacing:.02em}
      </style></head><body><div class="m">ШВ</div></body></html>`);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(ROOT, file), omitBackground: !full });
    console.log('✓', file);
  }
  await p.setViewportSize({ width: 1200, height: 630 });
  await p.setContent(OG);
  await p.evaluate(() => document.fonts.ready);
  const okFont = await p.evaluate(() => document.fonts.check('500 88px Onest', 'Охорона'));
  if (!okFont) throw new Error('Onest не завантажився – OG не збережено');
  await p.screenshot({ path: path.join(ROOT, 'img/og.jpg'), type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log('✓ img/og.jpg');
  await b.close();
})();
