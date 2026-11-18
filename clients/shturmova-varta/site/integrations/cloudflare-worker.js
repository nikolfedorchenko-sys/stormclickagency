/* Приймач заявок для Cloudflare Workers → повідомлення в Telegram. ПРИКЛАД, не розгорнуто.
   Ключів у файлі немає: їх задають як секрети воркера (wrangler secret put …), див. README сайту, «Заявки».

   Секрети / змінні воркера:
     TG_BOT_TOKEN   – токен бота від @BotFather            (секрет)
     TG_CHAT_ID     – id чату або групи менеджерів          (секрет)
     ALLOWED_ORIGIN – адреса сайту, напр. https://shturmova-varta.ua (звідки дозволено надсилати)

   Сервер перевіряє дані сам і не довіряє браузеру: обов’язкові поля, довжини, формат телефону,
   антиспам-поле company, мінімальний час заповнення. */
const MAX = { service: 40, service_code: 10, details: 80, guests: 20, address: 120, schedule: 60, start: 40, name: 60,
  phone: 13, channel: 20, search: 80, page: 300, referrer: 300, utm_source: 200, utm_medium: 200, utm_campaign: 200,
  utm_term: 200, utm_content: 200, gclid: 200, fbclid: 200 };
const LABELS = [['service', 'Послуга'], ['details', 'Деталі'], ['guests', 'Гостей'], ['address', 'Адреса'], ['schedule', 'Графік'],
  ['start', 'Коли почати'], ['name', 'Ім’я'], ['phone', 'Телефон'], ['channel', 'Зв’язок'], ['search', 'Шукали на сайті'],
  ['utm_source', 'utm_source'], ['utm_campaign', 'utm_campaign'], ['page', 'Сторінка']];

export default {
  async fetch(req, env) {
    const cors = { 'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '', 'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept', 'Vary': 'Origin' };
    const json = (code, body) => new Response(JSON.stringify(body), { status: code, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json(405, { ok: false });
    if (env.ALLOWED_ORIGIN && req.headers.get('Origin') !== env.ALLOWED_ORIGIN) return json(403, { ok: false });

    let d;
    try {
      const ct = req.headers.get('Content-Type') || '';
      d = ct.includes('application/json') ? await req.json() : Object.fromEntries(new URLSearchParams(await req.text()));
    } catch (e) { return json(400, { ok: false, error: 'bad body' }); }
    if (typeof d !== 'object' || !d) return json(400, { ok: false });

    // антиспам: пастка заповнена або форму «заповнили» швидше за 3 с – мовчки приймаємо, але нікуди не шлемо
    if (d.company || Number(d.elapsed_ms) < 3000) return json(200, { ok: true });

    const v = {};
    for (const k of Object.keys(MAX)) v[k] = String(d[k] == null ? '' : d[k]).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, MAX[k]);
    if (!/\p{L}.*\p{L}/u.test(v.name)) return json(422, { ok: false, error: 'name' });
    if (!/^\+380\d{9}$/.test(v.phone)) return json(422, { ok: false, error: 'phone' });
    if (!v.service) return json(422, { ok: false, error: 'service' });

    const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const text = '<b>Нова заявка з сайту</b>\n' + LABELS.filter(([k]) => v[k]).map(([k, l]) => `${l}: ${esc(v[k])}`).join('\n');
    const r = await fetch(`https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TG_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true })
    });
    // якщо Telegram не прийняв – віддаємо помилку: сайт покаже «Не вдалося надіслати заявку» і кнопку «Подзвонити»
    return r.ok ? json(200, { ok: true }) : json(502, { ok: false });
  }
};
