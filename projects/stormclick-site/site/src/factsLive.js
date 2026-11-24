// Факти: живі лічильники. «годин» – дві доріжки з фінішною рискою (ми – години, агенція – тижні);
// «24/7» – доба-циферблат: повідомлення в будь-яку годину, за мить біля кожного – кільце-відповідь;
// «15 хв» – таймер «запит → розрахунок»; «$100» – статична картка.
// CSS-анімації вмикаються класом .go лише поки елемент видимий; поза екраном і при reduced-motion – кінцевий стан.
const NS = 'http://www.w3.org/2000/svg';

function onView(el, cb, threshold) {
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);
}

export function initFactsLive(root) {
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const race = root.querySelector('[data-live="race"]');
  const timer = root.querySelector('[data-live="timer"]');
  const dial = root.querySelector('[data-live="dial"]');
  if (!reduce) {
    if (race) onView(race, (v) => race.classList.toggle('go', v), 0.5);
    if (timer) onView(timer, (v) => timer.classList.toggle('go', v), 0.5);
  }
  if (!dial) return;
  const g = dial.querySelector('.msgs'); let t = 0; let vis = false;
  const el = (n, a) => { const e = document.createElementNS(NS, n); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
  // повідомлення – «бульбашка» на колі доби; за мить навколо неї спалах-кільце – відповідь
  function msg(ang, still) {
    const x = 46 + Math.sin(ang) * 38; const y = 46 - Math.cos(ang) * 38;
    const ring = el('circle', { cx: x, cy: y, r: 5, fill: 'none', stroke: '#9AA3FF', 'stroke-width': 2, opacity: 0 });
    const dot = el('path', { d: `M${x - 5} ${y - 4}h10a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-6l-3 3v-3h-1a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2z`, fill: '#F2F3F8' });
    g.append(ring, dot);
    if (still) { dot.setAttribute('fill', '#9AA3FF'); return; }
    dot.animate([{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none', offset: 0.15 }, { opacity: 1, fill: '#F2F3F8', offset: 0.3 }, { fill: '#9AA3FF', offset: 0.38 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 2600, fill: 'forwards' });
    ring.animate([{ opacity: 0, r: 5 }, { opacity: 0, r: 5, offset: 0.3 }, { opacity: 1, r: 7, offset: 0.38 }, { opacity: 0, r: 15, offset: 0.62 }, { opacity: 0 }], { duration: 2600, fill: 'forwards' });
    setTimeout(() => { dot.remove(); ring.remove(); }, 2700);
  }
  function run() { if (!vis) return; msg(Math.random() * Math.PI * 2); t = setTimeout(run, 1100 + Math.random() * 1100); }
  if (reduce) { [0.6, 2.2, 3.6, 5.1].forEach((a) => msg(a, true)); return; }
  onView(dial, (v) => { vis = v; clearTimeout(t); dial.classList.toggle('go', v); if (v) run(); }, 0.4);
}
