// «Чому так дешево і швидко»: конвеєр «Задача → ШІ → Людина → Результат» (canvas 2D).
// Задача розпадається на NEED частинок → вони дуже швидко прошивають мережу ШІ (3 шари × 4 вузли) →
// стоять у черзі перед «воротами» людини, яка пропускає по одній (300 мс; ~20% повертає на доопрацювання) →
// перевірені наповнюють «Результат»; повний – спалах і підпис світиться, цикл заново.
// Позиції станцій – з DOM-підписів (.flow-steps li). Працює лише поки видимий; reduced-motion – статичний кадр.
import { onLangChange } from './i18n.js';

const NEED = 10;   // кількість частинок однієї задачі; усі (і повернуті) доходять до «Результату» – один спалах на цикл

export function initFlow(flow) {
  if (!flow) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = flow.querySelector('canvas'); const c = cv.getContext('2d');
  const lis = [...flow.querySelectorAll('.flow-steps li')];
  let W; let H; let dpr; let horiz; let st = []; let nodes = []; let edges = []; let parts = []; let fill = 0; let queue = [];
  let gateT = 0; let cycleT = 0; let raf = 0; let vis = false; let last = 0; let flash = 0; const timers = [];

  function stationPos(li) {
    const r = li.getBoundingClientRect(); const fr = flow.getBoundingClientRect(); const b = li.querySelector('b').getBoundingClientRect();
    return horiz ? { x: r.left + r.width / 2 - fr.left, y: 104 } : { x: 48, y: b.top + b.height / 2 - fr.top };
  }
  function layout() {
    const r = flow.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height;
    // напрям – з фактичної розкладки підписів (CSS: 4 колонки від 900 px), а не з ширини блоку
    horiz = lis.length > 1 && Math.abs(lis[1].getBoundingClientRect().top - lis[0].getBoundingClientRect().top) < 4;
    if (!W || !H) return;
    cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
    st = lis.map(stationPos);
    // мережа ШІ: 3 шари по 4 вузли навколо станції «ШІ» (вздовж потоку – шари, поперек – вузли)
    nodes = []; edges = [];
    const a = st[1];
    const span = horiz ? Math.min(150, (st[2].x - st[0].x) * 0.42) : Math.min(76, (st[2].y - st[0].y) * 0.34); const across = horiz ? 34 : 18;
    for (let l = 0; l < 3; l++) {
      for (let n = 0; n < 4; n++) {
        const u = (l - 1) * span / 2; const v = (n - 1.5) * across;
        nodes.push({ l, x: horiz ? a.x + u : a.x + v, y: horiz ? a.y + v : a.y + u, heat: 0 });
      }
    }
    nodes.forEach((p, i) => { if (p.l < 2) nodes.forEach((q, j) => { if (q.l === p.l + 1) edges.push({ a: i, b: j, heat: 0 }); }); });
    parts = []; queue = []; fill = reduce ? fill : 0; cycleT = 0;
    draw();
  }
  const pt = (i) => nodes[i];
  const rand4 = () => (Math.random() * 4) | 0;
  function spawnTask() {
    for (let i = 0; i < NEED; i++) parts.push({ stage: 0, t: -i * 70, path: [rand4(), 4 + rand4(), 8 + rand4()], x: st[0].x, y: st[0].y, back: false });
  }
  const lerp = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
  const gatePos = () => (horiz ? { x: st[2].x - 26, y: st[2].y } : { x: st[2].x, y: st[2].y - 18 });
  function step(dt) {
    cycleT -= dt; if (cycleT <= 0 && !parts.length && !queue.length) { spawnTask(); cycleT = 1e9; }
    nodes.forEach((n) => { n.heat *= Math.pow(0.992, dt); }); edges.forEach((e) => { e.heat *= Math.pow(0.993, dt); });
    flash = Math.max(0, flash - dt / 600);
    const g = gatePos();
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += dt; if (p.t < 0) continue;
      if (p.stage === 0) { // задача → перший шар (швидко)
        const k = Math.min(1, p.t / 260); const q = lerp(st[0], pt(p.path[0]), k); p.x = q.x; p.y = q.y;
        if (k >= 1) { p.stage = 1; p.t = 0; pt(p.path[0]).heat = 1; }
      } else if (p.stage === 1 || p.stage === 2) { // всередині мережі – дуже швидко («хвилини»)
        const from = pt(p.path[p.stage - 1]); const to = pt(p.path[p.stage]); const k = Math.min(1, p.t / 110); const q = lerp(from, to, k); p.x = q.x; p.y = q.y;
        if (k >= 1) { to.heat = 1; edges.forEach((e) => { if (nodes[e.a] === from && nodes[e.b] === to) e.heat = 1; }); p.stage++; p.t = 0; }
      } else if (p.stage === 3) { // до людини – черга перед перевіркою
        const k = Math.min(1, p.t / 380); const q = lerp(pt(p.path[2]), g, k); p.x = q.x; p.y = q.y;
        if (k >= 1) { p.stage = 4; queue.push(p); }
      } else if (p.stage === 5) { // перевірено → результат
        const k = Math.min(1, p.t / 420); const q = lerp(g, st[3], k); p.x = q.x; p.y = q.y;
        if (k >= 1) {
          parts.splice(i, 1); fill++;
          if (fill >= NEED) {
            flash = 1; flow.classList.add('done-flash');
            timers.push(setTimeout(() => flow.classList.remove('done-flash'), 900));
            timers.push(setTimeout(() => { fill = 0; }, 1300));
            cycleT = 2200;
          }
        }
      } else if (p.stage === 6) { // повернуто на доопрацювання – назад у мережу дугою
        const k = Math.min(1, p.t / 700); const a6 = lerp(g, pt(p.path[0]), k); const bow = Math.sin(k * Math.PI) * 34;
        p.x = a6.x + (horiz ? 0 : bow); p.y = a6.y + (horiz ? -bow : 0);
        if (k >= 1) { p.stage = 1; p.t = 0; p.path = [p.path[0], 4 + rand4(), 8 + rand4()]; p.back = true; }
      }
    }
    // людина перевіряє по одній частині – повільніше за ШІ
    gateT -= dt;
    if (gateT <= 0 && queue.length) {
      const q = queue.shift(); gateT = 300;
      if (!q.back && Math.random() < 0.2) { q.stage = 6; q.t = 0; } else { q.stage = 5; q.t = 0; }
    }
    queue.forEach((p, i) => { const off = (i + 1) * 9; p.x = g.x - (horiz ? off : 0); p.y = g.y - (horiz ? 0 : off); });
  }
  function draw() {
    if (!st.length) return;
    c.clearRect(0, 0, W, H);
    const g = gatePos();
    // магістраль
    c.lineWidth = 1; c.strokeStyle = 'rgba(124,136,255,.22)';
    c.beginPath();
    nodes.slice(0, 4).forEach((n) => { c.moveTo(st[0].x, st[0].y); c.lineTo(n.x, n.y); });
    nodes.slice(8).forEach((n) => { c.moveTo(n.x, n.y); c.lineTo(g.x, g.y); });
    c.moveTo(g.x, g.y); c.lineTo(st[3].x, st[3].y); c.stroke();
    edges.forEach((e) => {
      const a = nodes[e.a]; const b = nodes[e.b];
      c.strokeStyle = `rgba(154,163,255,${0.12 + 0.7 * e.heat})`; c.lineWidth = 0.8 + e.heat * 1.2;
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    });
    nodes.forEach((n) => { c.beginPath(); c.arc(n.x, n.y, 3 + n.heat * 1.5, 0, 6.283); c.fillStyle = n.heat > 0.05 ? `rgba(220,224,255,${0.35 + 0.65 * n.heat})` : '#3A3F6E'; c.fill(); });
    // задача
    c.beginPath(); c.arc(st[0].x, st[0].y, 7, 0, 6.283); c.strokeStyle = '#9AA3FF'; c.lineWidth = 2; c.stroke();
    // людина: «ворота» з галочкою
    c.strokeStyle = '#9AA3FF'; c.lineWidth = 2; c.beginPath();
    if (horiz) { c.moveTo(g.x + 8, g.y - 22); c.lineTo(g.x + 8, g.y + 22); } else { c.moveTo(g.x - 22, g.y + 8); c.lineTo(g.x + 22, g.y + 8); }
    c.stroke();
    const hx = st[2].x + (horiz ? 10 : 0); const hy = st[2].y + (horiz ? 0 : 6);
    c.beginPath(); c.moveTo(hx - 6, hy); c.lineTo(hx - 1, hy + 5); c.lineTo(hx + 8, hy - 6); c.lineWidth = 2.4; c.strokeStyle = '#5CE39A'; c.stroke();
    // результат: блок, що наповнюється перевіреними частинами
    const R = st[3]; const bw = 40; const bh = 48; const k = Math.min(1, fill / NEED);
    c.strokeStyle = flash > 0 ? `rgba(255,255,255,${0.5 + 0.5 * flash})` : '#9AA3FF'; c.lineWidth = 2; c.strokeRect(R.x - bw / 2, R.y - bh / 2, bw, bh);
    c.fillStyle = `rgba(124,136,255,${0.35 + 0.5 * flash})`; c.fillRect(R.x - bw / 2 + 3, R.y + bh / 2 - 3 - (bh - 6) * k, bw - 6, (bh - 6) * k);
    if (flash > 0) { c.save(); c.shadowColor = 'rgba(154,163,255,1)'; c.shadowBlur = 24 * flash; c.strokeRect(R.x - bw / 2, R.y - bh / 2, bw, bh); c.restore(); }
    // частини роботи
    parts.forEach((p) => {
      if (p.t < 0 && p.stage === 0) return;
      c.beginPath(); c.arc(p.x, p.y, p.stage === 6 ? 2.2 : 2.6, 0, 6.283);
      c.fillStyle = p.stage === 6 ? 'rgba(163,167,191,.85)' : p.stage === 5 ? '#FFFFFF' : 'rgba(200,206,255,.95)'; c.fill();
    });
  }
  function loop(n) { const dt = Math.min(50, n - (last || n)); last = n; step(dt); draw(); if (vis) raf = requestAnimationFrame(loop); }
  // статичний кадр: мережа частково підсвічена, результат наполовину готовий
  function still() { edges.forEach((e, i) => { e.heat = i % 5 === 0 ? 0.8 : 0; }); fill = NEED / 2; draw(); }

  let rt = 0;
  const relayout = () => { layout(); if (reduce) still(); };
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(relayout, 150); });
  onLangChange(() => requestAnimationFrame(relayout));   // підписи станцій змінюють висоту рядків
  document.fonts.ready.then(() => {
    relayout();
    if (reduce) return;
    new IntersectionObserver(([e]) => {
      vis = e.isIntersecting; cancelAnimationFrame(raf); last = 0;
      if (vis) { layout(); raf = requestAnimationFrame(loop); } else { timers.forEach(clearTimeout); timers.length = 0; flow.classList.remove('done-flash'); }
    }, { threshold: 0.2 }).observe(flow);
  });
}
