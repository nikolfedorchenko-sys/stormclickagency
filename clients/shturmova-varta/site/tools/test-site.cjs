#!/usr/bin/env node
// Наскрізна перевірка сайту в Playwright (Chromium). Нічого нікуди не надсилає: адресу заявок
// підміняємо на тестову і перехоплюємо запит у браузері.
// Запуск із теки site/:  node tools/serve.cjs 8080 &   node tools/test-site.cjs http://localhost:8080 [тека-для-знімків]
const path = require('path');
const fs = require('fs');
function pw() {
  try { return require('playwright'); } catch (e) {
    const g = require('child_process').execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(path.join(g, 'playwright'));
  }
}
const { chromium } = pw();
const BASE = (process.argv[2] || 'http://localhost:8080').replace(/\/$/, '');
const SHOTS = process.argv[3] ? path.resolve(process.argv[3]) : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const FAKE = 'https://zayavky.test.invalid/lead';
const CFG = fs.readFileSync(path.join(__dirname, '..', 'js', 'config.js'), 'utf8');

let pass = 0, fail = 0;
const errors = [];
function ok(cond, name, extra) {
  if (cond) { pass++; console.log('  ок   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
}
async function newPage(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1440, height: 900 }, isMobile: !!opts.mobile, hasTouch: !!opts.mobile, reducedMotion: 'reduce' });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' && !(opts.allow && opts.allow.test(m.text()))) errors.push(`[${opts.tag || ''}] ${m.text()}`); });
  page.on('pageerror', e => errors.push(`[${opts.tag || ''}] pageerror ${e.message}`));
  if (opts.cfg) { // підмінений config.js: ENDPOINT і антиспам для тесту
    await page.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: CFG + '\nObject.assign(window.SV_CONFIG,' + JSON.stringify(opts.cfg) + ');' }));
  }
  return page;
}
const val = (p, sel) => p.$eval(sel, e => e.value);
const text = (p, sel) => p.$eval(sel, e => e.textContent.trim());

async function toStep4(p, query = '') {
  await p.goto(BASE + '/wizard.html' + query, { waitUntil: 'networkidle' });
  await p.click('.opt[data-v="object"]'); await p.click('[data-act="next"]');
  await p.click('.opt[data-v="Склад чи виробництво"]');
  await p.fill('#f-addr', 'Київ, Оболонь');
  await p.click('[data-act="next"]');
  await p.click('.opt[data-v="Цілодобово"]'); await p.click('.chip[data-v="Якнайшвидше"]');
  await p.click('[data-act="next"]');
  await p.waitForSelector('#f-name');
}

