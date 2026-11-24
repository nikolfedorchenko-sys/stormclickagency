import { CONFIG } from './config.js';
import { t, getLang, onLangChange } from './i18n.js';
import { PAINS, ENTRY } from './pricing.js';

// Квіз-заявка: послуга → бюджет → терміни → контакт. Поки немає сервера,
// заявка відкривається готовим повідомленням у Telegram.
export function initQuiz(form) {
  const panes = [...form.querySelectorAll('.quiz-pane')];
  const back = form.querySelector('.quiz-back');
  const next = form.querySelector('.quiz-next');
  const submit = form.querySelector('.quiz-submit');
  const status = form.querySelector('.quiz-status');
  const bar = form.querySelector('.quiz-bar i');
  const current = form.querySelector('.quiz-current');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let step = 0;

  // «Заряд» кроків: іскра на кінці смуги прогресу мерехтить, лише поки форма видима
  if (!reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => form.classList.toggle('go', e.isIntersecting), { threshold: 0.1 }).observe(form);
  }
  // Імпульс при відправці: блискавка на кнопці спалахує, яскравий імпульс біжить рамкою форми від кнопки
  // вгору до правого верхнього кута (~1,15 с) – «заявка полетіла до команди». Поверх полів не йде.
  const trace = form.querySelector('.quiz-trace');
  const traceRect = trace && trace.querySelector('rect');
  function fly() {
    if (reduce || !traceRect || !traceRect.animate) return 0;
    const r = form.getBoundingClientRect(); const w = r.width; const h = r.height;
    trace.setAttribute('viewBox', `0 0 ${w + 2} ${h + 2}`);
    traceRect.setAttribute('width', w); traceRect.setAttribute('height', h);
    const per = traceRect.getTotalLength(); const dash = 150; const arc = Math.PI * 14 / 2;
    // контур rect іде за годинниковою стрілкою від верхнього лівого кута; кнопка – праворуч унизу.
    // Імпульс рухається назад по контуру: від правого нижнього кута вгору правою стороною до верхнього правого кута.
    const p1 = (w - 28) + arc + (h - 28) + arc * 0.6; const p0 = (w - 28) - 40;
    traceRect.style.strokeDasharray = `${dash} ${per}`;
    submit.classList.remove('zap'); void submit.offsetWidth; submit.classList.add('zap');
    traceRect.animate([{ strokeDashoffset: -(p1 - dash * 0.2), opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.75 }, { strokeDashoffset: -(p0 - dash), opacity: 0 }],
      { duration: 1150, easing: 'cubic-bezier(.35,0,.25,1)', fill: 'forwards' });
    return 650;   // статус – коли імпульс уже «долетів» до верху
  }

  // Варіанти першого кроку: вхідний продукт + болі (деталізацію уточнить команда)
  const choices = form.querySelector('.choices-service');
  const renderChoices = () => {
    const lang = getLang();
    const opts = [
      { id: 'audit', label: ENTRY[lang][0] },
      ...PAINS.map((p) => ({ id: p.id, label: p[lang].pain })),
      { id: 'other', label: t('quiz.other') },
    ];
    choices.innerHTML = opts.map((o, i) => `<label><input type="radio" name="service" value="${o.id}"${i === 0 ? ' required' : ''}><span>${o.label}</span></label>`).join('');
    choices.querySelectorAll('input').forEach((r) => r.addEventListener('change', () => setTimeout(() => go(1), 180)));
  };
  renderChoices();
  onLangChange(renderChoices);

  // Клік по послузі на сайті: одразу відмічаємо відповідний біль у квізі
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-service]');
    if (!link) return;
    const id = link.dataset.service;
    const painId = id === 'audit' ? 'audit' : PAINS.find((p) => p.items.some((it) => it.id === id))?.id;
    const radio = choices.querySelector(`input[value="${painId}"]`);
    if (radio) { radio.checked = true; step = 1; show(); }
  });

  const show = () => {
    panes.forEach((p, i) => { p.hidden = i !== step; });
    back.hidden = step === 0;
    next.hidden = step === panes.length - 1;
    submit.hidden = step !== panes.length - 1;
    bar.style.width = `${((step + 1) / panes.length) * 100}%`;
    current.textContent = step + 1;
    form.classList.remove('shake');
  };

  const valid = () => {
    const pane = panes[step];
    const fields = [...pane.querySelectorAll('input, textarea')].filter((f) => f.type !== 'hidden');
    const radios = fields.filter((f) => f.type === 'radio');
    if (radios.length) return radios.some((r) => r.checked);
    return fields.every((f) => !f.required || f.value.trim());
  };

  const go = (dir) => {
    if (dir > 0 && !valid()) {
      form.classList.add('shake');
      setTimeout(() => form.classList.remove('shake'), 500);
      return;
    }
    step = Math.max(0, Math.min(panes.length - 1, step + dir));
    show();
  };

  back.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  // Вибір варіанта одразу веде далі
  form.querySelectorAll('input[type=radio]:not([name=service])').forEach((r) => r.addEventListener('change', () => setTimeout(() => go(1), 180)));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!valid()) { go(1); return; }
    const data = Object.fromEntries(new FormData(form));
    if (data.website) return; // honeypot

    const label = (name) => form.querySelector(`input[name=${name}]:checked`)?.parentElement.querySelector('span')?.textContent || '';
    const lines = [
      t('quiz.prefix'),
      `${t('quiz.l.service')}: ${label('service')}`,
      `${t('quiz.l.budget')}: ${label('budget')}`,
      `${t('quiz.l.timing')}: ${label('timing')}`,
      `${t('quiz.name')}: ${data.name}`,
      `${t('quiz.contact')}: ${data.contact}`,
      data.message ? `${t('quiz.comment')}: ${data.message}` : '',
    ].filter(Boolean);
    const text = lines.join('\n');
    const delay = fly();
    if (CONFIG.apiBase) {
      // Заявка летить у Telegram-бот і на email через Worker
      submit.disabled = true;
      fetch(`${CONFIG.apiBase}/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, service: label('service'), budget: label('budget'), timing: label('timing') }),
      })
        .then((r) => { if (!r.ok) throw new Error(r.status); status.textContent = t('quiz.sent'); form.reset(); })
        .catch(() => { status.textContent = t('assistant.error'); })
        .finally(() => { submit.disabled = false; });
      return;
    }
    // Без Worker: відкриваємо Telegram із готовим текстом заявки
    window.open(`https://t.me/${CONFIG.telegram}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    navigator.clipboard?.writeText(text).catch(() => {});
    setTimeout(() => { status.textContent = t('quiz.success'); }, delay);
  });

  show();
}
