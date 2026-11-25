// Послуги: імпульс «біль → рішення». Тонкий «дріт» іде від болю через ряд карток; яскравий імпульс
// пробігає ним (1,3 с, телефон – униз 1,7 с) і по черзі «вмикає» картки та ціни. Повтор раз на 5–8 с,
// групи розсинхронізовані. Працює лише поки група видима; reduced-motion – дріт статичний, без імпульсу.
// Картки рендерить services.js (і заново при зміні мови) – тому ініціалізація по події services:rendered.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let groups = [];

function setupGroup(pain, i) {
  const gi = i % 3;   // зсув фази: сусідні групи розсинхронізовані, а остання з шести не чекає старту 3 с
  const grid = pain.querySelector('.pain-grid');
  const cards = [...grid.querySelectorAll('.card')];
  if (!cards.length) return null;
  const wire = document.createElement('span');
  const spark = document.createElement('span');
  spark.className = 'spark';
  wire.appendChild(spark);
  wire.setAttribute('aria-hidden', 'true');
  grid.appendChild(wire);
  let vis = false; let t = 0; const lit = [];

  const vertical = () => cards.length > 1 && cards[1].getBoundingClientRect().top > cards[0].getBoundingClientRect().bottom - 2;
  const setup = () => { wire.className = `wire ${vertical() ? 'v' : 'h'}`; };
  function run() {
    if (!vis) return;
    lit.forEach(clearTimeout); lit.length = 0;   // таймери попереднього проходу вже відпрацювали – не накопичуємо
    setup();
    const v = vertical(); const gr = grid.getBoundingClientRect(); const dur = v ? 1700 : 1300;
    const from = v ? -8 : -6; const to = v ? gr.height : gr.width + 6;
    // іскра – дочірній елемент дроту: рухається по самому дроту (у макеті був зайвий зсув -12 px, і іскра йшла над ним)
    spark.animate(v
      ? [{ transform: `translate(0,${from}px)`, opacity: 0 }, { opacity: 1, offset: 0.06 }, { opacity: 1, offset: 0.94 }, { transform: `translate(0,${to}px)`, opacity: 0 }]
      : [{ transform: `translate(${from}px,0)`, opacity: 0 }, { opacity: 1, offset: 0.06 }, { opacity: 1, offset: 0.94 }, { transform: `translate(${to}px,0)`, opacity: 0 }],
    { duration: dur, easing: 'cubic-bezier(.45,0,.55,1)' });
    // картка «вмикається», коли імпульс доходить до неї (2 колонки – по лівому краю, тобто по рядках зліва направо)
    cards.forEach((c) => {
      const r = c.getBoundingClientRect();
      const k = v ? (r.top + 30 - gr.top - from) / (to - from) : (r.left + 24 - gr.left - from) / (to - from);
      lit.push(setTimeout(() => { c.classList.add('lit'); lit.push(setTimeout(() => c.classList.remove('lit'), 650)); }, Math.max(0, k) * dur));
    });
    t = setTimeout(run, 5200 + gi * 900 + Math.random() * 1500);
  }
  const stopAll = () => { clearTimeout(t); lit.forEach(clearTimeout); lit.length = 0; cards.forEach((c) => c.classList.remove('lit')); };

  setup();
  if (reduce) return { destroy() {}, setup };
  const io = new IntersectionObserver(([e]) => {
    vis = e.isIntersecting; stopAll();
    if (vis) t = setTimeout(run, 400 + gi * 500);
  }, { threshold: 0.35 });
  io.observe(pain);
  return { destroy() { io.disconnect(); stopAll(); }, setup };
}

function init() {
  groups.forEach((g) => g && g.destroy());
  groups = [...document.querySelectorAll('#pains .pain')].map(setupGroup);
}

export function initPainPulse() {
  document.addEventListener('services:rendered', init);
  if (document.querySelector('#pains .pain')) init();
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => groups.forEach((g) => g && g.setup()), 150); });
}
