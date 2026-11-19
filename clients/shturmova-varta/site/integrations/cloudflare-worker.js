/* Приймач заявок сайту «Штурмова варта»: Cloudflare Worker → повідомлення в Telegram-чат менеджерів.
   НЕ розгорнуто. Як розгорнути – README сайту, розділ «Заявки → Cloudflare Worker».
   Ключів і токенів у файлі немає і бути не може: усе задається в налаштуваннях воркера.

   Змінні воркера (wrangler.toml [vars] або Dashboard → Settings → Variables):
     ALLOWED_ORIGIN – ОБОВ’ЯЗКОВО. Адреса сайту без «/» у кінці, напр. https://shturmova-varta.ua.
                      Кілька – через кому (напр. з www і без). Не задано – воркер не приймає нічого (500).
     MIN_FILL_MS    – антиспам: мінімальний час заповнення, мс. Те саме число, що MIN_FILL_MS у js/config.js сайту.
                      Не задано – 3000.
     SPAM_NOTIFY    – '0' вимикає повідомлення «підозра на спам» у Telegram (за замовчуванням увімкнено).
   Секрети (wrangler secret put …):
     TG_BOT_TOKEN     – токен бота від @BotFather.                         ОБОВ’ЯЗКОВО
     TG_CHAT_ID       – id чату або групи менеджерів.                     ОБОВ’ЯЗКОВО
     TURNSTILE_SECRET – секретний ключ Cloudflare Turnstile.              НЕОБОВ’ЯЗКОВО
                        Задано – кожна заявка має містити дійсний токен cf_turnstile (сайт додає його сам,
                        якщо в js/config.js задано TURNSTILE_SITEKEY). Не задано – перевірка вимкнена.

   Відповіді (сайт вважає успіхом лише 2xx; на будь-яку іншу показує «Не вдалося надіслати заявку» + «Подзвонити»):
     200 – заявку надіслано в Telegram
     400 – тіло не розібрано; 403 – чужий сайт (Origin) або не пройдено Turnstile; 405 – не POST; 413 – завелике тіло
     422 – не пройшла перевірка полів або антиспам (error: 'spam')
     500 – воркер не налаштовано (немає ALLOWED_ORIGIN, TG_BOT_TOKEN чи TG_CHAT_ID)
     502 – Telegram (або перевірка Turnstile) недоступні чи відмовили

   Сервер не довіряє браузеру: обов’язкові поля, довжини, формат телефону, поле-пастка hp_url, час заповнення.
   Час заповнення (elapsed_ms) рахує браузер, тож бот може його підробити – це лише фільтр від найпростіших ботів.
   Від розсилки через curl захищають Turnstile і правило rate limiting у Cloudflare WAF (див. README). */

const MAX_BODY = 16 * 1024;
const MAX = { service: 40, service_code: 10, details: 80, guests: 20, address: 120, schedule: 60, start: 40, name: 60,
  phone: 13, channel: 20, search: 80, page: 300, referrer: 300, utm_source: 200, utm_medium: 200, utm_campaign: 200,
  utm_term: 200, utm_content: 200, gclid: 200, fbclid: 200 };
const LABELS = [['service', 'Послуга'], ['details', 'Деталі'], ['guests', 'Гостей'], ['address', 'Адреса'], ['schedule', 'Графік'],
  ['start', 'Коли почати'], ['name', 'Ім’я'], ['phone', 'Телефон'], ['channel', 'Зв’язок'], ['search', 'Шукали на сайті'],
  ['utm_source', 'utm_source'], ['utm_medium', 'utm_medium'], ['utm_campaign', 'utm_campaign'], ['utm_term', 'utm_term'],
  ['utm_content', 'utm_content'], ['gclid', 'gclid'], ['fbclid', 'fbclid'], ['page', 'Сторінка'], ['referrer', 'Звідки перейшли']];

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

async function tgSend(env, text) {
  const r = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true })
  });
  return r.ok;
}

async function turnstileOk(env, token, ip) {
  if (!token || typeof token !== 'string' || token.length > 2048) return false;
  const f = new FormData();
  f.append('secret', env.TURNSTILE_SECRET); f.append('response', token);
  if (ip) f.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: f });
  if (!r.ok) throw new Error('siteverify HTTP ' + r.status);
  const j = await r.json();
  return j.success === true;
}

