// Знімає перший екран (hero.html) у трьох палітрах: десктоп 1440×900 і мобільний 360×760 (×2).
// Запуск: node clients/shturmova-varta/design/concept-diia/build/hero-shots.cjs
const path = require('path');
const g = require('child_process').execSync('npm root -g').toString().trim();
let pw; try { pw = require('playwright'); } catch (e) { pw = require(path.join(g, 'playwright')); }
const dir = path.resolve(__dirname, '..');
(async () => {
  const b = await pw.chromium.launch();
  for (const p of ['mint', 'brass', 'signal']) {
    for (const v of [{ w: 1440, h: 900, s: 1, n: '1440' }, { w: 360, h: 760, s: 2, n: '360', m: true }]) {
      const ctx = await b.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.s, isMobile: !!v.m, hasTouch: !!v.m });
      const pg = await ctx.newPage();
      await pg.goto('file://' + path.join(dir, 'hero.html') + '?p=' + p, { waitUntil: 'networkidle' });
      await pg.evaluate(() => document.fonts.ready);
      await pg.waitForTimeout(900);
      await pg.screenshot({ path: path.join(dir, 'img', `hero-${p}-${v.n}.png`) });
      await ctx.close();
    }
  }
  await b.close();
  console.log('ok');
})();
