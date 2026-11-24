// «Шторм на фоні»: одна сцена на весь екран для всієї сторінки після першого екрана.
// Перенесено з design/motion-concepts.html (бриф: design/design-brief.md, «Рух на всьому сайті»).
// Хмари – статичний canvas по краях екрана (будується раз на розмір екрана). Блискавка – другий canvas,
// requestAnimationFrame лише під час удару (~1,1 с). Між ударами – setTimeout.
// Де бити: заборонені зони рахуються з розмітки в момент удару (рядки тексту, картки, кнопки, форми,
// [data-storm="off"] – FAQ і контакт – повністю). Удар «прив'язаний» до сторінки: якщо під час удару
// гортають, блискавка їде разом із блоком (зсув – з реальної прокрутки Lenis).
// ?strike – застиглий удар у видимому екрані (після кожної прокрутки), ?calm – без ударів.

// Одна блискавка на екран: герой (storm.js) і фон сторінки не б'ють одночасно і не підряд –
// після будь-якого удару щонайменше 1,5 с тиші. Журнал ударів – для перевірок (останні 200).
export const StormBus = {
  owner: null, quietUntil: 0, log: [],
  claim(who) {
    const n = performance.now();
    if (this.owner || n < this.quietUntil) return false;
    this.owner = who;
    this.log.push({ who, t: Math.round(n) });
    if (this.log.length > 200) this.log.shift();
    return true;
  },
  release(who) { if (this.owner === who) { this.owner = null; this.quietUntil = performance.now() + 1500; } },
};
if (typeof window !== 'undefined') window.StormBus = StormBus;

// Що вважається блоком (обходиться цілим прямокутником). Текст поза блоками – по рядках.
const BLOCKS = '.card, .entry-card, .ai-card, .ai-try, .flow, .fact, .case, .review, .quiz, .chart, .funnel, .btn, button, input, textarea, '
  + '.faq-list, .marquee, .assistant-toggle, .assistant.is-open .assistant-panel, .sticky-cta, .extras, .counters, .demo-note';
// Секції, у яких текст обходиться по рядках
const SECTIONS = 'main > section:not(.hero)';

