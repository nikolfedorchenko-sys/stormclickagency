import { t } from './i18n.js';

// Лінія «заявки за тиждень»: одна серія, тонка лінія, тиха сітка, підказка при наведенні.
const DATA = [12, 18, 15, 24, 31, 29, 38, 47, 44, 56, 63, 71];
const NS = 'http://www.w3.org/2000/svg';
const el = (name, attrs = {}) => {
  const n = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  return n;
};

export function initChart(figure) {
  const svg = figure.querySelector('.chart-svg');
  const tip = figure.querySelector('.chart-tip');
  const W = 320;
  const H = 140;
  const pad = { l: 30, r: 10, t: 10, b: 22 };
  const max = 80;
  const x = (i) => pad.l + (i / (DATA.length - 1)) * (W - pad.l - pad.r);
  const y = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b);

  // Сітка і підписи осі
  [0, 20, 40, 60, 80].forEach((v) => {
    svg.append(el('line', { x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v), class: 'grid' }));
    svg.append(Object.assign(el('text', { x: pad.l - 6, y: y(v) + 3, class: 'tick', 'text-anchor': 'end' }), { textContent: v }));
  });
  const labels = el('g');
  svg.append(labels);

  const d = DATA.map((v, i) => `${i ? 'L' : 'M'}${x(i)} ${y(v)}`).join(' ');
  const area = el('path', { d: `${d} L${x(DATA.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`, class: 'area' });
  const line = el('path', { d, class: 'line' });
  svg.append(area, line);

  // Підпис тільки на крайніх точках
  const last = DATA.length - 1;
  svg.append(el('circle', { cx: x(last), cy: y(DATA[last]), r: 4, class: 'dot' }));
  svg.append(Object.assign(el('text', { x: x(last) - 8, y: y(DATA[last]) - 8, class: 'label', 'text-anchor': 'end' }), { textContent: DATA[last] }));

  const hover = el('g', { class: 'hover', visibility: 'hidden' });
  const vline = el('line', { y1: pad.t, y2: H - pad.b, class: 'crosshair' });
  const hdot = el('circle', { r: 4, class: 'dot' });
  hover.append(vline, hdot);
  svg.append(hover);

  const renderLabels = () => {
    labels.innerHTML = '';
    [0, 3, 6, 9, 11].forEach((i) => labels.append(Object.assign(el('text', { x: x(i), y: H - 6, class: 'tick', 'text-anchor': 'middle' }), { textContent: `${t('traffic.week')} ${i + 1}` })));
  };
  renderLabels();
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', renderLabels));

  // Лінія малюється, коли блок у кадрі
  const len = line.getTotalLength();
  line.style.strokeDasharray = len;
  line.style.strokeDashoffset = len;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) figure.classList.add('is-drawn');
  }, { threshold: 0.4 }).observe(figure);

  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(last, Math.round(((px - pad.l) / (W - pad.l - pad.r)) * last)));
    hover.setAttribute('visibility', 'visible');
    vline.setAttribute('x1', x(i));
    vline.setAttribute('x2', x(i));
    hdot.setAttribute('cx', x(i));
    hdot.setAttribute('cy', y(DATA[i]));
    tip.hidden = false;
    tip.textContent = `${t('traffic.week')} ${i + 1}: ${DATA[i]}`;
    tip.style.left = `${(x(i) / W) * 100}%`;
    tip.style.top = `${(y(DATA[i]) / H) * 100}%`;
  });
  svg.addEventListener('pointerleave', () => { hover.setAttribute('visibility', 'hidden'); tip.hidden = true; });
}
