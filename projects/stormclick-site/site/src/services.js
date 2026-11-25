import { PAINS, ENTRY, EXTRAS } from './pricing.js';
import { getLang, onLangChange } from './i18n.js';

// Рендерить рядок якорів груп, вхідний продукт, болі з послугами (з pricing.js) і рядок «також».
// Якорі – звичайні посилання #pain-<id>; плавну прокрутку через Lenis додає main.js (initSmoothScroll).
// Групу до 4 карток ставимо в один ряд із 4 колонок. Більшу – у 3 або 4 колонки: беремо ту сітку,
// де останній ряд заповнений більше, тож картка-«сирота» не лишається сама (5 → 3+2, 6 → 3+3, 7 → 4+3,
// 9 → 3+3+3, 10 → 4+4+2). За рівного заповнення беремо 4 колонки (8 → 4+4, 12 → 4+4+4).
// 13 карток лишають одну саму в обох сітках; код тоді бере 3 колонки. Зараз у групах 4 або 6 карток.
const lastRow = (n, cols) => (n % cols || cols) / cols;
const cols3 = (n) => n > 4 && lastRow(n, 3) > lastRow(n, 4);

export function initServices() {
  const entry = document.getElementById('entry');
  const pains = document.getElementById('pains');
  const extras = document.getElementById('extras');
  const nav = document.getElementById('pain-nav');
  let fade = () => {};

  const render = () => {
    const lang = getLang();
    const [title, text, price, time, cta] = ENTRY[lang];
    entry.innerHTML = `
      <div class="entry-card" data-tilt>
        <div class="entry-body">
          <span class="card-time">${time}</span>
          <h3>${title}</h3>
          <p>${text}</p>
        </div>
        <div class="entry-side">
          <b class="card-price">${price}</b>
          <a href="#contact" class="btn btn-primary" data-service="audit">${cta}</a>
        </div>
      </div>`;

    if (nav) {
      nav.innerHTML = `<ul class="pain-nav-list">${PAINS.map((p, i) => `<li><a href="#pain-${p.id}"><span class="pain-nav-num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>${p[lang].short}</a></li>`).join('')}</ul>`;
      // телефон: рядок гортається вбік – затемнення показує, з якого боку є ще кнопки
      const list = nav.firstElementChild;
      fade = () => {
        const max = list.scrollWidth - list.clientWidth;
        nav.classList.toggle('can-left', list.scrollLeft > 4);
        nav.classList.toggle('can-right', list.scrollLeft < max - 4);
      };
      list.addEventListener('scroll', fade, { passive: true });
      fade();
    }

    pains.innerHTML = PAINS.map((p, i) => `
      <section class="pain" id="pain-${p.id}" tabindex="-1">
        <header class="pain-head">
          <span class="pain-num">${String(i + 1).padStart(2, '0')}</span>
          <div><h3>${p[lang].pain}</h3><p>${p[lang].hint}</p></div>
        </header>
        <div class="pain-grid${cols3(p.items.length) ? ' cols-3' : ''}">
          ${p.items.map((it) => {
            const [t, d, pr, tm] = it[lang];
            return `<article class="card" data-tilt>
              <div class="card-top"><span class="card-time">${tm}</span></div>
              <h4>${t}</h4><p>${d}</p>
              <div class="card-foot"><b class="card-price">${pr}</b><a href="#contact" class="card-link" data-service="${it.id}">→</a></div>
            </article>`;
          }).join('')}
        </div>
      </section>`).join('');

    extras.textContent = EXTRAS[lang];
    document.dispatchEvent(new CustomEvent('services:rendered'));
  };

  render();
  onLangChange(render);
  addEventListener('resize', () => fade(), { passive: true });
  document.fonts?.ready.then(() => fade());
}