(async () => {
  const b = await chromium.launch();

  /* ---------- 1. Повний прохід майстра, ENDPOINT порожній (як зараз у config.js) ---------- */
  console.log('\n1. Майстер, ENDPOINT не задано');
  for (const vp of [{ w: 1440, h: 900 }, { w: 360, h: 800, mobile: true }]) {
    const p = await newPage(b, { viewport: { width: vp.w, height: vp.h }, mobile: vp.mobile, tag: 'wizard-' + vp.w });
    let posted = 0; p.on('request', r => { if (r.method() === 'POST') posted++; });
    await p.goto(BASE + '/wizard.html', { waitUntil: 'networkidle' });
    ok(await p.$eval('[data-act="next"]', e => e.disabled), `${vp.w}: «Далі» вимкнена без вибору`);
    await p.click('.opt[data-v="object"]');
    ok(!(await p.$eval('[data-act="next"]', e => e.disabled)), `${vp.w}: «Далі» активна після вибору`);
    await p.click('[data-act="next"]');
    ok((await text(p, '#wq')) === 'Який це об’єкт?', `${vp.w}: крок 2`);
    await p.click('.opt[data-v="Склад чи виробництво"]'); await p.fill('#f-addr', 'Київ, Оболонь'); await p.click('[data-act="next"]');
    ok((await text(p, '#wq')) === 'Коли потрібна охорона?', `${vp.w}: крок 3`);
    await p.click('.opt[data-v="Цілодобово"]'); await p.click('.chip[data-v="Якнайшвидше"]'); await p.click('[data-act="next"]');
    ok((await text(p, '#wq')) === 'Як з вами зв’язатися?', `${vp.w}: крок 4`);
    // порожні поля
    await p.click('button[type="submit"]');
    ok((await text(p, '#e-name')) === 'Вкажіть ім’я – так менеджер знатиме, як до вас звертатися', `${vp.w}: помилка імені`);
    ok((await text(p, '#e-phone')) === 'Вкажіть телефон – на нього передзвонить менеджер', `${vp.w}: помилка телефону`);
    ok(await p.evaluate(() => document.activeElement.id) === 'f-name', `${vp.w}: фокус на першому полі з помилкою`);
    await p.waitForTimeout(120);
    ok((await text(p, '#live')) === 'Перевірте два поля: ім’я і телефон', `${vp.w}: живий регіон`);
    if (SHOTS) await p.screenshot({ path: path.join(SHOTS, `wizard-${vp.w}-step4-errors.png`), fullPage: true });
    await p.fill('#f-name', '12'); await p.click('#f-phone'); await p.keyboard.type('67123');
    await p.click('button[type="submit"]');
    ok((await text(p, '#e-name')) === 'Ім’я – хоча б 2 літери', `${vp.w}: «12» – не ім’я`);
    ok((await text(p, '#e-phone')) === 'Номер неповний: після +380 потрібно 9 цифр', `${vp.w}: неповний номер`);
    await p.fill('#f-name', 'Олена'); await p.fill('#f-phone', '0671234567');
    await p.waitForTimeout(3100); // мінімальний час заповнення
    await p.click('button[type="submit"]');
    await p.waitForSelector('.done-mark.warn');
    ok((await text(p, '#wq')) === 'Заявку не вдалося надіслати онлайн', `${vp.w}: стан «не вдалося надіслати онлайн»`);
    ok(!(await p.$('text=Заявку надіслано')), `${vp.w}: немає хибного «Заявку надіслано»`);
    ok(posted === 0, `${vp.w}: жодного POST-запиту`, posted);
    const sum = await p.$$eval('.sum div', ds => ds.map(d => d.textContent));
    ok(sum.join('|') === 'ПослугаОб’єкт|Об’єктСклад чи виробництво|АдресаКиїв, Оболонь|ГрафікЦілодобово, якнайшвидше|Ім’яОлена|Зв’язокДзвінок · +380 67 123 45 67', `${vp.w}: усі відповіді в підсумку`, sum);
    ok((await p.$$eval('a[href="tel:+380675495710"]', a => a.length)) >= 2, `${vp.w}: кнопка і номер «Подзвонити»`);
    ok(await p.evaluate(() => document.activeElement.id) === 'wq', `${vp.w}: фокус на заголовку стану`);
    ok(await p.$eval('.w-call', e => e.hidden), `${vp.w}: бокова плашка «Подзвоніть» схована`);
    if (SHOTS) await p.screenshot({ path: path.join(SHOTS, `wizard-${vp.w}-offline.png`), fullPage: true });
    await p.click('[data-act="edit"]');
    ok((await val(p, '#f-name')) === 'Олена' && (await val(p, '#f-phone')) === '+380 67 123 45 67', `${vp.w}: «Змінити відповіді» – відповіді збережені`);
    await p.context().close();
  }

  /* ---------- 2. ENDPOINT задано: надсилання, помилка, повтор, тіло заявки ---------- */
  console.log('\n2. Майстер, ENDPOINT задано (тестова адреса, перехоплення)');
  {
    const p = await newPage(b, { cfg: { ENDPOINT: FAKE, MIN_FILL_MS: 0 }, tag: 'endpoint', allow: /status of 500/ }); // 500 – навмисна помилка тестового сервера
    let calls = 0, body = null;
    await p.route(FAKE, async r => {
      calls++; body = JSON.parse(r.request().postData());
      await new Promise(res => setTimeout(res, 600));
      if (calls === 1) return r.fulfill({ status: 500, body: '{}' });
      return r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await toStep4(p, '?utm_source=test&utm_campaign=c1');
    await p.fill('#f-name', 'Петро'); await p.fill('#f-phone', '+38 (067) 123-45-67');
    await p.click('button[type="submit"]');
    await p.waitForSelector('.btn.is-loading');
    ok((await text(p, '.btn.is-loading')) === 'Надсилаємо…', 'стан «Надсилаємо…»');
    ok(await p.$eval('#f-name', e => e.disabled) && await p.$eval('#contact', e => e.getAttribute('aria-busy') === 'true'), 'поля вимкнені, aria-busy');
    if (SHOTS) await p.screenshot({ path: path.join(SHOTS, 'wizard-1440-sending.png'), fullPage: true });
    await p.waitForSelector('#send-err');
    ok((await text(p, '#send-err h3')) === 'Не вдалося надіслати заявку', 'помилка сервера → блок «Не вдалося надіслати заявку»');
    ok(await p.evaluate(() => document.activeElement.id) === 'send-err', 'фокус на блоці помилки');
    if (SHOTS) await p.screenshot({ path: path.join(SHOTS, 'wizard-1440-send-error.png'), fullPage: true });
    await p.click('#send-err button[type="submit"]');
    await p.waitForSelector('.done-mark:not(.warn)');
    ok((await text(p, '#wq')) === 'Заявку надіслано', 'повтор → «Заявку надіслано»');
    ok(calls === 2, 'два запити: помилка і повтор', calls);
    ok(body && body.phone === '+380671234567' && body.name === 'Петро' && body.details === 'Склад чи виробництво' && body.address === 'Київ, Оболонь'
      && body.schedule === 'Цілодобово' && body.start === 'Якнайшвидше' && body.channel === 'Дзвінок' && body.company === '' && body.utm_source === 'test' && body.utm_campaign === 'c1'
      && /Ім’я: Петро/.test(body.message), 'тіло заявки (JSON)', body);
    if (SHOTS) await p.screenshot({ path: path.join(SHOTS, 'wizard-1440-done.png'), fullPage: true });
    await p.context().close();
  }
  {
    const p = await newPage(b, { cfg: { ENDPOINT: FAKE, MIN_FILL_MS: 0, ENDPOINT_FORMAT: 'form' }, tag: 'endpoint-form' });
    let ct = '', body = '';
    await p.route(FAKE, r => { ct = r.request().headers()['content-type']; body = r.request().postData(); r.fulfill({ status: 200, body: '{}' }); });
    await toStep4(p); await p.fill('#f-name', 'Ія'); await p.fill('#f-phone', '671234567'); await p.click('button[type="submit"]');
    await p.waitForSelector('.done-mark:not(.warn)');
    ok(/x-www-form-urlencoded/.test(ct) && /phone=%2B380671234567/.test(body), 'ENDPOINT_FORMAT: form', ct);
    await p.context().close();
  }
  {
    const p = await newPage(b, { cfg: { ENDPOINT: FAKE, MIN_FILL_MS: 0, TIMEOUT_MS: 800 }, tag: 'timeout' });
    await p.route(FAKE, () => { /* не відповідаємо */ });
    await toStep4(p); await p.fill('#f-name', 'Ія'); await p.fill('#f-phone', '671234567'); await p.click('button[type="submit"]');
    await p.waitForSelector('#send-err', { timeout: 5000 });
    ok(true, 'сервер мовчить → помилка після TIMEOUT_MS');
    await p.context().close();
  }

  /* ---------- 3. Антиспам ---------- */
  console.log('\n3. Антиспам');
  {
    const p = await newPage(b, { cfg: { ENDPOINT: FAKE, MIN_FILL_MS: 0 }, tag: 'honeypot' });
    let calls = 0; await p.route(FAKE, r => { calls++; r.fulfill({ status: 200, body: '{}' }); });
    await toStep4(p);
    ok(await p.$eval('#f-company', e => e.tabIndex === -1 && e.closest('.hp').getAttribute('aria-hidden') === 'true' && e.getBoundingClientRect().right < 0), 'пастка поза екраном, tabindex −1, aria-hidden');
    await p.fill('#f-name', 'Бот'); await p.fill('#f-phone', '671234567');
    await p.$eval('#f-company', e => { e.value = 'spam inc'; });
    await p.click('button[type="submit"]');
    await p.waitForSelector('.done-mark.warn');
    ok(calls === 0, 'заповнена пастка → запит не надіслано', calls);
    ok((await text(p, '#wq')) === 'Заявку не вдалося надіслати онлайн', 'заповнена пастка → «подзвоніть», не «надіслано»');
    await p.context().close();
  }
  {
    const p = await newPage(b, { cfg: { ENDPOINT: FAKE, MIN_FILL_MS: 60000 }, tag: 'too-fast' });
    let calls = 0; await p.route(FAKE, r => { calls++; r.fulfill({ status: 200, body: '{}' }); });
    await toStep4(p); await p.fill('#f-name', 'Швидкий'); await p.fill('#f-phone', '671234567'); await p.click('button[type="submit"]');
    await p.waitForSelector('.done-mark.warn');
    ok(calls === 0, 'надто швидко (< MIN_FILL_MS) → запит не надіслано', calls);
    await p.context().close();
  }
  {
    const p = await newPage(b, { cfg: { EMAIL: 'test@example.com', TELEGRAM_URL: 'https://t.me/example', LINE_HOURS: 'щодня 08:00–22:00', CALLBACK_TIME: 'протягом 30 хвилин' }, tag: 'cfg' });
    await toStep4(p);
    ok(!(await p.$('text=Telegram і Viber – [уточнити], чи підключені.')), 'TELEGRAM_URL задано → рядок «[уточнити], чи підключені» сховано');
    await p.fill('#f-name', 'Ія'); await p.fill('#f-phone', '671234567'); await p.waitForTimeout(3100); await p.click('button[type="submit"]');
    await p.waitForSelector('.done-mark.warn');
    const mail = await p.$eval('a[href^="mailto:"]', a => decodeURIComponent(a.href));
    ok(/^mailto:test@example.com\?subject=Заявка з сайту/.test(mail) && /Ім’я: Ія/.test(mail) && /Зв’язок: Дзвінок · \+380 67 123 45 67/.test(mail), 'EMAIL задано → mailto з відповідями', mail);
    ok(!!(await p.$('a[href="https://t.me/example"]')), 'кнопка Telegram');
    ok(/щодня 08:00–22:00/.test(await text(p, '.w-sub')), 'графік лінії з config.js');
    await p.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
    ok((await text(p, '#p-call .hint')) === 'Графік роботи лінії – щодня 08:00–22:00', 'головна: графік лінії з config.js');
    ok(/Коли саме – протягом 30 хвилин\./.test(await text(p, '#yak p')), 'головна: час дзвінка з config.js');
    await p.context().close();
  }

  /* ---------- 4. Маска телефону: тест-кейси README макета ---------- */
  console.log('\n4. Маска телефону');
  {
    const p = await newPage(b, { tag: 'mask' });
    const WANT = '+380 67 123 45 67';
    const INPUTS = ['+380671234567', '380671234567', '+38 (067) 123-45-67', '0671234567', '671234567'];
    await toStep4(p);
    const mod = 'Control';
    async function reset(v) { await p.$eval('#f-phone', (e, v) => { e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); }, v); }
    async function clip(t) { await p.evaluate(t => navigator.clipboard.writeText(t), t); }
    async function tabIn() { await p.focus('#f-name'); await p.keyboard.press('Tab'); }
    const methods = {
      'набір у кінець': async s => { await reset('+380 '); await p.click('#f-phone'); await p.keyboard.press('End'); await p.keyboard.type(s); },
      'Ctrl+A + набір': async s => { await reset('+380 '); await p.click('#f-phone'); await p.keyboard.press(mod + '+a'); await p.keyboard.type(s); },
      'вставка в кінець': async s => { await reset('+380 '); await clip(s); await p.click('#f-phone'); await p.keyboard.press('End'); await p.keyboard.press(mod + '+v'); },
      'Ctrl+A + вставка': async s => { await reset('+380 '); await clip(s); await p.click('#f-phone'); await p.keyboard.press(mod + '+a'); await p.keyboard.press(mod + '+v'); },
      'fill': async s => { await p.fill('#f-phone', s); },
      'Tab у «+380 67 1» + набір': async s => { await reset('+380 67 1'); await tabIn(); await p.keyboard.type(s); },
      'Tab у «+380 67 1» + вставка': async s => { await reset('+380 67 1'); await clip(s); await tabIn(); await p.keyboard.press(mod + '+v'); },
      'Tab у повний + вставка': async s => { await reset('+380 50 111 22 33'); await clip(s); await tabIn(); await p.keyboard.press(mod + '+v'); },
      'курсор у кінці повного + вставка': async s => { await reset('+380 50 111 22 33'); await clip(s); await p.click('#f-phone'); await p.keyboard.press('End'); await p.keyboard.press(mod + '+v'); },
    };
    let n = 0, bad = [];
    for (const s of INPUTS) for (const [m, fn] of Object.entries(methods)) {
      await fn(s); n++; const v = await val(p, '#f-phone'); if (v !== WANT) bad.push(`${s} / ${m} → ${v}`);
    }
    ok(bad.length === 0, `${n} сценаріїв (5 форматів × 9 способів) дають ${WANT}`, bad);
    // проміжні значення під час набору
    const seen = new Set(); const weird = [];
    for (const s of INPUTS) {
      await reset('+380 '); await p.click('#f-phone'); await p.keyboard.press('End');
      for (const ch of s) { await p.keyboard.type(ch); const v = await val(p, '#f-phone'); seen.add(v); if (!WANT.startsWith(v.trimEnd())) weird.push(`${s}: ${v}`); }
    }
    ok(weird.length === 0, 'проміжні значення при наборі – лише префікси цільового номера', weird.slice(0, 5));
    // Backspace до кінця
    await reset(WANT); await p.click('#f-phone'); await p.keyboard.press('End');
    for (let i = 0; i < 15; i++) await p.keyboard.press('Backspace');
    ok((await val(p, '#f-phone')) === '+380 ', 'Backspace до кінця лишає «+380 »');
    // Backspace у середині
    await reset(WANT); await p.click('#f-phone');
    await p.$eval('#f-phone', e => e.setSelectionRange(9, 9)); // після «+380 67 1»
    await p.keyboard.press('Backspace');
    const afterBs = await val(p, '#f-phone'), caret = await p.$eval('#f-phone', e => e.selectionStart);
    ok(afterBs === '+380 67 234 56 7' && caret === 7, 'Backspace після «+380 67 1» → «+380 67 234 56 7», курсор після «67»', [afterBs, caret]);
    await p.keyboard.type('1');
    ok((await val(p, '#f-phone')) === WANT, 'набір «1» повертає повний номер');
    // Delete у середині
    await p.$eval('#f-phone', e => e.setSelectionRange(8, 8)); // перед «1»
    await p.keyboard.press('Delete');
    ok((await val(p, '#f-phone')) === '+380 67 234 56 7', 'Delete у середині прибирає цифру праворуч');
    // клік у префікс
    await reset('+380 67 1');
    const box = await p.$eval('#f-phone', e => { const r = e.getBoundingClientRect(); return { x: r.left + 22, y: r.top + r.height / 2 }; });
    await p.focus('#f-name'); await p.mouse.click(box.x, box.y); await p.waitForTimeout(50);
    ok(await p.$eval('#f-phone', e => e.selectionStart === e.value.length), 'клік у префікс переносить курсор у кінець');
    await p.context().close();
  }

  /* ---------- 5. Головна, службові параметри, 404, політика ---------- */
  console.log('\n5. Головна, 404, політика');
  {
    const p = await newPage(b, { tag: 'home' });
    await p.goto(BASE + '/index.html?mode=call&still&menu=open', { waitUntil: 'networkidle' });
    ok(await p.$eval('#p-call', e => e.hidden) && await p.$eval('#mnav', e => e.hidden) && !(await p.$('html.still')), 'службові параметри ?mode=call, ?menu=open, ?still не діють');
    await p.click('#sw-call');
    ok(!(await p.$eval('#p-call', e => e.hidden)), 'перемикач «Подзвонити» працює');
    await p.click('#sw-find');
    await p.fill('#q', 'охорона складу'); await p.press('#q', 'Enter');
    await p.waitForURL(/wizard\.html\?q=/);
    await p.waitForSelector('#wq');
    ok((await text(p, '#wq')) === 'Який це об’єкт?' && await p.$eval('.opt[data-v="Склад чи виробництво"]', e => e.getAttribute('aria-checked') === 'true'), 'пошук «охорона складу» → крок 2, обрано склад');
    await p.goto(BASE + '/wizard.html?demo=done&fail=1', { waitUntil: 'networkidle' });
    ok((await text(p, '#wq')) === 'Що потрібно охороняти?', 'wizard.html?demo=done – демо-параметр ігнорується, крок 1');
    const imgs = await p.goto(BASE + '/index.html', { waitUntil: 'networkidle' }).then(() => p.$$eval('.card img', is => is.map(i => [i.loading, i.currentSrc.split('/').pop(), i.width > 0])));
    ok(imgs.length === 10 && imgs.every(i => i[0] === 'lazy'), 'фото каруселі: loading=lazy', imgs.length);
    await p.$eval('#posluhy', e => e.scrollIntoView()); await p.waitForTimeout(500);
    const cur = await p.$$eval('#t-biz .card img', is => is.map(i => i.currentSrc.split('/').pop()).filter(Boolean));
    ok(cur.length > 0 && cur.every(s => /\.webp$/.test(s)), 'браузер бере WebP із srcset', cur);
    await p.setViewportSize({ width: 360, height: 800 }); await p.reload({ waitUntil: 'networkidle' });
    await p.click('.burger'); ok(!(await p.$eval('#mnav', e => e.hidden)), 'мобільне меню відкривається');
    await p.keyboard.press('Escape'); ok(await p.$eval('#mnav', e => e.hidden) && await p.evaluate(() => document.activeElement.classList.contains('burger')), 'Esc закриває, фокус на бургер');
    await p.context().close();
  }
  {
    const p = await newPage(b, { allow: /status of 404/, tag: '404' }); // 404 – статус самої сторінки
    const r = await p.goto(BASE + '/deep/missing/page', { waitUntil: 'networkidle' });
    ok(r.status() === 404, 'відсутня адреса → статус 404 (локальний сервер)', r.status());
    ok((await text(p, 'h1')) === 'Сторінку не знайдено', '404: заголовок');
    ok(await p.$eval('.doc-acts .btn', e => getComputedStyle(e).backgroundColor === 'rgb(0, 0, 0)'), '404 з глибокої адреси: стилі підвантажились (кореневі шляхи)');
    ok(await p.$eval('meta[name="robots"]', m => m.content) === 'noindex, follow', '404: noindex');
    await p.click('.doc-acts .btn-ghost'); await p.waitForURL(/\/index\.html$/);
    ok(true, '404: «На головну» веде на головну');
    await p.goto(BASE + '/privacy.html', { waitUntil: 'networkidle' });
    ok(/Текст готує юрист \[уточнити\]/.test(await text(p, '.doc-note')), 'політика: позначка «текст готує юрист [уточнити]»');
    await p.context().close();
  }
  {
    // SEO-база: по одному h1, title, description, canonical, OG на основних сторінках
    const p = await newPage(b, { tag: 'seo' });
    for (const u of ['/index.html', '/wizard.html', '/privacy.html']) {
      await p.goto(BASE + u, { waitUntil: 'networkidle' });
      const s = await p.evaluate(() => ({ h1: document.querySelectorAll('h1').length, lang: document.documentElement.lang, t: document.title,
        d: !!document.querySelector('meta[name=description]'), c: (document.querySelector('link[rel=canonical]') || {}).href, ico: !!document.querySelector('link[rel=icon]') }));
      ok(s.h1 === 1 && s.lang === 'uk' && s.t && s.d && s.c && s.ico, `${u}: h1, lang, title, description, canonical, favicon`, s);
    }
    const ld = await p.goto(BASE + '/index.html').then(() => p.$eval('script[type="application/ld+json"]', s => JSON.parse(s.textContent)));
    ok(ld['@type'] === 'LocalBusiness' && ld.telephone === '+380675495710' && !ld.address.streetAddress, 'schema.org: LocalBusiness, телефон, без вигаданої адреси');
    for (const f of ['/robots.txt', '/sitemap.xml', '/site.webmanifest', '/favicon.ico', '/icons/apple-touch-icon.png', '/icons/icon-512.png', '/img/og.jpg']) {
      const r = await p.goto(BASE + f); ok(r.status() === 200, `${f} віддається`);
    }
    await p.context().close();
  }

  await b.close();
  console.log(`\nПомилки консолі: ${errors.length ? '\n  ' + errors.join('\n  ') : 'немає'}`);
  console.log(`Разом: ${pass} ок, ${fail} не пройшло`);
  process.exit(fail || errors.length ? 1 : 0);
})();