export default {
  async fetch(req, env) {
    const origins = String(env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim().replace(/\/$/, '')).filter(Boolean);
    const origin = req.headers.get('Origin') || '';
    const allowed = origins.includes(origin);
    const cors = { 'Access-Control-Allow-Origin': allowed ? origin : (origins[0] || 'null'), 'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' };
    const json = (code, body) => new Response(JSON.stringify(body), { status: code, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });

    // не налаштовано – нічого не пропускаємо
    if (!origins.length || !env.TG_BOT_TOKEN || !env.TG_CHAT_ID) return json(500, { ok: false, error: 'not configured' });
    if (req.method === 'OPTIONS') return new Response(null, { status: allowed ? 204 : 403, headers: cors });
    if (req.method !== 'POST') return json(405, { ok: false });
    if (!allowed) return json(403, { ok: false, error: 'origin' });
    if (Number(req.headers.get('Content-Length') || 0) > MAX_BODY) return json(413, { ok: false });

    let d;
    try {
      const raw = await req.text();
      if (new TextEncoder().encode(raw).length > MAX_BODY) return json(413, { ok: false });
      const ct = req.headers.get('Content-Type') || '';
      d = ct.includes('application/json') ? JSON.parse(raw) : Object.fromEntries(new URLSearchParams(raw));
    } catch (e) { return json(400, { ok: false, error: 'bad body' }); }
    if (typeof d !== 'object' || !d || Array.isArray(d)) return json(400, { ok: false });

    const v = {};
    for (const k of Object.keys(MAX)) v[k] = String(d[k] == null ? '' : d[k]).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, MAX[k]);
    const lines = () => LABELS.filter(([k]) => v[k]).map(([k, l]) => `${l}: ${esc(v[k])}`).join('\n');

    // Turnstile (якщо задано TURNSTILE_SECRET)
    if (env.TURNSTILE_SECRET) {
      let pass;
      try { pass = await turnstileOk(env, d.cf_turnstile, req.headers.get('CF-Connecting-IP')); }
      catch (e) { return json(502, { ok: false, error: 'turnstile unavailable' }); }
      if (!pass) return json(403, { ok: false, error: 'turnstile' });
    }

    // антиспам: пастка заповнена або форму «заповнили» швидше за MIN_FILL_MS.
    // Не відповідаємо «успіхом»: 422 → сайт покаже «Не вдалося надіслати» і кнопку «Подзвонити».
    // Якщо телефон схожий на справжній – окремим повідомленням «підозра на спам», щоб не загубити живу людину.
    const cfgMs = env.MIN_FILL_MS == null || env.MIN_FILL_MS === '' ? NaN : Number(env.MIN_FILL_MS);
    const minMs = Number.isFinite(cfgMs) && cfgMs >= 0 ? cfgMs : 3000;
    const elapsed = Number(d.elapsed_ms);
    const spam = !!(d.hp_url && String(d.hp_url).trim()) || !Number.isFinite(elapsed) || elapsed < minMs;
    if (spam) {
      if (env.SPAM_NOTIFY !== '0' && /^\+380\d{9}$/.test(v.phone)) {
        const why = d.hp_url ? 'заповнене поле-пастка' : `заповнено за ${Number.isFinite(elapsed) ? Math.round(elapsed / 100) / 10 + ' с' : '? с'} (поріг ${minMs / 1000} с)`;
        try { await tgSend(env, `<b>Підозра на спам</b> (${esc(why)}). Перевірте, перш ніж телефонувати.\n` + lines()); } catch (e) { /* не критично */ }
      }
      return json(422, { ok: false, error: 'spam' });
    }

    if (!/\p{L}.*\p{L}/u.test(v.name)) return json(422, { ok: false, error: 'name' });
    if (!/^\+380\d{9}$/.test(v.phone)) return json(422, { ok: false, error: 'phone' });
    if (!v.service) return json(422, { ok: false, error: 'service' });

    // якщо Telegram не прийняв або недоступний – помилка: сайт покаже «Не вдалося надіслати заявку» і «Подзвонити»
    try {
      const sent = await tgSend(env, '<b>Нова заявка з сайту</b>\n' + lines());
      return sent ? json(200, { ok: true }) : json(502, { ok: false, error: 'telegram' });
    } catch (e) {
      return json(502, { ok: false, error: 'telegram unavailable' });
    }
  }
};
