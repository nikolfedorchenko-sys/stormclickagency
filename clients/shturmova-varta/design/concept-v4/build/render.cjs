// Рендер HTML/SVG у PNG через headless Chromium (Playwright).
// node render.cjs <файл> <out.png> <ширина> <висота> [масштаб] [очікування-мс]
// Для WebGL: SwiftShader (--use-gl=swiftshader, --enable-unsafe-swiftshader).
const path = require('path');
const { execSync } = require('child_process');
let pw; try { pw = require('playwright'); } catch (e) { pw = require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); }
(async () => {
  const [file, out, w = 1200, h = 1200, scale = 1, wait = 300] = process.argv.slice(2);
  const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +scale });
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.text()); });
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  const url = /^https?:/.test(file) ? file : 'file://' + path.resolve(file);
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  if (+wait > 0) await page.waitForTimeout(+wait);
  try { await page.waitForFunction(() => !window.__busy, null, { timeout: 120000 }); } catch (e) { console.log('timeout __busy'); }
  await page.screenshot({ path: out, omitBackground: true });
  await browser.close();
  console.log('ok', out);
})();
