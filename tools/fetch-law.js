#!/usr/bin/env node
// Завантажує повний текст акта з бази LIGA:ZAKON (ips.ligazakon.net) через браузер.
// Використання: node tools/fetch-law.js <тека> <ID> [<ID> ...]
// Приклад:      node tools/fetch-law.js /tmp/laws T08_500 Z980147
// Потрібно: ips.ligazakon.net у дозволених адресах середовища; Playwright встановлено глобально
// (якщо модуль не знаходиться: NODE_PATH=$(npm root -g) node tools/fetch-law.js ...).
// Перший рядок файлу – шапка бази зі статусом акта і датою чинної редакції.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const [dir, ...ids] = process.argv.slice(2);
  if (!dir || !ids.length) { console.error('Використання: node tools/fetch-law.js <тека> <ID> [<ID> ...]'); process.exit(2); }
  fs.mkdirSync(dir, { recursive: true });
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
  const browser = await chromium.launch({ proxy });
  const ctx = await browser.newContext();
  await ctx.route(/googletagmanager|cloudflareinsights|ipify|api\.ligazakon/, r => r.abort());
  let failed = 0;
  for (const id of ids) {
    const page = await ctx.newPage();
    try {
      await page.goto('https://ips.ligazakon.net/document/' + id, { waitUntil: 'domcontentloaded', timeout: 60000 });
      // Великі акти довантажуються частинами: чекаємо, доки довжина тексту перестане змінюватися.
      let text = '', last = -1, same = 0;
      for (let i = 0; i < 40; i++) {
        await page.waitForTimeout(3000);
        const frame = page.frames().find(f => f.url().includes('lzviewservice'));
        text = await (frame || page).evaluate(() => document.body ? document.body.innerText : '').catch(() => '');
        if (text.length > 500 && text.length === last) { if (++same >= 3) break; } else same = 0;
        last = text.length;
      }
      const title = await page.title();
      if (/404/.test(title) || text.length < 500) throw new Error('документ не знайдено або текст порожній');
      const head = ((await page.evaluate(() => document.body.innerText)).split('Time Machine')[1] || '').trim().replace(/\n+/g, ' | ').slice(0, 400);
      fs.writeFileSync(path.join(dir, id + '.txt'), 'ШАПКА LIGA: ' + head + '\n\n' + text);
      const paywall = /ХОЧУ СПРОБУВАТИ LIGA360/.test(text) ? ' | УВАГА: текст показано лише частково' : '';
      console.log(id + ' | ' + title.replace(' | LIGA:ZAKON', '') + ' | символів: ' + text.length + ' | кінець: ' + text.slice(-80).replace(/\s+/g, ' ') + paywall);
    } catch (e) { failed++; console.log(id + ' | ПОМИЛКА: ' + e.message.split('\n')[0]); }
    await page.close();
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
