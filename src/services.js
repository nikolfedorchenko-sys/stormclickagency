import { PAINS, ENTRY, EXTRAS } from './pricing.js';
import { getLang, onLangChange } from './i18n.js';

// Рендерить вхідний продукт, чотири болі з послугами і рядок «також»
export function initServices() {
  const entry = document.getElementById('entry');
  const pains = document.getElementById('pains');
  const extras = document.getElementById('extras');

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

    pains.innerHTML = PAINS.map((p, i) => `
      <section class="pain">
        <header class="pain-head">
          <span class="pain-num">0${i + 1}</span>
          <div><h3>${p[lang].pain}</h3><p>${p[lang].hint}</p></div>
        </header>
        <div class="pain-grid">
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
}
