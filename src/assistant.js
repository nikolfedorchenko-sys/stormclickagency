import { CONFIG } from './config.js';
import { t, getLang, onLangChange } from './i18n.js';

// ШІ-асистент на сайті. З налаштованим apiBase спілкується з Claude через Worker,
// без нього – демо-режим зі сценарними відповідями, щоб показати механіку.
const DEMO = {
  uk: [
    [/@|\+?\d{9,}/, 'Дякую! Записав контакт. Команда надішле точний розрахунок протягом години в робочий час.'],
    [/аудит/i, 'ШІ-аудит – $100 і один день: розбираємо ваш бізнес, кажемо, що автоматизувати першим, скільки це заощадить і з чого почати. Ці $100 зараховуємо в будь-який наступний проєкт. Який у вас бізнес?'],
    [/crm|срм|црм/i, 'CRM під ваш бізнес – від $1 000, готова за 2–3 дні: клієнти, угоди, задачі, звіти, ролі, інтеграція з сайтом і ботом. Якщо заявок небагато, міні-CRM у Telegram або Sheets – від $250 за день. Скільки людей працюватиме в системі?'],
    [/не встига|відповіда|повідомлен|дзвін|пропущ/i, 'Це наш головний профіль. ШІ-асистент у Telegram, Instagram і на сайті відповідає клієнтам 24/7 – від $300 за день. Пропущені дзвінки закриває ШІ-секретар – від $400 за 2 дні. Клієнти не приходять – бот запису з нагадуваннями, від $150 за годину. Що болить найбільше?'],
    [/соцмереж|контент|пост|reels|відео/i, 'Соцмережі на автопілоті – $120 на місяць: контент-план, 12 постів і 8 сторіс, редагує людина. Reels і Shorts зі ШІ – 8 роликів за $150 на місяць. Яку соцмережу ведете?'],
    [/google|карт|знаход|seo/i, 'Google Business Profile і локальне SEO – $120 за 2 дні: вас знаходять на мапі й у пошуку, плюс автозбір відгуків. Де ваш бізнес розташований?'],
    [/рутин|вручну|таблиц|документ|рахун|договор/i, 'Автоматизація процесів – від $200, того ж дня: зв\'язуємо Sheets, CRM, Telegram, пошту й платіжки, дані переносяться самі. Генератор документів (рахунки, акти, КП у PDF) – від $150. Що робите вручну найчастіше?'],
    [/магазин|shop|товар/i, 'Інтернет-магазин – від $400, 1–2 дні: до 100 товарів, оплата, доставка, адмінка, Instagram-каталог. Скільки товарів плануєте?'],
    [/кав|салон|візитівк|сайт|лендинг/i, 'Сайт для бізнесу – $100, готовий за кілька годин: до 5 екранів, мобільна версія, кнопка в Telegram, хостинг на рік. Якщо сайт уже є, але не продає – аудит і переробка за $150. Лишите контакт для розрахунку?'],
    [/бот|telegram|запис/i, 'Бот запису з нагадуваннями – від $150, готовий за годину. ШІ-асистент, що сам відповідає клієнтам – від $300 за день. Що з цього ближче?'],
    [/реклам|таргет|трафік/i, 'Запуск Meta або Google Ads – $150 плюс бюджет, старт того ж дня. ШІ готує креативи, ми масштабуємо ті, що дають заявки. Який продукт рекламуємо?'],
    [/ціна|кошту|бюджет|скільки|дешев/i, 'Найдешевший старт – ШІ-аудит за $100. Сайт – $100, бот – від $150, ШІ-асистент – від $300, магазин – від $400, CRM – від $1 000. Усе залежить від ТЗ, точну ціну назвемо за годину. Що саме болить?'],
  ],
  en: [
    [/@|\+?\d{9,}/, 'Thank you! Contact saved. The team will send an exact quote within an hour during business hours.'],
    [/audit/i, 'The AI audit is $100 and one day: we map your business, say what to automate first, how much it saves and where to start. The $100 counts towards any next project. What is your business?'],
    [/crm/i, 'A custom CRM is from $1,000, ready in 2–3 days: customers, deals, tasks, reports, roles, integrated with your site and bot. For fewer leads, a mini-CRM in Telegram or Sheets is from $250 in a day. How many people will use it?'],
    [/keep up|messag|reply|call|missed|no-show/i, 'That is our core. An AI assistant in Telegram, Instagram and on your site answers customers 24/7 from $300 in a day. Missed calls go to an AI receptionist from $400 in 2 days. No-shows: a booking bot with reminders from $150 in an hour. What hurts the most?'],
    [/social|content|post|reels|video/i, 'Social media on autopilot is $120 a month: content plan, 12 posts and 8 stories, edited by a human. Reels and Shorts with AI: 8 videos for $150 a month. Which network do you run?'],
    [/google|map|found|seo/i, 'Google Business Profile and local SEO is $120 in 2 days: people find you on the map and in search, plus automatic reviews. Where is your business?'],
    [/routine|manual|sheet|document|invoice|contract/i, 'Process automation is from $200, same day: we connect Sheets, CRM, Telegram, email and payments so data moves itself. A document generator (invoices, acts, proposals to PDF) is from $150. What do you do by hand most often?'],
    [/store|shop|product/i, 'An online store is from $400, 1–2 days: up to 100 products, payments, delivery, admin panel, Instagram catalog. How many products do you plan?'],
    [/coffee|salon|site|landing|website/i, 'A business website is $100, ready in a few hours: up to 5 screens, mobile, Telegram button, hosting for a year. If you already have a site that doesn\'t sell, an audit and rework is $150. Leave a contact for the quote?'],
    [/bot|telegram|book/i, 'A booking bot with reminders is from $150, ready in an hour. An AI assistant that answers customers itself is from $300 in a day. Which is closer?'],
    [/ads|target|traffic/i, 'A Meta or Google Ads launch is $150 plus budget, live the same day. AI drafts creatives, we scale the ones that bring leads. What are we promoting?'],
    [/price|cost|budget|how much|cheap/i, 'The cheapest start is the $100 AI audit. Website $100, bot from $150, AI assistant from $300, store from $400, CRM from $1,000. It all depends on the brief; exact price within an hour. What hurts?'],
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
