import { CONFIG } from './config.js';
import { t, getLang, onLangChange } from './i18n.js';

// ШІ-асистент на сайті. З налаштованим apiBase спілкується з Claude через Worker,
// без нього – демо-режим зі сценарними відповідями, щоб показати механіку.
const DEMO = {
  uk: [
    [/@|\+?\d{9,}/, 'Дякую! Записав контакт. Команда надішле точний розрахунок протягом години в робочий час.'],
    [/crm|срм|црм/i, 'CRM під ваш бізнес – від $1 000, готова за кілька днів: клієнти, угоди, задачі, звіти, ролі, інтеграція з сайтом і ботом. Точна ціна залежить від ТЗ. Який у вас бізнес і скільки людей працюватиме в системі?'],
    [/магазин|shop|товар/i, 'Інтернет-магазин – від $400, 2–4 дні: до 100 товарів, оплата, доставка, адмінка. Скільки товарів плануєте?'],
    [/кав|салон|візитівк|сайт|лендинг/i, 'Сайт для бізнесу – $100, готовий за кілька годин: до 5 екранів, мобільна версія, кнопка в Telegram, хостинг на рік. Якщо є тексти й фото – запустимо сьогодні. Лишите контакт для розрахунку?'],
    [/бот|telegram|запис/i, 'Telegram-бот для запису чи замовлень – від $150, за 1–2 дні: сценарій, база клієнтів, сповіщення вам. ШІ-асистент, що сам відповідає клієнтам – від $300. Що з цього ближче?'],
    [/реклам|таргет|трафік/i, 'Запуск Meta або Google Ads – $150 плюс бюджет, старт за 1–2 дні. ШІ готує креативи, ми масштабуємо ті, що дають заявки. Який продукт рекламуємо?'],
    [/ціна|кошту|бюджет|скільки|дешев/i, 'Сайт – $100, бот – від $150, ШІ-асистент – від $300, магазин – від $400, CRM – від $1 000. Усе залежить від ТЗ, точну ціну назвемо за годину. Що саме потрібно?'],
  ],
  en: [
    [/@|\+?\d{9,}/, 'Thank you! Contact saved. The team will send an exact quote within an hour during business hours.'],
    [/crm/i, 'A custom CRM is from $1,000 and ready in a few days: customers, deals, tasks, reports, roles, integrated with your site and bot. The exact price depends on the brief. What is your business and how many people will use it?'],
    [/store|shop|product/i, 'An online store is from $400, 2–4 days: up to 100 products, payments, delivery, admin panel. How many products do you plan?'],
    [/coffee|salon|site|landing|website/i, 'A business website is $100 and ready in a few hours: up to 5 screens, mobile version, Telegram button, hosting for a year. With copy and photos ready we launch today. Leave a contact for the quote?'],
    [/bot|telegram|book/i, 'A Telegram bot for booking or orders is from $150, 1–2 days: flow, customer base, notifications. An AI assistant that answers customers itself is from $300. Which is closer?'],
    [/ads|target|traffic/i, 'A Meta or Google Ads launch is $150 plus budget, live in 1–2 days. AI drafts creatives, we scale the ones that bring leads. What are we promoting?'],
    [/price|cost|budget|how much|cheap/i, 'Website $100, bot from $150, AI assistant from $300, store from $400, CRM from $1,000. It all depends on the brief; we give an exact price within an hour. What do you need?'],
  ],
};

export function initAssistant(root) {
  const panel = root.querySelector('.assistant-panel');
  const log = root.querySelector('.assistant-log');
  const form = root.querySelector('.assistant-form');
  const input = form.querySelector('input');
  const toggle = root.querySelector('.assistant-toggle');
  const closeBtn = root.querySelector('.assistant-close');
  const chips = root.querySelector('.assistant-chips');
  const history = [];
  let busy = false;

  const live = Boolean(CONFIG.apiBase);
  root.classList.toggle('is-demo', !live);

  const open = () => { root.classList.add('is-open'); setTimeout(() => input.focus(), 300); };
  const close = () => root.classList.remove('is-open');
  toggle.addEventListener('click', () => (root.classList.contains('is-open') ? close() : open()));
  closeBtn.addEventListener('click', close);
  document.querySelectorAll('[data-assistant]').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    open();
    if (el.dataset.assistant) ask(el.dataset.assistant);
  }));
  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('button');
    if (chip) ask(chip.textContent);
  });

  const bubble = (role, text = '') => {
    const el = document.createElement('div');
    el.className = `assistant-msg from-${role}`;
    el.textContent = text;
    log.append(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };

  const greet = () => {
    log.innerHTML = '';
    history.length = 0;
    bubble('assistant', t('assistant.greeting'));
    chips.innerHTML = ['assistant.chip1', 'assistant.chip2', 'assistant.chip3'].map((k) => `<button type="button">${t(k)}</button>`).join('');
  };
  greet();
  onLangChange(greet);

  async function ask(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    chips.hidden = true;
    input.value = '';
    bubble('user', text);
    history.push({ role: 'user', content: text });
    const el = bubble('assistant');
    el.classList.add('is-typing');
    try {
      const reply = live ? await streamReply(el) : await demoReply(text, el);
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      el.textContent = t('assistant.error');
    } finally {
      el.classList.remove('is-typing');
      busy = false;
      input.focus();
    }
  }

  async function streamReply(el) {
    const res = await fetch(`${CONFIG.apiBase}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, lang: getLang() }),
    });
    if (!res.ok || !res.body) throw new Error(res.status);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop();
      for (const part of parts) {
        const event = /^event: (\w+)/m.exec(part)?.[1];
        const data = /^data: (.*)$/m.exec(part)?.[1];
        if (!event || data === undefined) continue;
        const payload = JSON.parse(data);
        if (event === 'text') { text += payload; el.textContent = text; log.scrollTop = log.scrollHeight; }
        if (event === 'lead') root.classList.add('has-lead');
        if (event === 'error') throw new Error(payload.message);
      }
    }
    return text;
  }

  async function demoReply(text, el) {
    const rules = DEMO[getLang()] || DEMO.uk;
    const match = rules.find(([re]) => re.test(text));
    const reply = match ? match[1] : t('assistant.demoFallback');
    // Імітуємо стрім, щоб відчути темп справжнього асистента
    for (let i = 1; i <= reply.length; i += 3) {
      el.textContent = reply.slice(0, i);
      log.scrollTop = log.scrollHeight;
      await new Promise((r) => setTimeout(r, 14));
    }
    el.textContent = reply;
    return reply;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });
}
