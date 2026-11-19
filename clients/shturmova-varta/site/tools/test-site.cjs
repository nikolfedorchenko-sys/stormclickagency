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
const text = (p, sel) => p.$eval(sel, e => e.textContent.replace(/\u00a0/g, ' ').trim()); // &nbsp; перед тире – як пробіл

async function toStep4(p, query = '') {
  await p.goto(BASE + '/wizard' + query, { waitUntil: 'networkidle' });
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
  for (const vp of [{ w: 1440, h: 900 }, { w: 768, h: 1024, mobile: true }, { w: 360, h: 800, mobile: true }]) {
    const p = await newPage(b, { viewport: { width: vp.w, height: vp.h }, mobile: vp.mobile, tag: 'wizard-' + vp.w });
    let posted = 0; p.on('request', r => { if (r.method() === 'POST') posted++; });
    await p.goto(BASE + '/wizard', { waitUntil: 'networkidle' });
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
    await p.waitForSelector('.done-mark.call');
    ok((await text(p, '#wq')) === 'Залишився один крок – подзвоніть', `${vp.w}: стан «Залишився один крок – подзвоніть»`);
    ok(await p.$eval('.done-mark', e => e.classList.contains('call') && !!e.querySelector('use[href="#i-phone"]') && getComputedStyle(e).backgroundColor === 'rgb(0, 0, 0)'), `${vp.w}: знак – телефон на чорному колі, не «!»`);
    ok(/назвіть менеджеру відповіді нижче/.test(await text(p, '.w-sub')), `${vp.w}: підтекст «назвіть менеджеру відповіді»`);
    ok(await p.$eval('.w-nav.w-off', e => { const c = getComputedStyle(e); return c.position === 'static' && c.borderTopStyle === 'none'; }), `${vp.w}: блок «Подзвонити» не липкий, без лінії зверху`);
    if (vp.w === 360) ok(await p.$eval('.w-nav.w-off', e => getComputedStyle(e).marginTop === '32px'), '360: відступ блоку «Подзвонити» 32 px, як у .w-nav.end');
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
    await p.waitForSelector('.done-mark:not(.call)');
    ok((await text(p, '#wq')) === 'Заявку надіслано', 'повтор → «Заявку надіслано»');
    ok(calls === 2, 'два запити: помилка і повтор', calls);
    ok(body && body.phone === '+380671234567' && body.name === 'Петро' && body.details === 'Склад чи виробництво' && body.address === 'Київ, Оболонь'
      && body.schedule === 'Цілодобово' && body.start === 'Якнайшвидше' && body.channel === 'Дзвінок' && body.hp_url === '' && !('company' in body) && !('cf_turnstile' in body) && body.utm_source === 'test' && body.utm_campaign === 'c1'
      && /Ім’я: Петро/.test(body.message), 'тіло заявки (JSON)', body);
    if (SHOTS) await p.screenshot({ path: path.join(SHOTS, 'wizard-1440-done.png'), fullPage: true });
    await p.context().close();
  }
  {
    const p = await newPage(b, { cfg: { ENDPOINT: FAKE, MIN_FILL_MS: 0, ENDPOINT_FORMAT: 'form' }, tag: 'endpoint-form' });
    let ct = '', body = '';
    await p.route(FAKE, r => { ct = r.request().headers()['content-type']; body = r.request().postData(); r.fulfill({ status: 200, body: '{}' }); });
    await toStep4(p); await p.fill('#f-name', 'Ія'); await p.fill('#f-phone', '671234567'); await p.click('button[type="submit"]');
    await p.waitForSelector('.done-mark:not(.call)');
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
    ok(await p.$eval('#f-hp', e => e.name === 'hp_url' && e.autocomplete === 'new-password' && e.tabIndex === -1 && e.closest('.hp').getAttribute('aria-hidden') === 'true' && e.getBoundingClientRect().right < 0), 'пастка hp_url: autocomplete=new-password, поза екраном, tabindex −1, aria-hidden');
    ok(!/компан/i.test(await text(p, '.hp label')), 'підпис пастки нейтральний (без «Компанія»)');
    await p.fill('#f-name', 'Бот'); await p.fill('#f-phone', '671234567');
    await p.$eval('#f-hp', e => { e.value = 'http://spam'; });
    await p.click('button[type="submit"]');
    await p.waitForSelector('.done-mark.call');
    ok(calls === 0, 'заповнена пастка → запит не надіслано', calls);
    ok((await text(p, '#wq')) === 'Залишився один крок – подзвоніть', 'заповнена пастка → «подзвоніть», не «надіслано»');
    await p.context().close();
  }
  {
    const p = await newPage(b, { cfg: { ENDPOINT: FAKE, MIN_FILL_MS: 60000 }, tag: 'too-fast' });
    let calls = 0; await p.route(FAKE, r => { calls++; r.fulfill({ status: 200, body: '{}' }); });
    await toStep4(p); await p.fill('#f-name', 'Швидкий'); await p.fill('#f-phone', '671234567'); await p.click('button[type="submit"]');
    await p.waitForSelector('.done-mark.call');
    ok(calls === 0, 'надто швидко (< MIN_FILL_MS) → запит не надіслано', calls);
    await p.context().close();
  }
  {
    const p = await newPage(b, { cfg: { EMAIL: 'test@example.com', TELEGRAM_URL: 'https://t.me/example', LINE_HOURS: 'щодня 08:00–22:00', CALLBACK_TIME: 'протягом 30 хвилин' }, tag: 'cfg' });
    await toStep4(p);
    ok(!(await p.$('text=Telegram і Viber – [уточнити], чи підключені.')), 'TELEGRAM_URL задано → рядок «[уточнити], чи підключені» сховано');
    await p.fill('#f-name', 'Ія'); await p.fill('#f-phone', '671234567'); await p.waitForTimeout(3100); await p.click('button[type="submit"]');
    await p.waitForSelector('.done-mark.call');
    const mail = await p.$eval('a[href^="mailto:"]', a => decodeURIComponent(a.href));
    ok(/^mailto:test@example.com\?subject=Заявка з сайту/.test(mail) && /Ім’я: Ія/.test(mail) && /Зв’язок: Дзвінок · \+380 67 123 45 67/.test(mail), 'EMAIL задано → mailto з відповідями', mail);
    ok(!!(await p.$('a[href="https://t.me/example"]')), 'кнопка Telegram');
    ok(/щодня 08:00–22:00/.test(await text(p, '.w-sub')), 'графік лінії з config.js');
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
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
    await p.goto(BASE + '/?mode=call&still&menu=open', { waitUntil: 'networkidle' });
    ok(await p.$eval('#p-call', e => e.hidden) && await p.$eval('#mnav', e => e.hidden) && !(await p.$('html.still')), 'службові параметри ?mode=call, ?menu=open, ?still не діють');
    await p.click('#sw-call');
    ok(!(await p.$eval('#p-call', e => e.hidden)), 'перемикач «Подзвонити» працює');
    await p.click('#sw-find');
    await p.fill('#q', 'охорона складу'); await p.press('#q', 'Enter');
    await p.waitForURL(/\/wizard\?q=/);
    await p.waitForSelector('#wq');
    ok((await text(p, '#wq')) === 'Який це об’єкт?' && await p.$eval('.opt[data-v="Склад чи виробництво"]', e => e.getAttribute('aria-checked') === 'true'), 'пошук «охорона складу» → крок 2, обрано склад');
    await p.goto(BASE + '/wizard?demo=done&fail=1', { waitUntil: 'networkidle' });
    ok((await text(p, '#wq')) === 'Що потрібно охороняти?', '/wizard?demo=done – демо-параметр ігнорується, крок 1');
    const imgs = await p.goto(BASE + '/', { waitUntil: 'networkidle' }).then(() => p.$$eval('.card img', is => is.map(i => [i.loading, i.currentSrc.split('/').pop(), i.width > 0])));
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
    await p.click('.doc-acts .btn-ghost'); await p.waitForURL(BASE + '/');
    ok(true, '404: «На головну» веде на головну');
    await p.goto(BASE + '/privacy', { waitUntil: 'networkidle' });
    ok(/Текст готує юрист \[уточнити\]/.test(await text(p, '.doc-note')), 'політика: позначка «текст готує юрист [уточнити]»');
    await p.context().close();
  }
  {
    // SEO-база: по одному h1, title, description, canonical, OG на основних сторінках
    const p = await newPage(b, { tag: 'seo' });
    for (const u of ['/', '/wizard', '/privacy']) {
      await p.goto(BASE + u, { waitUntil: 'networkidle' });
      const s = await p.evaluate(() => ({ h1: document.querySelectorAll('h1').length, lang: document.documentElement.lang, t: document.title,
        d: !!document.querySelector('meta[name=description]'), c: (document.querySelector('link[rel=canonical]') || {}).href, ico: !!document.querySelector('link[rel=icon]'),
        robots: (document.querySelector('meta[name=robots]') || {}).content || '' }));
      const noindex = /noindex/.test(s.robots);
      // майстер: noindex, follow, але canonical на себе (аудит В-5); політика – noindex без canonical
      const wantC = u === '/wizard' ? s.c === 'https://shturmova-varta.example/wizard' && s.robots === 'noindex, follow' : noindex ? !s.c : !!s.c;
      ok(s.h1 === 1 && s.lang === 'uk' && s.t && s.d && s.ico && wantC, `${u}: h1, lang, title, description, favicon, ${u === '/wizard' ? 'noindex, follow + canonical /wizard' : noindex ? 'noindex без canonical' : 'canonical'}`, s);
    }
    const ldAll = await p.goto(BASE + '/').then(() => p.$eval('script[type="application/ld+json"]', s => JSON.parse(s.textContent)));
    const ld = ldAll['@graph'].find(n => n['@type'] === 'LocalBusiness');
    ok(ldAll['@graph'].some(n => n['@type'] === 'WebSite' && n.inLanguage === 'uk'), 'schema.org: вузол WebSite');
    const ftrLegal = await p.$eval('.ftr-legal li', e => e.textContent.replace(/\u00a0/g, ' ').trim());
    ok(ld.legalName === ftrLegal && /^ТОВ «Охоронна компанія „Штурмова варта“»$/.test(ftrLegal), 'юридична назва однакова в JSON-LD і футері', [ld.legalName, ftrLegal]);
    ok(ld['@type'] === 'LocalBusiness' && ld.telephone === '+380675495710' && !ld.address.streetAddress, 'schema.org: LocalBusiness, телефон, без вигаданої адреси');
    ok(ld.areaServed.name === 'Київ' && ld.contactPoint.areaServed.name === 'Київ', 'schema.org: areaServed – Київ (і в contactPoint)');
    const man = await p.goto(BASE + '/site.webmanifest').then(r => r.json());
    ok(man.icons.every(i => i.purpose === 'any' || i.purpose === 'maskable') && man.icons.some(i => i.purpose === 'maskable'), 'manifest: any і maskable – окремі іконки');
    for (const i of man.icons) { const r = await p.goto(BASE + i.src); ok(r.status() === 200, `${i.src} віддається`); }
    const r400 = await p.request.get(BASE + '/%E0%A4%A'); ok(r400.status() === 400, 'serve.cjs: зламане кодування адреси → 400, сервер не падає', r400.status());
    const r200 = await p.request.get(BASE + '/'); ok(r200.status() === 200, 'serve.cjs працює після зламаної адреси');
    for (const f of ['/robots.txt', '/sitemap.xml', '/site.webmanifest', '/favicon.ico', '/icons/apple-touch-icon.png', '/icons/icon-512.png', '/img/og.jpg']) {
      const r = await p.goto(BASE + f); ok(r.status() === 200, `${f} віддається`);
    }
    await p.context().close();
  }

  /* ---------- 6. Прокрутка до кроку і результату на десктопі (блокер B1), шрифт, футер, згода ---------- */
  console.log('\n6. Прокрутка на десктопі, шрифт, футер, згода');
  const inView = (p, sel) => p.$eval(sel, e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight - 40; });
  for (const h of [800, 900]) for (const mode of ['offline', 'done', 'error']) {
    const cfg = mode === 'offline' ? null : { ENDPOINT: FAKE, MIN_FILL_MS: 0 };
    const p = await newPage(b, { viewport: { width: 1440, height: h }, cfg, tag: `scroll-${h}-${mode}`, allow: /status of 500/ });
    if (cfg) await p.route(FAKE, r => r.fulfill(mode === 'error' ? { status: 500, body: '{}' } : { status: 200, contentType: 'application/json', body: '{"ok":true}' }));
    await toStep4(p); await p.fill('#f-name', 'Олена'); await p.fill('#f-phone', '671234567');
    if (mode === 'offline') await p.waitForTimeout(3100);
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); // як людина: долистала до кнопки
    await p.click('button[type="submit"]');
    if (mode === 'error') {
      await p.waitForSelector('#send-err'); await p.waitForTimeout(150);
      ok(await inView(p, '#send-err'), `1440×${h}: помилка надсилання – блок «Не вдалося надіслати заявку» в межах екрана`);
      if (SHOTS) await p.screenshot({ path: path.join(SHOTS, `wizard-1440x${h}-error-viewport.png`) });
    } else {
      await p.waitForSelector(mode === 'offline' ? '.done-mark.call' : '.done-mark:not(.call)'); await p.waitForTimeout(150);
      ok(await inView(p, '#wq') && await p.$eval('#wiz', e => e.getBoundingClientRect().top >= 0), `1440×${h}: ${mode === 'offline' ? '«Залишився один крок»' : '«Заявку надіслано»'} – заголовок у межах екрана`,
        await p.$eval('#wq', e => Math.round(e.getBoundingClientRect().top)));
      if (SHOTS) await p.screenshot({ path: path.join(SHOTS, `wizard-1440x${h}-${mode}-viewport.png`) });
    }
    await p.context().close();
  }
  {
    // кроки 1–4 на десктопі: якщо долистали вниз – після «Далі»/«Назад» початок кроку видно
    const p = await newPage(b, { viewport: { width: 1440, height: 800 }, tag: 'scroll-steps' });
    await p.goto(BASE + '/wizard', { waitUntil: 'networkidle' });
    await p.click('.opt[data-v="object"]');
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.click('[data-act="next"]'); await p.waitForTimeout(100);
    ok(await inView(p, '#wq'), '1440×800: крок 2 – заголовок у межах екрана після «Далі» з прокрученої сторінки');
    await p.click('.opt[data-v="Склад чи виробництво"]');
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.click('[data-act="next"]'); await p.waitForTimeout(100);
    ok(await inView(p, '#wq'), '1440×800: крок 3 – заголовок у межах екрана');
    await p.evaluate(() => scrollTo(0, 0)); const y0 = await p.evaluate(() => scrollY);
    await p.$eval('[data-act="back"]', e => e.click()); await p.waitForTimeout(100); // клік без автопрокрутки Playwright
    ok(await p.evaluate(() => scrollY) === y0, '1440×800: якщо крок і так видно – сторінка не стрибає');
    await p.context().close();
  }
  {
    const p = await newPage(b, { tag: 'font', allow: /status of 404/ });
    const ext = []; p.on('request', r => { if (!r.url().startsWith(BASE)) ext.push(r.url()); });
    for (const u of ['/', '/wizard', '/privacy', '/deep/missing']) await p.goto(BASE + u, { waitUntil: 'networkidle' }).catch(() => {});
    ok(ext.length === 0, 'жодного зовнішнього запиту (Google Fonts прибрано)', ext);
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    ok(await p.evaluate(async () => { await document.fonts.ready; return document.fonts.check('500 16px Onest', 'Охорона') && [...document.fonts].some(f => f.family.replace(/"/g, '') === 'Onest' && f.status === 'loaded'); }), 'Onest завантажено локально');
    ok(await p.$eval('link[rel=preload][as=font]', l => /fonts\/onest-cyrillic\.woff2$/.test(l.href) && l.crossOrigin === 'anonymous'), 'preload основного файлу шрифту');
    const lic = await p.$$eval('[data-cfg="license"]', es => es.map(e => e.tagName));
    ok(lic.length > 0 && lic.every(t => t === 'SPAN') && !(await p.$('.ftr a[href="#"]')), 'футер: ліцензія – текст, без href="#", поки LICENSE_URL порожній', lic);
    await p.context().close();
    const p2 = await newPage(b, { cfg: { LICENSE_URL: 'https://example.com/license' }, tag: 'license' });
    await p2.goto(BASE + '/', { waitUntil: 'networkidle' });
    ok(await p2.$eval('.ftr [data-cfg="license"]', e => e.tagName === 'A' && e.href === 'https://example.com/license'), 'LICENSE_URL задано → у футері посилання');
    await toStep4(p2);
    ok(/службові дані про джерело переходу/.test(await text(p2, '#contact .fine')) && !!(await p2.$('#contact .fine a[href="/privacy"]')), 'згода: згадано службові дані про джерело переходу, посилання на політику');
    ok(!(await p2.$('#ts')), 'Turnstile без TURNSTILE_SITEKEY не підключається');
    await p2.context().close();
  }

  /* ---------- 7. Тексти v2, SEO-правки, адреси Cloudflare Pages, _headers ---------- */
  console.log('\n7. Тексти v2, SEO, адреси Cloudflare Pages, заголовки');
  {
    const p = await newPage(b, { tag: 'v2', allow: /status of 404/ }); // /nope-404 – навмисна відсутня адреса
    await p.goto(BASE + '/', { waitUntil: 'networkidle' });
    const norm = s => s.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    ok(norm(await text(p, 'h1')) === 'Охорона з бойовим досвідом', 'H1 – «Охорона з бойовим досвідом»');
    ok(await p.$eval('h1 + p.hero-sub', e => e.offsetHeight > 0 && e.textContent.replace(/\u00a0/g, ' ') === 'Фізична й особиста охорона в Києві. На постах – ветерани війни та колишні військові.'), 'підзаголовок – видимий <p> одразу під H1, текст за рішенням людини');
    const T = 'Охорона об’єктів і особиста охорона в Києві – Штурмова варта';
    const D = 'Охоронна компанія «Штурмова варта», Київ: фізична охорона об’єктів і особиста охорона. На постах – ветерани та співробітники з бойовим досвідом.';
    const meta = await p.evaluate(() => { const m = s => (document.querySelector(s) || {}).content; return { t: document.title, d: m('meta[name=description]'), ot: m('meta[property="og:title"]'), od: m('meta[property="og:description"]'), tt: m('meta[name="twitter:title"]'), td: m('meta[name="twitter:description"]'), url: m('meta[property="og:url"]') }; });
    ok(meta.t === T && meta.ot === T && meta.tt === T, 'title = og:title = twitter:title (рекомендований)', meta.t);
    ok(meta.d === D && meta.od === D && meta.td === D && D.length <= 160, 'description = og = twitter (рекомендований, ≤ 160 симв.)', D.length);
    ok(meta.url === 'https://shturmova-varta.example/', 'og:url – корінь /');
    ok(await p.$eval('#q', e => e.dataset.short === 'Що охороняти? Офіс, склад…'), 'короткий placeholder пошуку');
    const hint = await p.$$eval('#p-find .hint a', as => as.map(a => [a.textContent.replace(/\u00a0/g, ' '), a.getAttribute('href')]));
    ok(JSON.stringify(hint) === JSON.stringify([['офіс', '/wizard?t=object&p=Офіс%20або%20бізнес-центр'], ['склад', '/wizard?t=object&p=Склад%20чи%20виробництво'], ['особиста охорона', '/wizard?t=person']]), 'підказка під пошуком: офіс, склад, особиста охорона', hint);
    // H1 не стрибає між «Підібрати» і «Подзвонити» на трьох ширинах; кількість рядків H1
    for (const [w, h, lines] of [[360, 800, 2], [768, 1024, 1], [1440, 900, 1]]) {
      await p.setViewportSize({ width: w, height: h }); await p.reload({ waitUntil: 'networkidle' });
      const y1 = await p.$eval('h1', e => e.getBoundingClientRect().top);
      const n = await p.$eval('h1', e => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)));
      await p.click('#sw-call'); const y2 = await p.$eval('h1', e => e.getBoundingClientRect().top); await p.click('#sw-find');
      ok(Math.abs(y1 - y2) < 1 && n === lines, `${w}: H1 у ${lines} рядк., не зсувається при перемиканні «Подзвонити»`, { y1, y2, n });
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${w}: без горизонтальної прокрутки`);
    }
    await p.setViewportSize({ width: 1440, height: 900 }); await p.reload({ waitUntil: 'networkidle' });
    // «Хто на постах»
    const posts = await p.evaluate(() => { const s = document.getElementById('posty'); return { h: s.querySelector('h2').textContent, li: [...s.querySelectorAll('li')].filter(l => l.querySelector('.posts-n') && l.querySelector('b')).length, txt: s.textContent, prev: s.previousElementSibling.className, img: s.querySelectorAll('img, svg').length }; });
    ok(posts.h === 'Хто на постах' && posts.li === 4 && posts.prev === 'cats' && posts.img === 0, '«Хто на постах»: H2, 4 тези з номерами 01–04 і жирним вступом, одразу після сітки послуг, без зображень і символіки', posts.prev);
    ok(!/уточнити|\[/.test(posts.txt), '«Хто на постах»: без [уточнити]');
    ok(await p.$$eval('a[href="#posty"]', as => as.length >= 2), 'меню: «Хто на постах» веде на блок');
    ok(!(await p.$('.nav a[href="#kabinet"], .mnav-list a[href="#kabinet"]')), 'меню: «Кабінет клієнта» прибрано з головного меню (блок лишився)');
    ok(!!(await p.$('#kabinet')) && /незабаром/.test(await text(p, '.ftr-mid a[href="#kabinet"]')), 'кабінет: блок на сторінці, у футері – з позначкою «незабаром»');
    // SEO-текст
    const ab = await p.evaluate(() => { const s = document.getElementById('pro-okhoronu'); return { h2: s.querySelector('h2').textContent.replace(/\u00a0/g, ' '), h3: [...s.querySelectorAll('h3')].map(h => h.textContent.replace(/\u00a0/g, ' ')), ol: s.querySelectorAll('ol li').length, next: s.nextElementSibling.id, words: s.innerText.split(/\s+/).length, txt: s.textContent }; });
    ok(ab.h2 === 'Фізична охорона об’єктів і особиста охорона в Києві' && ab.h3.length === 3 && ab.ol === 4 && ab.next === 'pytannia', 'SEO-блок: H2, три H3, 4 кроки, стоїть перед «Питання та відповіді»', ab.h3);
    ok(ab.words > 230 && !/уточнити|\[/.test(ab.txt), 'SEO-блок: ~270 слів, без [уточнити]', ab.words);
    // FAQ
    ok(await p.$$eval('.faq summary', ss => { const s = ss.find(x => x.textContent === 'Хто працює на постах?'); return s && s.nextElementSibling.textContent.replace(/\u00a0/g, ' ') === 'Ветерани та співробітники з бойовим досвідом.'; }), 'FAQ «Хто працює на постах?» – відповідь із site-copy');
    ok(!(await p.$('script[type="application/ld+json"]:has-text("FAQPage")')) && !(await p.evaluate(() => /FAQPage/.test(document.documentElement.innerHTML))), 'FAQPage-розмітки немає');
    ok(!(await p.$('.faq a.link-arrow')), 'FAQ: посилання саме на себе прибрано');
    // фото: alt і плашка
    const im = await p.$$eval('.card', cs => cs.map(c => ({ alt: c.querySelector('img').alt, tag: c.querySelector('.tag').getAttribute('aria-hidden') })));
    ok(im.length === 10 && im.every(i => i.alt.length > 10 && i.tag === null), '10 фото з alt, плашка «ілюстративне фото» доступна скрінрідеру', im.map(i => i.alt));
    // заголовки без склеєних слів
    const h2 = await p.$$eval('h2', hs => hs.map(h => h.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()));
    ok(h2.includes('Популярні послуги') && h2.includes('Ситуації, коли потрібна охорона') && h2.includes('Питання та відповіді'), 'h2 з переносом: слова не склеюються в textContent', h2);
    ok(!(await p.$('h4')) && !(await p.$('.ftr h3')), 'без h4 у демо і h3 у футері');
    // демо кабінету
    const demo = await text(p, '.demo-win');
    ok(!/\[/.test(demo) && /Ваш об’єкт/.test(demo) && /Пост працює/.test(demo) && /Ваш менеджер/.test(demo), 'демо кабінету: лише статус поста і менеджер, без заглушок');
    const cab = (await text(p, '#kabinet')).toLowerCase();
    const promised = [/журнал змін/, /договір/, /(^|[^а-яіїєґ’])акт(и|ів)?([^а-яіїєґ]|$)/, /оплат/, /рахун/, /за зміну/, /обхід/, /в’їзд/].filter(r => r.test(cab)).map(String); // «акти» – окремим словом, не в «контакти»
    ok(promised.length === 0 && /статус об’єкта/.test(cab) && /контакти менеджера/.test(cab), 'кабінет: нейтральний – статус і контакти менеджера, без журналу змін, договору, актів, оплати онлайн', promised);
    // логотип: доступна назва = видимий текст
    ok(await p.$$eval('a.logo', as => as.every(a => !a.hasAttribute('aria-label') && a.textContent.replace(/\s+/g, ' ').includes('Штурмова варта') && a.getAttribute('href') === '/')), 'логотип: href="/", назва = видимий текст «Штурмова варта»');
    // внутрішні посилання – схема Pages
    for (const u of ['/', '/wizard', '/privacy', '/nope-404']) {
      await p.goto(BASE + u, { waitUntil: 'networkidle' }).catch(() => {});
      const bad = await p.$$eval('a[href]', as => as.map(a => a.getAttribute('href')).filter(h => /\.html/.test(h)));
      ok(bad.length === 0, `${u}: жодного внутрішнього посилання на .html`, bad.slice(0, 5));
      ok(await p.$$eval('script[src]', ss => ss.length > 0 && ss.every(s => s.defer)), `${u}: усі скрипти з defer`);
    }
    ok(!/[ʼ']/.test(await p.goto(BASE + '/').then(() => p.evaluate(() => document.body.innerText))), 'головна: апостроф лише типографський (’)');
    // аналітика: клік по посиланню на майстер дає click_wizard
    await p.evaluate(() => { window.__ev = []; window.gtag = (a, n) => window.__ev.push(n); document.addEventListener('click', e => e.preventDefault(), true); });
    await p.click('.hdr-right .btn');
    ok(await p.evaluate(() => window.__ev.includes('click_wizard')), 'подія click_wizard на /wizard');
    await p.context().close();
  }
  {
    // сервер як Cloudflare Pages: .html → 308 на адресу без .html; robots, sitemap, _headers
    const p = await newPage(b, { tag: 'pages' });
    const R = async (u) => { const r = await p.request.get(BASE + u, { maxRedirects: 0 }); return [r.status(), r.headers().location || '']; };
    ok(JSON.stringify(await R('/index.html')) === JSON.stringify([308, '/']), '/index.html → 308 /');
    ok(JSON.stringify(await R('/wizard.html?t=person')) === JSON.stringify([308, '/wizard?t=person']), '/wizard.html → 308 /wizard (параметри збережено)');
    ok((await R('/wizard'))[0] === 200 && (await R('/privacy'))[0] === 200, '/wizard і /privacy – 200');
    ok((await R('/_headers'))[0] === 404 && (await R('/tools/serve.cjs'))[0] === 404, 'службові файли не віддаються');
    const sm = await (await p.request.get(BASE + '/sitemap.xml')).text();
    ok(/<loc>https:\/\/shturmova-varta\.example\/<\/loc>/.test(sm) && !/wizard/.test(sm.replace(/<!--[\s\S]*?-->/g, '')), 'sitemap: лише головна, без майстра');
    const rb = await (await p.request.get(BASE + '/robots.txt')).text();
    ok(!/Disallow/.test(rb) && /Sitemap:/.test(rb), 'robots.txt: нічого не закрито (і майстер теж), є Sitemap');
    const h = (await p.request.get(BASE + '/')).headers();
    ok(h['x-content-type-options'] === 'nosniff' && /frame-ancestors 'none'/.test(h['content-security-policy'] || '') && h['referrer-policy'], '_headers: безпечні заголовки на сторінках', h);
    const hdr = fs.readFileSync(path.join(__dirname, '..', '_headers'), 'utf8');
    ok(/\/fonts\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/.test(hdr) && /\/img\/\*\n\s+Cache-Control:/.test(hdr) && !/^\/\*\n(?:\s+.+\n)*?\s+Cache-Control/m.test(hdr), '_headers: кеш статики в окремих правилах, не в /*');
    const man = await (await p.request.get(BASE + '/site.webmanifest')).json();
    ok(man.start_url === '/', 'manifest: start_url /');
    await p.context().close();
  }
  {
    // CSP з _headers не ламає сторінки: жодних порушень у консолі на головній, майстрі (з надсиланням), політиці
    const p = await newPage(b, { tag: 'csp', cfg: { ENDPOINT: FAKE, MIN_FILL_MS: 0 } });
    const vio = []; p.on('console', m => { if (/Content Security Policy/i.test(m.text())) vio.push(m.text()); });
    await p.route(FAKE, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
    for (const u of ['/', '/privacy']) await p.goto(BASE + u, { waitUntil: 'networkidle' });
    await toStep4(p); await p.fill('#f-name', 'Олена'); await p.fill('#f-phone', '671234567'); await p.click('button[type="submit"]');
    await p.waitForSelector('.done-mark:not(.call)');
    ok(vio.length === 0, 'CSP: без порушень на головній, політиці і при надсиланні заявки', vio);
    await p.context().close();
  }

  await b.close();
  console.log(`\nПомилки консолі: ${errors.length ? '\n  ' + errors.join('\n  ') : 'немає'}`);
  console.log(`Разом: ${pass} ок, ${fail} не пройшло`);
  process.exit(fail || errors.length ? 1 : 0);
})();
