#!/usr/bin/env node
// Перевірка приймача integrations/cloudflare-worker.js без Cloudflare і без мережі: fetch до Telegram і Turnstile підмінено.
// Запуск із теки site/:  node tools/test-worker.mjs
import worker from '../integrations/cloudflare-worker.js';

let pass = 0, fail = 0;
const ok = (c, n, x) => { if (c) { pass++; console.log('  ок   ' + n); } else { fail++; console.log('  FAIL ' + n + (x !== undefined ? '  → ' + JSON.stringify(x) : '')); } };

const ORIGIN = 'https://shturmova-varta.example';
const ENV = { ALLOWED_ORIGIN: ORIGIN, TG_BOT_TOKEN: 'test-token', TG_CHAT_ID: '-100', MIN_FILL_MS: '3000' };
const GOOD = { service: 'Об’єкт', service_code: 'object', details: 'Склад чи виробництво', address: 'Київ', schedule: 'Цілодобово', start: 'Якнайшвидше',
  name: 'Петро', phone: '+380671234567', channel: 'Дзвінок', page: ORIGIN + '/wizard.html', referrer: 'https://google.com/', elapsed_ms: 25000, hp_url: '',
  utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'c1', utm_term: 'охорона', utm_content: 'ad1', gclid: 'G1', fbclid: 'F1' };

let tg = [], tgMode = 'ok', tsMode = 'ok';
globalThis.fetch = async (url, init) => {
  if (String(url).includes('api.telegram.org')) {
    if (tgMode === 'throw') throw new TypeError('network');
    tg.push(JSON.parse(init.body).text);
    return new Response('{"ok":true}', { status: tgMode === 'fail' ? 400 : 200 });
  }
  if (String(url).includes('turnstile')) {
    if (tsMode === 'throw') throw new TypeError('network');
    return Response.json({ success: init.body.get('response') === 'good-token' });
  }
  throw new Error('unexpected fetch ' + url);
};
const call = (body, { env = ENV, origin = ORIGIN, method = 'POST', ct = 'application/json' } = {}) =>
  worker.fetch(new Request('https://w.example/', { method, headers: { Origin: origin, 'Content-Type': ct },
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined }), env);

let r;
r = await call(GOOD); ok(r.status === 200 && tg.length === 1, 'коректна заявка → 200, одне повідомлення', r.status);
ok(r.headers.get('Access-Control-Allow-Origin') === ORIGIN, 'CORS: свій Origin');
const msg = tg[0] || '';
ok(['utm_medium: cpc', 'utm_term: охорона', 'utm_content: ad1', 'gclid: G1', 'fbclid: F1', 'Звідки перейшли: https://google.com/'].every(s => msg.includes(s)), 'у повідомленні utm_medium/term/content, gclid, fbclid, referrer', msg);
tg = [];
r = await call(new URLSearchParams({ ...GOOD, elapsed_ms: '25000' }).toString(), { ct: 'application/x-www-form-urlencoded' }); ok(r.status === 200, 'формат form → 200');
tg = [];
r = await call({ ...GOOD, name: '<b>x</b>Іван' }); ok(r.status === 200 && tg[0].includes('&lt;b&gt;'), 'HTML у полях екранується');

tg = [];
r = await call({ ...GOOD, hp_url: 'http://spam' }); ok(r.status === 422 && tg.length === 1 && tg[0].startsWith('<b>Підозра на спам</b>'), 'пастка → 422 + «підозра на спам»', [r.status, tg]);
tg = [];
r = await call({ ...GOOD, elapsed_ms: 900 }); ok(r.status === 422 && /поріг 3 с/.test(tg[0] || ''), 'швидше за MIN_FILL_MS → 422 + «підозра на спам»', [r.status, tg]);
tg = [];
r = await call({ ...GOOD, elapsed_ms: 900, phone: 'abc' }); ok(r.status === 422 && tg.length === 0, 'спам з негодящим телефоном → 422 без повідомлення');
tg = [];
r = await call({ ...GOOD, elapsed_ms: 900 }, { env: { ...ENV, SPAM_NOTIFY: '0' } }); ok(r.status === 422 && tg.length === 0, 'SPAM_NOTIFY=0 → без повідомлення');
r = await call({ ...GOOD, elapsed_ms: 4000 }, { env: { ...ENV, MIN_FILL_MS: '5000' } }); ok(r.status === 422, 'поріг береться зі змінної MIN_FILL_MS');
r = await call({ ...GOOD, elapsed_ms: undefined }); ok(r.status === 422, 'без elapsed_ms → 422');

r = await call({ ...GOOD, phone: '+38067123' }); ok(r.status === 422, 'неповний телефон → 422');
r = await call({ ...GOOD, name: '1' }); ok(r.status === 422, 'ім’я без літер → 422');
r = await call('{bad json'); ok(r.status === 400, 'зламаний JSON → 400');
r = await call('x'.repeat(20000)); ok(r.status === 413, 'завелике тіло → 413');

r = await call(GOOD, { origin: 'https://evil.example' }); ok(r.status === 403, 'чужий Origin → 403');
r = await call(GOOD, { env: { ...ENV, ALLOWED_ORIGIN: '' } }); ok(r.status === 500, 'ALLOWED_ORIGIN не задано → 500 (не пропускаємо)');
r = await call(GOOD, { env: { ...ENV, TG_BOT_TOKEN: '' } }); ok(r.status === 500, 'TG_BOT_TOKEN не задано → 500');
r = await call(GOOD, { env: { ...ENV, ALLOWED_ORIGIN: 'https://a.example, ' + ORIGIN + '/' } }); ok(r.status === 200, 'кілька ALLOWED_ORIGIN через кому');
r = await call(null, { method: 'OPTIONS' }); ok(r.status === 204 && r.headers.get('Access-Control-Allow-Methods').includes('POST'), 'OPTIONS (preflight) → 204');
r = await call(null, { method: 'GET' }); ok(r.status === 405, 'GET → 405');

tgMode = 'fail'; r = await call(GOOD); ok(r.status === 502 && r.headers.get('Access-Control-Allow-Origin') === ORIGIN, 'Telegram відмовив → 502 з CORS');
tgMode = 'throw'; r = await call(GOOD); ok(r.status === 502 && r.headers.get('Access-Control-Allow-Origin') === ORIGIN, 'Telegram недоступний (виняток) → 502 з CORS');
tgMode = 'ok';

const TSENV = { ...ENV, TURNSTILE_SECRET: 'test-secret' };
r = await call(GOOD, { env: TSENV }); ok(r.status === 403, 'Turnstile увімкнено, токена немає → 403');
r = await call({ ...GOOD, cf_turnstile: 'bad' }, { env: TSENV }); ok(r.status === 403, 'Turnstile: хибний токен → 403');
r = await call({ ...GOOD, cf_turnstile: 'good-token' }, { env: TSENV }); ok(r.status === 200, 'Turnstile: дійсний токен → 200');
tsMode = 'throw'; r = await call({ ...GOOD, cf_turnstile: 'good-token' }, { env: TSENV }); ok(r.status === 502, 'Turnstile недоступний → 502');

console.log(`\nРазом: ${pass} ок, ${fail} не пройшло`);
process.exit(fail ? 1 : 0);
