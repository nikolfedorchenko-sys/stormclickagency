// Сцена шторму першого екрана: процедурні хмари + блискавка на canvas, без бібліотек.
// Перенесено з design/mockup.html (див. design/design-brief.md, «Сцена шторму»).
// ?strike – застиглий кадр удару (фіксований seed), ?strike=N – інший варіант (на 360: N mod 3 = A/B/C),
// ?calm – хмари між ударами. prefers-reduced-motion – один статичний кадр блискавки.
//
// Заборонені зони рахуються з розмітки (селектори – SEL нижче). Перераховуються при довантаженні
// шрифтів, ресайзі та зміні мови (relayout()), хмари будуються один раз (і заново – лише якщо
// змінився розмір героя).

const SEL = {
  header: '.header',
  headerItems: '.header-inner > *',   // елементи шапки
  announce: '.hero-announce',         // плашка-анонс (від її правого краю залежать типи A/B/C на 360)
  title: '.hero-title',
  lead: '.hero-lead',
  actions: '.hero-actions > *',       // кнопка і посилання на асистента
  proof: '.proof',                    // табло цін (непрозоре, «горизонт» на десктопі)
};

export function initStorm(hero) {
  const box = hero && hero.querySelector('.storm');
  if (!box) return { relayout() {} };
  const params = new URLSearchParams(location.search);
  const MODE = params.has('strike') ? 'strike' : (params.has('calm') ? 'calm' : 'live');
  const SEED = 20261117 + (parseInt(params.get('strike'), 10) || 0);
  const reduceMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  const sky = box.querySelector('.storm-sky'), fx = box.querySelector('.storm-fx');
  const sctx = sky.getContext('2d'), fctx = fx.getContext('2d');

  // ---- Параметри (ті самі – у design-brief.md) ----
  var P = {
    firstDelay: 1200,          // перший удар після завантаження, мс
    gapMin: 3000, gapMax: 6000, // пауза між ударами, мс
    leaderMin: 60, leaderMax: 110,   // «лідер» – розряд проростає згори
    pulseGapMin: 170, pulseGapMax: 260, // між спалахами одного удару
    tau: 65,                   // згасання спалаху, мс
    tail: 650,                 // догоряння після останнього спалаху, мс
    skyMax: .62,               // максимум підсвітки хмар (не сліпить)
    minLenNarrow: 180,         // мінімальна видима довжина каналу на <768 px
    minLenWide: 300,           // і на ширших
    endFade: 55                // на 768 нижні 55 px каналу гаснуть (на <768 – 40 px) – «йде за кадр»
  };

  // ---- Детермінований генератор ----
  function mulberry(a){ return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  // ---- Value noise для хмар ----
  function hash(ix, iy){ var h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function vnoise(x, y){
    var ix = Math.floor(x), iy = Math.floor(y), fx_ = x - ix, fy = y - iy;
    var u = fx_ * fx_ * (3 - 2 * fx_), v = fy * fy * (3 - 2 * fy);
    var a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y){
    var s = 0, amp = .5, f = 1;
    for (var o = 0; o < 4; o++){ s += amp * vnoise(x * f + o * 17.3, y * f - o * 9.1); f *= 2.03; amp *= .5;
      var t = x; x = x * .8 - y * .6; y = t * .6 + y * .8; }
    return s / .94;
  }
  function sstep(a, b, x){ x = (x - a) / (b - a); x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }

  // ---- Розмітка: де бити не можна ----
  var W, H, DPR, L; // L – геометрія поточного макета
  function rel(r, hr){ return { l: r.left - hr.left, t: r.top - hr.top, r: r.right - hr.left, b: r.bottom - hr.top }; }
  function visibleBox(el){ var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? r : null; }
  function textLines(el, out, hr){
    var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), n, rg = document.createRange();
    while ((n = tw.nextNode())){ if (!n.nodeValue.trim()) continue; rg.selectNodeContents(n);
      var rs = rg.getClientRects(); for (var i = 0; i < rs.length; i++) if (rs[i].width > 0) out.push(rel(rs[i], hr)); }
  }
  function measure(){
    var hr = hero.getBoundingClientRect();
    W = Math.round(hr.width); H = Math.round(hr.height);
    var mobile = W < 768;
    DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    var m = mobile ? 14 : 24;               // відступ ядра блискавки від тексту
    var blocks = [], text = [];
    // Шапка фіксована і лежить над героєм, який починається з верху сторінки: її елементи рахуємо
    // від верху шапки – так зони правильні, навіть якщо сторінку відкрито не з самого верху.
    var headEl = document.querySelector(SEL.header), headR = headEl.getBoundingClientRect();
    var headOrigin = { left: hr.left, top: headR.top };
    var headItems = [];
    document.querySelectorAll(SEL.headerItems).forEach(function(el){ var r = visibleBox(el); if (r) { var q = rel(r, headOrigin); headItems.push(q); blocks.push(q); } });
    document.querySelectorAll(SEL.actions).forEach(function(el){ var r = visibleBox(el); if (r) blocks.push(rel(r, hr)); });
    textLines(hero.querySelector(SEL.title), text, hr);
    textLines(hero.querySelector(SEL.lead), text, hr);
    var all = blocks.concat(text);
    var annEl = hero.querySelector(SEL.announce);
    var ex = all.map(function(r){ return { l: r.l - m, t: r.t - m, r: r.r + m, b: r.b + m }; });
    // плашка-анонс – окремий прямокутник (від її правого краю залежить шлях каналу на 360)
    var annR = rel(annEl.getBoundingClientRect(), hr), mA = m;
    ex.push({ l: annR.l - mA, t: annR.t - mA, r: annR.r + mA, b: annR.b + mA });
    var header = headR.height;
    var proofTop = hero.querySelector(SEL.proof).getBoundingClientRect().top - hr.top;
    var textRight = 0, textTop = H;
    blocks.concat(text).forEach(function(r){ if (r.t > header) { textRight = Math.max(textRight, r.r); textTop = Math.min(textTop, r.t); } });
    // Режим: «збоку» (є широка вільна смуга праворуч) або «згори» (вузькі екрани)
    var side = (W - textRight) >= 300;
    // праве поле контенту: на 1920 удар не йде в порожнє поле біля краю
    var contentRight = 0; headItems.forEach(function(r){ contentRight = Math.max(contentRight, r.r); });
    var ann = annR; all.push(annR);
    var A = side ? { x: (textRight + W) / 2 + 40, y: header, rx: (W - textRight) * .95 + 80, ry: H * .62 }
                 : { x: W * .78, y: header + 30, rx: W * .75, ry: Math.max(220, textTop - header + 170) };
    // Нижня межа удару: збоку – за табло (воно непрозоре), згори – над лідом
    var leadTop = hero.querySelector(SEL.lead).getBoundingClientRect().top - hr.top;
    var bottom = side ? proofTop + 36 : leadTop - m - 6;
    L = { mobile: mobile, m: m, ex: ex, text: all, header: header, proofTop: proofTop, bottom: bottom, textRight: textRight, side: side, A: A,
          contentRight: contentRight, annBottom: ann.b + mA, annRight: ann.r + mA };
  }
  function blocked(x, y){
    var ex = L.ex; for (var i = 0; i < ex.length; i++){ var r = ex[i]; if (x > r.l && x < r.r && y > r.t && y < r.b) return true; }
    return false;
  }
  function segFree(x1, y1, x2, y2){
    var d = Math.hypot(x2 - x1, y2 - y1), n = Math.max(1, Math.ceil(d / 5));
    for (var i = 0; i <= n; i++){ var k = i / n; if (blocked(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k)) return false; }
    return true;
  }

  // ---- Хмари: темний шар (завжди) і підсвічений (для спалаху) ----
  var cloudDark, cloudLit, cw, ch;
  function buildClouds(){
    var S = cloudScale(); cw = Math.ceil(W / S); ch = Math.ceil(H / S);
    cloudDark = document.createElement('canvas'); cloudDark.width = cw; cloudDark.height = ch;
    cloudLit = document.createElement('canvas'); cloudLit.width = cw; cloudLit.height = ch;
    var dctx = cloudDark.getContext('2d'), lctx = cloudLit.getContext('2d');
    var di = dctx.createImageData(cw, ch), li = lctx.createImageData(cw, ch), dd = di.data, ld = li.data;
    var A = L.A, sc = L.mobile ? 120 : Math.max(170, Math.min(260, W * .14));
    var dens = L.mobile ? 1.65 : 1, tone = L.mobile ? 1.22 : 1; // на телефоні хмари щільніші й світліші – між ударами екран не чорний
    for (var y = 0; y < ch; y++){
      for (var x = 0; x < cw; x++){
        var px = x * S, py = y * S;
        var dx = (px - A.x) / A.rx, dy = (py - A.y) / A.ry, e = 1 - (dx * dx + dy * dy);
        var mask = sstep(0, .75, e);
        if (mask <= 0) continue;
        var n = fbm(px / sc, py / (sc * .62));
        var d = Math.min(1, sstep(.38, .78, n * .85 + mask * .42) * mask * dens);
        if (d <= .003) continue;
        var n2 = fbm((px - 9) / sc, (py - 14) / (sc * .62));
        var sh = Math.max(0, Math.min(1, (n - n2) * 6 + .5)); // «верх» хмари світліший
        var i = (y * cw + x) * 4;
        dd[i] = (16 + 20 * sh) * tone; dd[i + 1] = (18 + 22 * sh) * tone; dd[i + 2] = (36 + 38 * sh) * tone; dd[i + 3] = 255 * d * .92;
        ld[i] = 150 + 80 * sh; ld[i + 1] = 158 + 74 * sh; ld[i + 2] = 255; ld[i + 3] = 255 * Math.min(1, d * (.45 + .75 * sh));
      }
    }
    dctx.putImageData(di, 0, 0); lctx.putImageData(li, 0, 0);
  }
  function cloudScale(){ return W >= 1200 ? 4 : 3; } // хмари рахуються в 1/3–1/4 роздільності
  function drawSky(){
    sky.width = Math.round(W * DPR); sky.height = Math.round(H * DPR);
    sctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var A = L.A, g = sctx.createRadialGradient(A.x, A.y + A.ry * .25, 0, A.x, A.y + A.ry * .25, Math.max(A.rx, A.ry));
    g.addColorStop(0, 'rgba(124,136,255,.10)'); g.addColorStop(.55, 'rgba(169,139,255,.04)'); g.addColorStop(1, 'rgba(5,6,11,0)');
    sctx.fillStyle = g; sctx.fillRect(0, 0, W, H);
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(cloudDark, 0, 0, W, H);
  }

  // ---- Геометрія удару ----
  function walk(rnd, x, y, tx, ty, opt){
    var pts = [[x, y]], dir = Math.atan2(ty - y, tx - x), steps = 0, hit = false;
    while (steps++ < opt.maxSteps){
      var to = Math.atan2(ty - y, tx - x), dist = Math.hypot(tx - x, ty - y);
      if (opt.endY && y >= opt.endY) break;
      if (dist < opt.sMax) { if (segFree(x, y, tx, ty)) pts.push([tx, ty]); break; }
      var base = Math.atan2(Math.sin(dir) * .2 + Math.sin(to) * .8, Math.cos(dir) * .2 + Math.cos(to) * .8);
      var ok = false;
      for (var k = 0; k < 10; k++){
        var big = rnd() < .18 ? 1.8 : 1;
        var a = base + (rnd() - .5) * opt.jit * big * (1 + k * .15);
        // останні кроки перед табло – не далі ±30° від вертикалі (без гачка вбік)
        if (opt.endY && y > opt.endY - opt.sMax * 3) a = Math.max(Math.PI / 2 - .52, Math.min(Math.PI / 2 + .52, a));
        // гілки завжди йдуть униз (не далі ±75° від вертикалі) – без горизонтальних «уламків»
        if (opt.down) { var aa = Math.atan2(Math.sin(a), Math.cos(a)); if (aa < .26 || aa > Math.PI - .26) a = aa < -Math.PI / 2 || aa > Math.PI - .26 ? Math.PI - .26 : .26; }
        var len = opt.sMin + rnd() * (opt.sMax - opt.sMin);
        var nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len;
        if (ny < opt.yMin || ny > opt.yMax || nx > (opt.xMax || W + 60)) continue;
        if (segFree(x, y, nx, ny)) { x = nx; y = ny; dir = a; ok = true; break; }
      }
      if (!ok) { hit = true; break; }
      pts.push([x, y]);
      if (opt.budget && pathLen(pts) > opt.budget) break;
    }
    return { pts: pts, hit: hit, reached: Math.hypot(tx - x, ty - y) < opt.sMax * 1.5 || (opt.endY && y >= opt.endY) };
  }
  function pathLen(p){ var s = 0; for (var i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; }

  // дрібна ламаність: зміщення середини кожного відрізка (2 рівні), якщо це не заходить у заборонену зону
  function detail(rnd, pts, amp){
    for (var lvl = 0; lvl < 2; lvl++){
      var out = [pts[0]];
      for (var i = 1; i < pts.length; i++){
        var a = pts[i - 1], b = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
        if (len > 6){
          var o = (rnd() - .5) * 2 * amp * len, mx = (a[0] + b[0]) / 2 - dy / len * o, my = (a[1] + b[1]) / 2 + dx / len * o;
          if (!blocked(mx, my)) out.push([mx, my]);
        }
        out.push(b);
      }
      pts = out;
    }
    return pts;
  }

  function finish(rnd, pts, branches, sx, sy, best){
    pts = detail(rnd, pts, .2);
    branches.forEach(function(br){ br.pts = detail(rnd, br.pts, .14); });
    var yEnd = 0, mainEnd = 0; pts.forEach(function(p){ mainEnd = Math.max(mainEnd, p[1]); });
    yEnd = mainEnd; branches.forEach(function(b){ b.pts.forEach(function(p){ yEnd = Math.max(yEnd, p[1]); }); });
    return { main: pts, branches: branches, sx: sx, sy: sy, ex: best.x, ey: best.y, yEnd: yEnd, mainEnd: mainEnd };
  }

  // Типи траєкторії на вузьких екранах, де плашка-анонс перекриває шлях униз (360 px):
  // A – проміжок біля плашки, далі діагональ униз-ліворуч; B – прямо вниз біля краю до рівня ліду, гілки ліворуч;
  // C – з основи хмари під плашкою, лівіше, діагональ униз-праворуч.
  var TYPES = ['A', 'B', 'C'];
  function makeBolt(rnd, type){
    type = type || 'A';
    var k = L.mobile ? .62 : 1;
    var y0 = L.header + 10, bottom = L.bottom;  // старт – у затемненні під шапкою, нижче зони її кнопок
    var xl = L.side ? Math.max(L.textRight + L.m, W * .5) : W * .5;
    var xr = L.side ? Math.min(W - 70, L.contentRight + 80) : W - 24; // не в порожнє поле і не за край
    var minLen = L.mobile || !L.side ? P.minLenNarrow : P.minLenWide;
    var fallback = null;
    for (var tries = 0; tries < 60; tries++){
      // старт завжди в кадрі. Згори – з-під шапки; якщо там не пройти повз плашку-анонс (360 px),
      // канал виходить з основи хмари одразу під плашкою.
      var sx, sy = y0, wp = null, narrow = false;
      if (L.side) sx = xl + (xr - xl) * (.2 + .7 * rnd());
      else {
        // згори: старт у кадрі (x від 55% ширини до W−24); якщо плашка-анонс перекриває шлях униз –
        // канал іде через проміжок праворуч від неї (точка wp) і далі ламається в кишеню біля заголовка
        var narrow = L.annRight > W * .55;
        if (narrow && type === 'C') { sx = W * .58 + rnd() * W * .22; sy = L.annBottom + 4; }
        else if (narrow) { var sl = L.annRight + 2; sx = sl + rnd() * Math.max(0, W - 18 - sl);
          wp = [Math.min(W - 16, L.annRight + 3 + rnd() * 6), L.annBottom + 4]; }
        else { sx = W * .55 + rnd() * (W * .45 - 24); }
      }
      if (blocked(sx, sy)) continue;
      var ox = sx, oy = sy, pre = null;
      if (wp){ if (blocked(wp[0], wp[1])) continue;
        pre = walk(rnd, sx, sy, wp[0], wp[1], { sMin: 8 * k, sMax: 22 * k, jit: 1.1, maxSteps: 80, yMin: sy - 8, yMax: bottom, xMax: W - 12 });
        if (!pre.reached) continue; sx = wp[0]; sy = wp[1]; }
      // ціль: найдовша вільна пряма вниз
      var best = null;
      for (var c = 0; c < 160; c++){
        var tx = xl + rnd() * (xr - xl), ty = sy + 90 * k + rnd() * (bottom - sy - 90 * k);
        if (narrow && type === 'B') { tx = W - 48 + rnd() * 28; ty = bottom - 40 + rnd() * 40; }
        if (blocked(tx, ty) || !segFree(sx, sy, tx, ty)) continue;
        if (narrow && type === 'A' && tx > sx - 40) continue;   // A – униз-ліворуч
        if (narrow && type === 'C' && tx < sx + 50) continue;   // C – униз-праворуч
        // збоку – найглибший удар; згори – найдовша вільна діагональ
        var score = L.side ? (ty - sy) + rnd() * 140 * k - Math.abs(tx - sx) * .15
                  : narrow && type === 'B' ? ty + rnd() * 10
                  : Math.hypot(tx - sx, ty - sy) + rnd() * 40;
        if (!best || score > best.s) best = { x: tx, y: ty, s: score };
      }
      if (!best || (L.side ? best.y - sy : Math.hypot(best.x - sx, best.y - sy)) < 110 * k) continue;
      var opt = { sMin: 10 * k, sMax: 34 * k, jit: 1.5, maxSteps: 400, yMin: sy - 8, yMax: bottom,
                  endY: L.side && best.y > L.proofTop - 60 ? L.proofTop + 14 : 0 };
      opt.xMax = L.side ? W + 60 : W - 12;
      var main = walk(rnd, sx, sy, best.x, best.y, opt);
      if (!main.reached) continue;
      if (pre) { main.pts = pre.pts.concat(main.pts.slice(1)); sx = ox; sy = oy; }
      var branches = [];
      var pts = main.pts, total = pts.length;
      if (total < 4) continue;
      var want = 2 + Math.floor(rnd() * 3);    // 2–4 гілки від головного каналу
      for (var i = 2, guard = 0; i < total * .85 && guard < 400; i = (i + 1 >= total * .85 && branches.length < want) ? 2 : i + 1, guard++){
        if (branches.length >= want + 2 || rnd() > want / (total * .8)) continue;
        var p = pts[i], q2 = pts[i - 1], md = Math.atan2(p[1] - q2[1], p[0] - q2[0]);
        if (pre && p[1] < L.annBottom) continue;   // з проміжку біля плашки гілок не пускаємо
        var side = narrow && type === 'B' ? (rnd() < .85 ? 1 : -1) : (rnd() < .5 ? -1 : 1), a = md + side * (.55 + rnd() * .65);
        var remain = pathLen(pts.slice(i)), blen = remain * (.18 + rnd() * .32) + 30 * k;
        var b = walk(rnd, p[0], p[1], p[0] + Math.cos(a) * blen * 1.4, p[1] + Math.sin(a) * blen * 1.4,
          { sMin: 8 * k, sMax: 24 * k, jit: 1.5, maxSteps: 120, yMin: y0 - 8, yMax: bottom, budget: blen, xMax: opt.xMax, down: true });
        if (b.pts.length > 2) {
          branches.push({ pts: b.pts, w: .55 + rnd() * .2, depth: 1 });
          if (rnd() < .45 && b.pts.length > 5){
            var j = 2 + Math.floor(rnd() * (b.pts.length - 4)), bp = b.pts[j], a2 = a - side * (.4 + rnd() * .5), l2 = blen * (.3 + rnd() * .3);
            var c2 = walk(rnd, bp[0], bp[1], bp[0] + Math.cos(a2) * l2 * 1.4, bp[1] + Math.sin(a2) * l2 * 1.4,
              { sMin: 6 * k, sMax: 16 * k, jit: 1.5, maxSteps: 60, yMin: y0 - 8, yMax: bottom, budget: l2, xMax: opt.xMax, down: true });
            if (c2.pts.length > 2) branches.push({ pts: c2.pts, w: .35, depth: 2 });
          }
        }
      }
      var mainLen = pathLen(pts);
      var res = finish(rnd, pts, branches, sx, sy, best);
      if (mainLen >= minLen && branches.length >= 2) return res;   // видимий канал і щонайменше 2 гілки
      var sc = mainLen + branches.length * 60;
      if (!fallback || sc > fallback.sc) { fallback = res; fallback.sc = sc; }
    }
    return fallback;
  }

  // ---- Рендер удару в офскрін-канви (один раз на удар) ----
  var boltC = document.createElement('canvas'), litC = document.createElement('canvas');
  // Світіння малюється в canvas у 1/4 роздільності (розмиття там у ~16 разів дешевше) і масштабується
  // при виводі; у повній роздільності – лише тонкі лінії без тіней.
  var GS = .25, glowC = document.createElement('canvas');
  function stroke(ctx, pts, width, color, blur, glow){
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.lineWidth = width; ctx.strokeStyle = color; ctx.shadowBlur = blur ? blur * DPR * ctx.__gs : 0; ctx.shadowColor = glow || 'transparent'; ctx.stroke();
  }
  function taper(gc, c, pts, w, a, k){ // гілки тоншають і гаснуть до кінця
    var n = 3, len = pts.length;
    for (var s = 0; s < n; s++){
      var seg = pts.slice(Math.floor(s * (len - 1) / n), Math.floor((s + 1) * (len - 1) / n) + 1);
      if (seg.length < 2) continue;
      var f = 1 - s / n * .75;
      stroke(gc, seg, 7 * w * k, 'rgba(124,136,255,' + (.14 * a * f) + ')', 18 * k, 'rgba(169,139,255,.8)');
      stroke(c, seg, 2.6 * w * k, 'rgba(190,197,255,' + (.35 * a * f) + ')', 0);
      stroke(c, seg, Math.max(.6, 1.7 * w * k * f), 'rgba(255,255,255,' + (.9 * a * f) + ')', 0);
    }
  }
  function fades(c, b){
    // верх каналу виходить з хмари, а не обрізаний
    c.globalCompositeOperation = 'destination-in';
    var g = c.createLinearGradient(0, b.sy, 0, b.sy + (b.sy > L.header + 20 ? 22 : 70));
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // знизу (360/768, де нема табло, за яке сховатись) – плавно гасне, а не обривається
    if (!L.side){
      var fe = L.mobile ? 40 : P.endFade;
      var gb = c.createLinearGradient(0, b.mainEnd - fe, 0, b.mainEnd + 2);
      gb.addColorStop(0, 'rgba(0,0,0,1)'); gb.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gb; c.fillRect(0, 0, W, H); // destination-in: заливати все полотно, інакше зітре все поза прямокутником
    }
    c.globalCompositeOperation = 'source-over';
  }
  function renderBolt(b){
    var k = L.mobile ? .8 : 1;
    boltC.width = fx.width; boltC.height = fx.height;
    glowC.width = Math.ceil(fx.width * GS); glowC.height = Math.ceil(fx.height * GS);
    var c = boltC.getContext('2d'), gc = glowC.getContext('2d');
    c.__gs = 1; gc.__gs = GS;
    c.setTransform(DPR, 0, 0, DPR, 0, 0); gc.setTransform(DPR * GS, 0, 0, DPR * GS, 0, 0);
    [c, gc].forEach(function(x){ x.lineJoin = 'round'; x.lineCap = 'round'; x.globalCompositeOperation = 'lighter'; });
    // світіння (1/4 роздільності)
    stroke(gc, b.main, 18 * k, 'rgba(124,136,255,.07)', 44 * k, 'rgba(124,136,255,.8)');
    stroke(gc, b.main, 7 * k, 'rgba(124,136,255,.22)', 22 * k, 'rgba(169,139,255,1)');
    stroke(gc, b.main, 3.5 * k, 'rgba(200,206,255,.6)', 8 * k, 'rgba(154,163,255,1)');
    b.branches.forEach(function(br){ taper(gc, c, br.pts, br.w, br.depth === 1 ? .85 : .6, k); });
    // ядро (повна роздільність, без тіней)
    stroke(c, b.main, 4 * k, 'rgba(170,178,255,.28)', 0);
    stroke(c, b.main, 2.6 * k, 'rgba(214,219,255,.55)', 0);
    stroke(c, b.main, 1.8 * k, '#FFFFFF', 0);
    gc.shadowBlur = 0;
    fades(c, b); fades(gc, b);
  }
  function renderLit(b){
    // підсвічені хмари навколо початку удару + сяйво вздовж каналу; текст – «вирізаний»
    var S = cloudScale(); litC.width = cw; litC.height = ch;
    var c = litC.getContext('2d');
    if ('filter' in c) c.filter = 'blur(1.2px)';      // згладити сітку шуму (де підтримується)
    c.drawImage(cloudLit, 0, 0);
    if ('filter' in c) c.filter = 'none';
    c.globalCompositeOperation = 'destination-in';
    var r = (L.mobile ? 170 : 420) / S, cx = b.sx / S, cy = (b.sy + 30) / S;
    var g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(.5, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, cw, ch);
    c.globalCompositeOperation = 'lighter';
    var mx = (b.sx + b.ex) / 2 / S, my = (b.sy + b.ey) / 2 / S, r2 = Math.max(80, (b.ey - b.sy) * .6) / S;
    var g2 = c.createRadialGradient(mx, my, 0, mx, my, r2);
    g2.addColorStop(0, 'rgba(124,136,255,.16)'); g2.addColorStop(1, 'rgba(124,136,255,0)');
    c.fillStyle = g2; c.fillRect(0, 0, cw, ch);
    var g3 = c.createRadialGradient(cx, cy, 0, cx, cy, r * .55);
    g3.addColorStop(0, 'rgba(210,214,255,.45)'); g3.addColorStop(1, 'rgba(154,163,255,0)');
    c.fillStyle = g3; c.fillRect(0, 0, cw, ch);
    // вирізати м'які «дірки» під текстом і кнопками, щоб спалах не знижував контраст
    c.globalCompositeOperation = 'destination-out';
    c.shadowColor = 'rgba(0,0,0,1)'; c.shadowBlur = 26 / S;
    L.text.forEach(function(t){ c.shadowOffsetX = cw * 2; c.fillStyle = '#000';
      c.fillRect(t.l / S - 6 - cw * 2, t.t / S - 4, (t.r - t.l) / S + 12, (t.b - t.t) / S + 8); });
    c.shadowBlur = 0; c.shadowOffsetX = 0;
    // під шапкою спалаху немає: шар плавно гасне від низу шапки до самого верху
    var gh = c.createLinearGradient(0, 0, 0, (L.header + 40) / S);
    gh.addColorStop(0, 'rgba(0,0,0,1)'); gh.addColorStop(.55, 'rgba(0,0,0,1)'); gh.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gh; c.fillRect(0, 0, cw, (L.header + 40) / S);
    c.globalCompositeOperation = 'source-over';
  }

  // ---- Кадр ----
  function frame(bolt, sky, reveal, b){
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.clearRect(0, 0, fx.width, fx.height);
    if (!b) return;
    if (sky > .003){ fctx.globalAlpha = Math.min(1, sky); fctx.imageSmoothingQuality = 'high'; fctx.drawImage(litC, 0, 0, fx.width, fx.height); }
    if (bolt > .003){
      fctx.globalAlpha = Math.min(1, bolt);
      fctx.save();
      if (reveal < 1){ var yk = (b.sy + (b.yEnd - b.sy) * reveal) * DPR; fctx.beginPath(); fctx.rect(0, 0, fx.width, yk); fctx.clip(); }
      fctx.globalCompositeOperation = 'lighter';
      fctx.drawImage(glowC, 0, 0, fx.width, fx.height);
      fctx.drawImage(boltC, 0, 0);
      fctx.restore();
    }
    fctx.globalAlpha = 1;
  }

  // ---- Таймлайн удару ----
  var lastType = null, cur = null, raf = 0, timer = 0, rndLive = mulberry((Math.random() * 1e9) | 0);
  function plan(rnd){
    var lead = P.leaderMin + rnd() * (P.leaderMax - P.leaderMin);
    var n = rnd() < .5 ? 2 : 3, pulses = [{ at: lead, peak: 1 }], at = lead;
    for (var i = 1; i < n; i++){ at += P.pulseGapMin + rnd() * (P.pulseGapMax - P.pulseGapMin); pulses.push({ at: at, peak: .85 - i * .17 + rnd() * .1 }); }
    return { lead: lead, pulses: pulses, last: at, end: at + P.tail };
  }
  function levels(t, pl){
    if (t < pl.lead) return { bolt: .35 + .25 * (t / pl.lead), sky: .06 * (t / pl.lead), reveal: t / pl.lead };
    var env = 0;
    pl.pulses.forEach(function(p){ if (t >= p.at) env = Math.max(env, p.peak * Math.exp(-(t - p.at) / P.tau)); });
    var resid = t <= pl.last ? .3 : .3 * Math.exp(-(t - pl.last) / (P.tail / 3.2));
    return { bolt: Math.min(1, env + resid), sky: env * P.skyMax, reveal: 1 };
  }
  function strike(rnd, b, type){
    b = b || makeBolt(rnd, type); if (!b) return null;
    renderBolt(b); renderLit(b); return b;
  }
  function tick(now){
    var t = now - cur.t0, lv = levels(t, cur.pl);
    frame(lv.bolt, lv.sky, lv.reveal, cur.b);
    if (t < cur.pl.end) raf = requestAnimationFrame(tick);
    else { raf = 0; frame(0, 0, 1, null); cur = null; schedule(P.gapMin + rndLive() * (P.gapMax - P.gapMin)); }
  }
  function fire(){
    timer = 0;
    // тип траєкторії – щоразу інший, ніж минулого разу
    var opts = TYPES.filter(function(t){ return t !== lastType; }); lastType = opts[Math.floor(rndLive() * opts.length)];
    var b = strike(rndLive, null, lastType); if (!b) { schedule(P.gapMin); return; }
    cur = { b: b, pl: plan(rndLive), t0: performance.now() };
    raf = requestAnimationFrame(function(n){ cur.t0 = n; tick(n); });
  }
  function schedule(ms){ clearTimeout(timer); if (running()) timer = setTimeout(fire, ms); }
  function stop(){ clearTimeout(timer); timer = 0; if (raf) cancelAnimationFrame(raf); raf = 0; cur = null; frame(0, 0, 1, null); }
  var inView = true;
  function running(){ return MODE === 'live' && !reduceMQ.matches && !document.hidden && inView; }

  // ---- Статичні режими ----
  function renderStatic(){
    if (MODE === 'calm') { frame(0, 0, 1, null); return; }
    if (MODE === 'strike' || reduceMQ.matches){
      var b = strike(mulberry(MODE === 'strike' ? SEED : 777), null, TYPES[(SEED - 20261117) % 3]);
      if (MODE === 'strike') frame(1, .85 * P.skyMax, 1, b);   // мить одразу після головного спалаху
      else frame(.8, .3, 1, b);                                                 // без руху – м'якший кадр
    }
  }

  function sized() { return fx.width === Math.round(W * DPR) && fx.height === Math.round(H * DPR); }
  function layout() {
    measure(); buildClouds(); drawSky();
    fx.width = Math.round(W * DPR); fx.height = Math.round(H * DPR);
    stop();
    if (MODE !== 'live' || reduceMQ.matches) renderStatic();
    else schedule(P.firstDelay);
  }
  // Лише зони (шрифт довантажився, змінилась мова, ресайз без зміни розміру героя).
  // Удар, що йде зараз, гаситься – його форма рахувалась за старими зонами.
  function relayout() {
    if (!started) return;
    const hr = hero.getBoundingClientRect();
    if (Math.round(hr.width) !== W || Math.round(hr.height) !== H) { layout(); return; }
    measure();
    if (!sized()) { layout(); return; }
    if (MODE !== 'live' || reduceMQ.matches) { renderStatic(); return; }
    if (cur || raf) { stop(); schedule(P.gapMin); }
  }

  // Хмари будуються один раз – після події load і document.fonts.ready (від шрифтів залежать зони тексту),
  // але не пізніше ніж через 2,5 с. До завантаження CSS шрифтів document.fonts.status уже 'loaded',
  // тому спершу чекаємо load. Якщо шрифт довантажився пізніше – перераховуємо лише зони.
  let started = false;
  function start() { if (!started) { started = true; layout(); } }
  function afterLoad() { if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start(); }
  if (document.readyState === 'complete') afterLoad(); else window.addEventListener('load', afterLoad);
  setTimeout(start, 2500);
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', relayout);
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(relayout, 180); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (running()) schedule(P.firstDelay); });
  if ('IntersectionObserver' in window) new IntersectionObserver((e) => {
    inView = e[0].isIntersecting; if (!inView) stop(); else if (running() && !timer && !raf) schedule(800);
  }).observe(hero);
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', () => { if (started) layout(); });

  return { relayout };
}