export function initSky() {
  const box = document.querySelector('.sky');
  const none = { setLenis() {} };
  if (!box) return none;
  const params = new URLSearchParams(location.search);
  const MODE = params.has('strike') ? 'strike' : (params.has('calm') ? 'calm' : 'live');
  const SEED = 9100 + (parseInt(params.get('strike'), 10) || 0);
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const cv = box.querySelector('.sky-clouds'), fx = box.querySelector('.sky-fx');
  const cctx = cv.getContext('2d'), fctx = fx.getContext('2d');
  const hero = document.getElementById('hero'), header = document.querySelector('.header');
  let lenis = null;
  const scrollPos = () => (lenis ? lenis.scroll : scrollY);

  // ---- Параметри (ті самі – у design-brief.md, «Рух на всьому сайті») ----
  var P = {
    first: 2500,                 // перший удар – через 2,5 с після того, як перший екран пішов з поля зору
    firstNarrow: 3000,           // вузькі екрани: 3–4 с після виходу з першого екрана (якщо є проміжок)
    gapMin: 5000, gapMax: 9000,  // пауза між ударами, десктоп
    gapMinM: 8000, gapMaxM: 14000, // вузькі екрани – рідше
    idle: 350,                   // бити лише коли сторінка не гортається хоча б 350 мс
    heroShare: .35,              // поки перший екран займає > 35% висоти екрана – б'є лише сцена героя
    leaderMin: 60, leaderMax: 110, pulseGapMin: 170, pulseGapMax: 260, tau: 65, tail: 650, // як у героя
    glowMax: .55,                // максимум підсвітки хмар/повітря
    minLen: 260, minLenM: 220,   // мінімальний видимий канал (вузькі екрани – діагональ через проміжок, ширина ≥ 80 px)
    margin: 24, marginM: 14,     // відступ ядра від тексту і блоків
    blockMargin: 40              // від секцій-«зон тиші» (FAQ, контакт)
  };

  function mulberry(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(ix, iy){ var h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function vnoise(x, y){ var ix = Math.floor(x), iy = Math.floor(y), u = x - ix, v = y - iy; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
    var a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(x, y){ var s = 0, amp = .5, f = 1; for (var o = 0; o < 4; o++){ s += amp * vnoise(x * f + o * 17.3, y * f - o * 9.1); f *= 2.03; amp *= .5; var t = x; x = x * .8 - y * .6; y = t * .6 + y * .8; } return s / .94; }
  function sstep(a, b, x){ x = (x - a) / (b - a); x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }

  // ---- Розміри і хмари ----
  var W = 0, H = 0, DPR = 1, mobile = false, narrow = false, side = 0, HH = 64, S = 4, cloudA = null;
  var cloudDark, cloudLit, cw, ch;
  function contentEdge(){ // ліве поле контенту: від краю екрана до тексту секцій
    var c = document.querySelector('#services .container'); if (!c) return 16;
    var r = c.getBoundingClientRect(), pl = parseFloat(getComputedStyle(c).paddingLeft) || 0; return r.left + pl;
  }
  function build(){
    W = innerWidth; H = innerHeight; mobile = W < 768; DPR = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
    HH = header.getBoundingClientRect().height; side = contentEdge(); S = 4;
    narrow = side < 56;   // режим за наявністю поля, а не за шириною: 360 і 768 – вузькі, від ~1200 – з полями
    cw = Math.ceil(W / S); ch = Math.ceil(H / S);
    cloudDark = document.createElement('canvas'); cloudLit = document.createElement('canvas');
    cloudDark.width = cloudLit.width = cw; cloudDark.height = cloudLit.height = ch;
    var dctx = cloudDark.getContext('2d'), lctx = cloudLit.getContext('2d');
    var di = dctx.createImageData(cw, ch), li = lctx.createImageData(cw, ch), dd = di.data, ld = li.data;
    var sc = mobile ? 110 : 190, band = mobile ? 84 : 120, edge = narrow ? 30 : Math.max(70, side + 30);
    for (var y = 0; y < ch; y++) for (var x = 0; x < cw; x++){
      var px = x * S, py = y * S;
      // стеля під шапкою + хмари вздовж бічних країв (на телефоні – вузька смуга)
      var top = 1 - sstep(HH + band * .25, HH + band, py);
      var dx = Math.min(px, W - px), sideM = (1 - sstep(edge * .45, edge + 40, dx)) * (.55 + .45 * (1 - sstep(H * .2, H, py)));
      var mask = Math.max(top * .95, sideM * (narrow ? .85 : 1));
      if (mask <= .01) continue;
      var n = fbm(px / sc, py / (sc * .62));
      var d = Math.min(1, sstep(.40, .80, n * .85 + mask * .40) * mask);
      if (d <= .004) continue;
      var n2 = fbm((px - 9) / sc, (py - 14) / (sc * .62)), sh = Math.max(0, Math.min(1, (n - n2) * 6 + .5));
      var i = (y * cw + x) * 4;
      // темніші за хмари першого екрана: під ними може пройти текст секції (контраст – у брифі)
      dd[i] = 12 + 12 * sh; dd[i + 1] = 13 + 14 * sh; dd[i + 2] = 26 + 26 * sh; dd[i + 3] = 255 * d * .9;
      ld[i] = 150 + 80 * sh; ld[i + 1] = 158 + 74 * sh; ld[i + 2] = 255; ld[i + 3] = 255 * Math.min(1, d * (.45 + .75 * sh));
    }
    dctx.putImageData(di, 0, 0); lctx.putImageData(li, 0, 0);
    cloudA = new Uint8Array(cw * ch); for (var a = 0; a < cw * ch; a++) cloudA[a] = dd[a * 4 + 3]; // альфа хмар – для cloudAt без getImageData
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    cctx.setTransform(1, 0, 0, 1, 0, 0); cctx.imageSmoothingQuality = 'high';
    cctx.drawImage(cloudDark, 0, 0, cv.width, cv.height);
    fx.width = Math.round(W * DPR); fx.height = Math.round(H * DPR);
  }

  // ---- Заборонені зони: сітка зайнятості 6 px ----
  var G = 6, gw, gh, occ, rects = [];
  function mark(l, t, r, b){ var x0 = Math.max(0, Math.floor(l / G)), x1 = Math.min(gw - 1, Math.floor(r / G)), y0 = Math.max(0, Math.floor(t / G)), y1 = Math.min(gh - 1, Math.floor(b / G));
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) occ[y * gw + x] = 1; }
  function visible(r){ return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < H && r.right > 0 && r.left < W; }
  function measure(){
    gw = Math.ceil(W / G) + 1; gh = Math.ceil(H / G) + 1; occ = new Uint8Array(gw * gh); rects = [];
    var m = mobile ? P.marginM : P.margin;
    // Блок, що ще «випливає» (GSAP .reveal: зсув до 36 px униз, далі їде на своє місце) – зона охоплює і
    // поточне положення, і кінцеве (поточне мінус залишок зсуву), щоб удар не ліг туди, куди блок доїде
    var revealDy = new Map();
    function shiftOf(el){
      var rv = el && el.closest('.reveal'); if (!rv) return 0;
      if (revealDy.has(rv)) return revealDy.get(rv);
      var cs = getComputedStyle(rv), dy = 0;
      if (cs.transform && cs.transform !== 'none'){ try { dy = new DOMMatrixReadOnly(cs.transform).m42; } catch (e) { dy = 0; } }
      revealDy.set(rv, dy); return dy;
    }
    function add(r, mm, el){
      var dy = shiftOf(el), t = Math.min(r.top, r.top - dy), b = Math.max(r.bottom, r.bottom - dy);
      rects.push({ l: r.left, t: t, r: r.right, b: b }); mark(r.left - mm, t - mm, r.right + mm, b + mm);
    }
    mark(-9, -9, W + 9, HH + 6);                                         // шапка
    var hr = hero.getBoundingClientRect(); if (hr.bottom > 0) mark(-9, -9, W + 9, hr.bottom + 30); // перший екран – його власна сцена
    document.querySelectorAll('[data-storm="off"]').forEach(function(s){ var r = s.getBoundingClientRect(); if (visible(r)) mark(-9, r.top - P.blockMargin, W + 9, r.bottom + P.blockMargin); });
    var blocks = [];
    var fr = document.querySelector('.footer'); if (fr){ var frr = fr.getBoundingClientRect(); if (visible(frr)) mark(-9, frr.top - m, W + 9, H + 9); } // футер непрозорий – під ним удару не видно
    document.querySelectorAll(BLOCKS).forEach(function(el){ if (el.closest('.hero') || el.closest('.header')) return; var r = el.getBoundingClientRect(); if (visible(r)) { add(r, m, el); blocks.push(el); } });
    // текст поза блоками – кожен рядок окремо (вільне місце праворуч від коротких заголовків лишається)
    document.querySelectorAll(SECTIONS).forEach(function(sec){
      var sr = sec.getBoundingClientRect(); if (!visible(sr)) return;
      var tw = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT), n, rg = document.createRange();
      while ((n = tw.nextNode())){
        if (!n.nodeValue.trim()) continue;
        var pe = n.parentElement; if (!pe || pe.closest(BLOCKS)) continue;
        var er = pe.getBoundingClientRect(); if (!visible(er)) continue;
        rg.selectNodeContents(n); var rs = rg.getClientRects();
        for (var i = 0; i < rs.length; i++) if (visible(rs[i])) add(rs[i], m, pe);
      }
    });
  }
  function blocked(x, y){ var e = narrow ? 4 : 14; if (x < e || x > W - e || y < 0 || y > H - 4) return true; var gx = Math.floor(x / G), gy = Math.floor(y / G); return occ[gy * gw + gx] === 1; }
  function segFree(x1, y1, x2, y2){ var d = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.ceil(d / 4)); for (var i = 0; i <= n; i++){ var k = i / n; if (blocked(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k)) return false; } return true; }
  function cloudAt(x, y){ // чи є хмара в точці старту (удар завжди виходить із хмари)
    var px = Math.min(cw - 1, Math.max(0, Math.round(x / S))), py = Math.min(ch - 1, Math.max(0, Math.round(y / S)));
    return cloudA[py * cw + px] / 255;
  }

  // ---- Форма ----
  function walk(rnd, x, y, tx, ty, o){
    var pts = [[x, y]], dir = Math.atan2(ty - y, tx - x), steps = 0;
    while (steps++ < o.maxSteps){
      var to = Math.atan2(ty - y, tx - x), dist = Math.hypot(tx - x, ty - y);
      if (dist < o.sMax){ if (segFree(x, y, tx, ty)) pts.push([tx, ty]); break; }
      var base = Math.atan2(Math.sin(dir) * .2 + Math.sin(to) * .8, Math.cos(dir) * .2 + Math.cos(to) * .8), ok = false;
      for (var k = 0; k < 10; k++){
        var a = base + (rnd() - .5) * o.jit * (rnd() < .18 ? 1.8 : 1) * (1 + k * .15);
        if (o.down){ var aa = Math.atan2(Math.sin(a), Math.cos(a)); if (aa < .26 || aa > Math.PI - .26) a = aa < -Math.PI / 2 || aa > Math.PI - .26 ? Math.PI - .26 : .26; }
        var len = o.sMin + rnd() * (o.sMax - o.sMin), nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len;
        if (ny < o.yMin) continue;
        if (segFree(x, y, nx, ny)){ x = nx; y = ny; dir = a; ok = true; break; }
      }
      if (!ok) break;
      pts.push([x, y]);
      if (o.budget && plen(pts) > o.budget) break;
    }
    return { pts: pts, reached: Math.hypot(tx - x, ty - y) < o.sMax * 1.5 };
  }
  function plen(p){ var s = 0; for (var i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; }
  function detail(rnd, pts, amp){
    for (var l = 0; l < 2; l++){ var out = [pts[0]];
      for (var i = 1; i < pts.length; i++){ var a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
        if (len > 6){ var o = (rnd() - .5) * 2 * amp * len, mx = (a[0] + b[0]) / 2 - dy / len * o, my = (a[1] + b[1]) / 2 + dx / len * o; if (!blocked(mx, my)) out.push([mx, my]); }
        out.push(b); }
      pts = out; }
    return pts;
  }
  // Вільні горизонтальні смуги на всю ширину (проміжки між секціями) – для вузьких екранів
  function freeBands(){
    var out = [], run = 0, y0 = 0, x0 = 2, x1 = gw - 3;
    for (var gy = 0; gy <= gh; gy++){
      var full = gy < gh;
      if (full){ var free = 0; for (var gx = x0; gx < x1; gx++) if (!occ[gy * gw + gx]) free++; full = free >= (x1 - x0) * .94; }
      if (full){ if (!run) y0 = gy; run++; }
      else { if (run * G >= 108) out.push({ t: y0 * G, b: (y0 + run) * G }); run = 0; }
    }
    return out;
  }
  function branchesFor(rnd, pts, k, want){
    var branches = [];
    for (var g = 0; g < 60 && branches.length < want; g++){
      var i = 2 + Math.floor(rnd() * Math.max(1, pts.length * .75 - 2)), p = pts[i], q = pts[i - 1];
      var md = Math.atan2(p[1] - q[1], p[0] - q[0]), sgn = rnd() < .5 ? -1 : 1, a = md + sgn * (.55 + rnd() * .6);
      var bl = plen(pts.slice(i)) * (.18 + rnd() * .28) + 24 * k;
      var br = walk(rnd, p[0], p[1], p[0] + Math.cos(a) * bl * 1.4, p[1] + Math.sin(a) * bl * 1.4, { sMin: 7 * k, sMax: 20 * k, jit: 1.5, maxSteps: 80, yMin: p[1] - 4, budget: bl, down: true });
      if (br.pts.length > 2) branches.push({ pts: br.pts, w: .55 + rnd() * .2 });
    }
    return branches;
  }
  function finishBolt(rnd, best, diag){
    var main2 = detail(rnd, best.pts, .2);
    best.branches.forEach(function(b){ b.pts = detail(rnd, b.pts, .14); });
    var yEnd = 0, x0 = 1e9, x1 = -1e9; main2.forEach(function(p){ yEnd = Math.max(yEnd, p[1]); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); });
    var end = best.pts[best.pts.length - 1];
    return { main: main2, branches: best.branches, sx: best.sx, sy: best.sy, ex: end[0], ey: end[1], yEnd: yEnd, len: best.len, width: x1 - x0, diag: !!diag, src: best.src,
      ang: Math.round(Math.atan2(Math.abs(end[1] - best.sy), Math.abs(end[0] - best.sx)) * 180 / Math.PI) };
  }
  // Вузькі екрани (телефон, 768 – поля контенту < 56 px): лише великий удар діагоналлю через
  // проміжок між секціями на всю ширину, з хмари на краю екрана. Немає проміжку – немає удару.
  // wide = десктоп: та сама діагональ, але з бічної хмари в полі і на 260–560 px усередину (не через увесь екран)
  function makeDiag(rnd, wide, side0){
    var bands = freeBands(); if (!bands.length) return null;
    var k = wide ? 1 : .8, best = null;
    // 768–1199 (поля < 56 px, але екран широкий): половина ударів – крутіше, 30–40°, якщо проміжок високий;
    // інакше діагональ на всю ширину виходить майже горизонтальною (10–20°)
    var tall = bands.filter(function(b){ return b.b - b.t >= 170; }), steep = !wide && W >= 600 && tall.length && rnd() < .5;
    if (steep) bands = tall;
    for (var tries = 0; tries < 60; tries++){
      var bd = bands[Math.floor(rnd() * bands.length)], hgt = bd.b - bd.t, left = side0 ? side0 === 'left' : rnd() < .5;
      var sx = wide ? (left ? 20 + rnd() * Math.max(4, side - 36) : W - 20 - rnd() * Math.max(4, side - 36)) : (left ? 6 + rnd() * 6 : W - 6 - rnd() * 6);
      var sy = bd.t + 6 + rnd() * Math.min(26, hgt * .2);
      var span = wide ? 260 + rnd() * 300 : 0;
      var tx = wide ? (left ? sx + span : sx - span) : left ? W * (.66 + rnd() * .28) : W * (.06 + rnd() * .28), ty = bd.b - 8 - rnd() * Math.min(26, hgt * .2);
      if (steep){ var th = (30 + rnd() * 10) * Math.PI / 180, sp = (ty - sy) / Math.tan(th); tx = left ? sx + sp : sx - sp; }
      if (blocked(sx, sy) || blocked(tx, ty)) continue;
      var main = walk(rnd, sx, sy, tx, ty, { sMin: 12 * k, sMax: 30 * k, jit: 1.4, maxSteps: 200, yMin: sy - 10 });
      if (!main.reached || main.pts.length < 5) continue;
      var len = plen(main.pts); if (len < (wide ? P.minLen : P.minLenM)) continue;
      var br = branchesFor(rnd, main.pts, k, 2 + Math.floor(rnd() * 2)); if (br.length < 2) continue;
      best = { pts: main.pts, branches: br, sx: sx, sy: sy, len: len, src: (wide ? 'band-' : 'edge-') + (left ? 'left' : 'right') + (steep ? '-steep' : '') };
      var bw = Math.abs(tx - sx); if (bw >= 80) break; best = null;   // вузьку «смужку» біля краю не показуємо
    }
    return best ? finishBolt(rnd, best, true) : null;
  }
  var SRC = ['top', 'left', 'right'];
  function makeBolt(rnd, pref){
    if (narrow) return makeDiag(rnd);
    // десктоп: джерела по черзі; ліве/праве поле – спершу діагоналлю всередину через проміжок між секціями
    if (pref === 'left' || pref === 'right'){ var d = makeDiag(rnd, true, pref); if (d) return d; }
    var k = 1, minLen = P.minLen, best = null;
    for (var tries = 0; tries < 120; tries++){
      // десктоп: джерело – бічна хмара в полі (ліва/права) або «стеля» під шапкою; спершу пробуємо задане (по черзі)
      var src = tries < 70 && pref ? pref : SRC[Math.floor(rnd() * 3)], fromSide = src !== 'top', sx, sy;
      if (fromSide){ var lo = 20, hi = Math.max(lo + 4, side - 16); sx = src === 'left' ? lo + rnd() * (hi - lo) : W - lo - rnd() * (hi - lo); sy = HH + 14 + rnd() * (H - HH) * .4; }
      else { sx = side + rnd() * (W - 2 * side); sy = HH + 10 + rnd() * 40; }
      if (blocked(sx, sy) || cloudAt(sx, sy) < .12) continue;
      var tgt = null;
      for (var c = 0; c < 140; c++){
        var inward = fromSide && (c % 10) < 7;   // з бічної хмари – переважно діагоналлю у вільну зону блоку
        var spread = inward ? 560 : fromSide ? 70 : 380, drop = 110;
        var tx = sx + (rnd() - .5) * 2 * spread, ty = sy + drop + rnd() * (H - 30 - sy - drop);
        if (inward && (src === 'left' ? tx < sx + 40 : tx > sx - 40)) continue;
        if (Math.abs(tx - sx) > (ty - sy) * (inward ? 1.7 : 1.3) || blocked(tx, ty) || !segFree(sx, sy, tx, ty)) continue;
        var sc = Math.hypot(tx - sx, ty - sy) + Math.abs(tx - sx) * .3 + rnd() * 60;
        if (!tgt || sc > tgt.s) tgt = { x: tx, y: ty, s: sc };
      }
      if (!tgt || Math.hypot(tgt.x - sx, tgt.y - sy) < minLen * .9) continue;
      var main = walk(rnd, sx, sy, tgt.x, tgt.y, { sMin: 10, sMax: 32, jit: 1.5, maxSteps: 300, yMin: sy - 8 });
      if (!main.reached || main.pts.length < 4) continue;
      var br = branchesFor(rnd, main.pts, k, 2 + Math.floor(rnd() * 2)), len = plen(main.pts);
      var cand = { pts: main.pts, branches: br, sx: sx, sy: sy, len: len, src: src };
      if (len < minLen || br.length < 2){ if (!best || len > best.len) best = cand; continue; }
      best = cand; break;
    }
    if (!best || best.len < minLen * .8) return null;
    return finishBolt(rnd, best, false);
  }
  // ---- Рендер удару (раз на удар) ----
  var boltC = document.createElement('canvas'), glowC = document.createElement('canvas'), litC = document.createElement('canvas'), GS = .25;
  function line(c, pts, w, col, blur, glow, gs){ c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.lineWidth = w; c.strokeStyle = col; c.shadowBlur = blur ? blur * DPR * gs : 0; c.shadowColor = glow || 'transparent'; c.stroke(); }
  function render(b){
    var k = mobile ? .8 : 1;
    boltC.width = fx.width; boltC.height = fx.height; glowC.width = Math.ceil(fx.width * GS); glowC.height = Math.ceil(fx.height * GS);
    var c = boltC.getContext('2d'), gc = glowC.getContext('2d');
    c.setTransform(DPR, 0, 0, DPR, 0, 0); gc.setTransform(DPR * GS, 0, 0, DPR * GS, 0, 0);
    [c, gc].forEach(function(x){ x.lineJoin = 'round'; x.lineCap = 'round'; x.globalCompositeOperation = 'lighter'; });
    line(gc, b.main, 18 * k, 'rgba(124,136,255,.07)', 44 * k, 'rgba(124,136,255,.8)', GS);
    line(gc, b.main, 7 * k, 'rgba(124,136,255,.22)', 22 * k, 'rgba(169,139,255,1)', GS);
    line(gc, b.main, 3.5 * k, 'rgba(200,206,255,.6)', 8 * k, 'rgba(154,163,255,1)', GS);
    b.branches.forEach(function(br){ var n = 3, L = br.pts.length;
      for (var s = 0; s < n; s++){ var seg = br.pts.slice(Math.floor(s * (L - 1) / n), Math.floor((s + 1) * (L - 1) / n) + 1); if (seg.length < 2) continue; var f = 1 - s / n * .75;
        line(gc, seg, 7 * br.w * k, 'rgba(124,136,255,' + (.14 * f) + ')', 18 * k, 'rgba(169,139,255,.8)', GS);
        line(c, seg, 2.6 * br.w * k, 'rgba(190,197,255,' + (.35 * f) + ')', 0, 0, 1);
        line(c, seg, Math.max(.6, 1.7 * br.w * k * f), 'rgba(255,255,255,' + (.9 * f) + ')', 0, 0, 1); } });
    line(c, b.main, 4 * k, 'rgba(170,178,255,.28)', 0, 0, 1); line(c, b.main, 2.6 * k, 'rgba(214,219,255,.55)', 0, 0, 1); line(c, b.main, 1.8 * k, '#FFFFFF', 0, 0, 1);
    gc.shadowBlur = 0;
    // канал виходить із хмари (верх проявляється) і гасне в повітрі (низ), без тупого обриву
    [c, gc].forEach(function(x){ x.globalCompositeOperation = 'destination-in';
      if (b.diag){ // діагональ з краю: проявляється з хмари біля старту і гасне біля кінця – по радіусу, а не по вертикалі
        var r1 = x.createRadialGradient(b.sx, b.sy, 0, b.sx, b.sy, 70); r1.addColorStop(0, 'rgba(0,0,0,0)'); r1.addColorStop(1, 'rgba(0,0,0,1)'); x.fillStyle = r1; x.fillRect(0, 0, W, H);
        var r2 = x.createRadialGradient(b.ex, b.ey, 0, b.ex, b.ey, 46); r2.addColorStop(0, 'rgba(0,0,0,0)'); r2.addColorStop(1, 'rgba(0,0,0,1)'); x.fillStyle = r2; x.fillRect(0, 0, W, H);
        x.globalCompositeOperation = 'source-over'; return; }
      var g = x.createLinearGradient(0, b.sy, 0, b.sy + 60); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      var e = mobile ? 40 : 60, g2 = x.createLinearGradient(0, b.yEnd - e, 0, b.yEnd + 2); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g2; x.fillRect(0, 0, W, H);
      x.globalCompositeOperation = 'source-over'; });
    // спалах: підсвічена хмара біля старту + слабке сяйво вздовж каналу; під текстом і блоками – «дірки»
    litC.width = cw; litC.height = ch; var l = litC.getContext('2d');
    l.drawImage(cloudLit, 0, 0); l.globalCompositeOperation = 'destination-in';
    var r = (narrow ? 190 : 300) / S, cx = b.sx / S, cy = (b.sy + 20) / S, rg = l.createRadialGradient(cx, cy, 0, cx, cy, r);
    rg.addColorStop(0, 'rgba(0,0,0,1)'); rg.addColorStop(.5, 'rgba(0,0,0,.5)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); l.fillStyle = rg; l.fillRect(0, 0, cw, ch);
    l.globalCompositeOperation = 'lighter';
    for (var i = 0; i < b.main.length; i += 6){ var p = b.main[i], gg = l.createRadialGradient(p[0] / S, p[1] / S, 0, p[0] / S, p[1] / S, 60 / S);
      gg.addColorStop(0, 'rgba(124,136,255,.07)'); gg.addColorStop(1, 'rgba(124,136,255,0)'); l.fillStyle = gg; l.fillRect(0, 0, cw, ch); }
    l.globalCompositeOperation = 'destination-out'; l.shadowColor = '#000'; l.shadowBlur = 20 / S;
    rects.forEach(function(t){ l.shadowOffsetX = cw * 2; l.fillStyle = '#000'; l.fillRect(t.l / S - 4 - cw * 2, t.t / S - 3, (t.r - t.l) / S + 8, (t.b - t.t) / S + 6); });
    l.shadowBlur = 0; l.shadowOffsetX = 0;
    var gh = l.createLinearGradient(0, 0, 0, (HH + 30) / S); gh.addColorStop(0, '#000'); gh.addColorStop(.6, '#000'); gh.addColorStop(1, 'rgba(0,0,0,0)'); l.fillStyle = gh; l.fillRect(0, 0, cw, (HH + 30) / S);
    l.globalCompositeOperation = 'source-over';
  }
  // Малюємо лише прямокутник навколо удару (канал + ореол + спалах біля старту), а не весь екран
  function bbox(b){ var x0 = b.sx, x1 = b.sx, y0 = b.sy, y1 = b.yEnd, R = narrow ? 190 : 300;
    b.main.concat.apply(b.main, b.branches.map(function(r){ return r.pts; })).forEach(function(p){ x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); });
    x0 = Math.max(0, Math.min(x0 - 70, b.sx - R)); x1 = Math.min(W, Math.max(x1 + 70, b.sx + R)); y0 = Math.max(0, Math.min(y0 - 70, b.sy - R)); y1 = Math.min(H, y1 + 90);
    return { x: Math.floor(x0 / 4) * 4, y: Math.floor(y0 / 4) * 4, w: Math.ceil((x1 - x0) / 4) * 4 + 4, h: Math.ceil((y1 - y0) / 4) * 4 + 4 }; }
  var prevBox = null;
  function frame(bolt, sky, reveal, b, dy){
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    if (prevBox) fctx.clearRect(prevBox.x - 2, prevBox.y - 2, prevBox.w + 4, prevBox.h + 4); else fctx.clearRect(0, 0, fx.width, fx.height);
    prevBox = null; if (!b) return;
    var oy = Math.round((dy || 0) * DPR), bb = b.box || (b.box = bbox(b));
    var dx0 = bb.x * DPR, dy0 = bb.y * DPR, dw = bb.w * DPR, dh = bb.h * DPR;
    prevBox = { x: dx0, y: dy0 + oy, w: dw, h: dh };
    function part(src, k){ fctx.drawImage(src, bb.x * k, bb.y * k, bb.w * k, bb.h * k, dx0, dy0 + oy, dw, dh); }
    if (sky > .003){ fctx.globalAlpha = Math.min(1, sky); part(litC, 1 / S); }
    if (bolt > .003){ fctx.save(); fctx.globalAlpha = Math.min(1, bolt);
      if (reveal < 1){ fctx.beginPath(); fctx.rect(0, 0, fx.width, (b.sy + (b.yEnd - b.sy) * reveal) * DPR + oy); fctx.clip(); }
      fctx.globalCompositeOperation = 'lighter'; part(glowC, DPR * GS); part(boltC, DPR); fctx.restore(); }
    fctx.globalAlpha = 1;
  }

  // ---- Таймлайн (як у героя: лідер → 2–3 спалахи → догоряння; ≤3 спалахи за секунду) ----
  function plan(rnd){ var lead = P.leaderMin + rnd() * (P.leaderMax - P.leaderMin), n = rnd() < .5 ? 2 : 3, pulses = [{ at: lead, peak: 1 }], at = lead;
    for (var i = 1; i < n; i++){ at += P.pulseGapMin + rnd() * (P.pulseGapMax - P.pulseGapMin); pulses.push({ at: at, peak: .85 - i * .17 + rnd() * .1 }); }
    return { lead: lead, pulses: pulses, last: at, end: at + P.tail }; }
  function levels(t, pl){ if (t < pl.lead) return { bolt: .35 + .25 * t / pl.lead, sky: .05 * t / pl.lead, reveal: t / pl.lead };
    var env = 0; pl.pulses.forEach(function(p){ if (t >= p.at) env = Math.max(env, p.peak * Math.exp(-(t - p.at) / P.tau)); });
    var resid = t <= pl.last ? .3 : .3 * Math.exp(-(t - pl.last) / (P.tail / 3.2)); return { bolt: Math.min(1, env + resid), sky: env * P.glowMax, reveal: 1 }; }

  var srcI = (Math.random() * 3) | 0, rnd = mulberry((Math.random() * 1e9) | 0), timer = 0, raf = 0, cur = null, lastScroll = 0, built = false, lastLv = null;
  function heroDominant(){ var r = hero.getBoundingClientRect(); return r.bottom > H * P.heroShare; }
  function running(){ return built && MODE === 'live' && !reduceMQ.matches && !document.hidden; }
  function gap(){ return narrow ? P.gapMinM + rnd() * (P.gapMaxM - P.gapMinM) : P.gapMin + rnd() * (P.gapMax - P.gapMin); }
  function schedule(ms){ clearTimeout(timer); timer = running() ? setTimeout(fire, ms) : 0; }
  function stop(){ clearTimeout(timer); timer = 0; if (raf) cancelAnimationFrame(raf); raf = 0; if (cur) StormBus.release('page'); cur = null; frame(0, 0, 1, null); }
  function fire(){
    timer = 0; if (!running()) return;
    var why = window.__stormWhy; // лише для перевірок: причини, чому удару не було
    if (heroDominant()){ if (why) why.hero = (why.hero || 0) + 1; return schedule(1500); }                 // перший екран – його сцена
    if (performance.now() - lastScroll < P.idle){ if (why) why.scroll = (why.scroll || 0) + 1; return schedule(500); } // гортають – почекати
    if (!StormBus.claim('page')){ if (why) why.bus = (why.bus || 0) + 1; return schedule(1200); }
    measure(); var b = makeBolt(rnd, SRC[srcI % 3]);
    if (why && !b){ var bd = freeBands(); why[bd.length ? 'noShape' : 'noBand'] = (why[bd.length ? 'noShape' : 'noBand'] || 0) + 1; }
    // немає вільного місця (на вузьких – проміжку між секціями) – спробувати згодом
    if (!b){ StormBus.release('page'); StormBus.quietUntil = 0; StormBus.log.pop(); return schedule(narrow ? 1000 : 1500); }
    srcI++;   // джерела по черзі: стеля → ліве поле → праве поле
    render(b); window.__pageBolt = b;
    var lg = StormBus.log[StormBus.log.length - 1]; if (lg && lg.who === 'page'){ lg.src = b.src; lg.len = Math.round(b.len); lg.ang = b.ang; lg.y = Math.round(scrollPos()); }
    cur = { b: b, pl: plan(rnd), y0: scrollPos(), t0: 0 }; b.y0 = cur.y0;
    raf = requestAnimationFrame(function(n){ cur.t0 = n; tick(n); });
  }
  // Кадр удару зі зсувом на реальну прокрутку: викликається з rAF і з події прокрутки Lenis
  // (Lenis змінює положення сторінки у своєму rAF – без цього удар відставав би на кадр)
  function draw(){
    if (!cur || !lastLv) return;
    var dy = cur.y0 - scrollPos();
    frame(lastLv.bolt, lastLv.sky, lastLv.reveal, cur.b, dy);
    if (window.__stormDebug) window.__stormDebug.push([Math.round(scrollPos() * 10) / 10, Math.round(scrollY * 10) / 10]); // перевірка: зсув = реальна прокрутка
    return dy;
  }
  function tick(n){
    var t = n - cur.t0; lastLv = levels(t, cur.pl);
    var dy = draw();
    if (Math.abs(dy) > H * .6) t = cur.pl.end;   // відгортали далеко – удар гасне
    if (t < cur.pl.end) raf = requestAnimationFrame(tick);
    else { raf = 0; frame(0, 0, 1, null); cur = null; lastLv = null; StormBus.release('page'); schedule(gap()); }
  }

  // ---- ?strike: застиглий удар у видимому екрані (перераховується після прокрутки) ----
  var st = 0;
  function renderStatic(){
    frame(0, 0, 1, null); window.__pageBolt = null;
    if (MODE !== 'strike' || heroDominant()) return;
    measure(); var b = null, y = scrollPos();
    var base = SEED + Math.round(y / 100) * 13; // детерміновано, але різна форма на різних екранах
    for (var s = 0; !b && s < 12; s++) b = makeBolt(mulberry(base + s * 7), SRC[(Math.round(y / 100) + s) % 3]);
    if (!b) return; render(b); window.__pageBolt = b; frame(1, .85 * P.glowMax, 1, b, 0);
  }

  // Вихід з першого екрана: перший удар фону – через 2,5 с (вузькі екрани – 3–4 с), а не за загальним розкладом
  var wasHero = true;
  function onScroll(){
    lastScroll = performance.now();
    if (cur) draw();
    if (MODE === 'strike'){ clearTimeout(st); st = setTimeout(renderStatic, 200); return; }
    if (!built) return;
    var hd = heroDominant();
    if (wasHero && !hd && !cur) schedule(narrow ? P.firstNarrow + rnd() * 1000 : P.first);
    wasHero = hd;
  }

  function start(){
    build(); built = true; wasHero = heroDominant();
    if (MODE === 'strike') renderStatic(); else if (MODE === 'live') schedule(P.first);
  }
  addEventListener('scroll', onScroll, { passive: true });
  var rt, lastW = innerWidth, lastH = innerHeight;
  addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){
    // мобільний браузер змінює висоту, коли ховає адресний рядок: хмари перебудовуємо лише при помітній зміні
    if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 140) return;
    lastW = innerWidth; lastH = innerHeight; stop(); start(); }, 200); });
  document.addEventListener('visibilitychange', function(){ if (document.hidden) stop(); else schedule(P.first); });
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', function(){ stop(); if (!reduceMQ.matches) schedule(P.first); });
  // старт – після load і шрифтів (від них залежать рядки тексту), не пізніше 2,5 с
  var started = false; function go(){ if (!started){ started = true; start(); } }
  if (document.readyState === 'complete') document.fonts.ready.then(go); else addEventListener('load', function(){ document.fonts.ready.then(go); });
  setTimeout(go, 2500);
  window.__pageStorm = { P: P, measure: function(){ measure(); return rects; }, blocked: function(x, y){ return blocked(x, y); }, narrow: function(){ return narrow; }, bands: function(){ measure(); return freeBands(); } };

  return {
    // Lenis гортає сторінку у своєму rAF: зсув удару і «тишу» беремо з його події прокрутки
    setLenis(l) { lenis = l; if (l) l.on('scroll', onScroll); },
  };
}
