import { CONFIG } from './config.js';
import { t, getLang, onLangChange } from './i18n.js';

// ШІ-асистент на сайті. З налаштованим apiBase спілкується з Claude через Worker,
// без нього – демо-режим зі сценарними відповідями, щоб показати механіку.
const DEMO = {
  uk: [
    [/@|\+?\d{9,}/, 'Дякую! Записав контакт. Команда відповість протягом 15 хвилин у робочий час.'],
    [/ціна|кошту|бюджет|скільки/i, 'Фіксованих пакетів у нас немає: рахуємо ціну під задачу. Перший розрахунок безкоштовний. Розкажіть, що потрібно, і орієнтовний бюджет – до $500, $500–2000 чи більше?'],
    [/сайт|лендинг|магазин/i, 'Сайт або лендинг робимо за 1–3 тижні: ШІ генерує тексти й креативи, команда збирає структуру, дизайн і код. Для якого бізнесу потрібен сайт?'],
    [/бот|telegram|автомат|ші|ai/i, 'ШІ-боти – наша сильна сторона: бот відповідає клієнтам 24/7, записує, нагадує, а звіти надсилає вам у Telegram. Яку рутину хочете зняти з себе?'],
    [/реклам|таргет|трафік/i, 'Запускаємо Meta, TikTok і Google Ads за 3 дні після погодження креативів. ШІ готує варіанти креативів, ми масштабуємо переможців. Який продукт рекламуємо?'],
  ],
  en: [
    [/@|\+?\d{9,}/, 'Thank you! I saved your contact. The team will reply within 15 minutes during business hours.'],
    [/price|cost|budget|how much/i, 'We have no fixed packages: every task is priced individually and the first estimate is free. Tell me what you need and a rough budget – under $500, $500–2,000 or more?'],
    [/site|landing|store|shop/i, 'A website or landing page takes 1–3 weeks: AI generates copy and creatives, the team builds structure, design and code. What business is it for?'],
    [/bot|telegram|automat|ai/i, 'AI bots are our strength: a bot answers customers 24/7, books, reminds and reports to you in Telegram. Which routine do you want to offload?'],
    [/ads|target|traffic/i, 'We launch Meta, TikTok and Google Ads within 3 days after creatives are approved. AI drafts creative variants, we scale the winners. What product are we promoting?'],
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
