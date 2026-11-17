/* Штурмова варта – рух у макеті лендингу. Без бібліотек, звичайний скрипт (defer).
 *
 * 1. Сцена першого екрана (canvas): нічний об'єкт, «шеренга» стійок виростає, на щоглі вмикається
 *    сигнальний квадрат «на посту», далі повільно ходить промінь прожектора. Без миготіння і спалахів.
 * 2. Поява блоків (.reveal, .reveal-cut – зі скосом), ритм стійок у заголовках (.rh).
 * 3. Таймлайн «Як починаємо» – кроки заповнюються при прокрутці.
 * 4. Лічильники [data-count] – анімуються лише коли в атрибуті є число; порожній – лишається «–».
 * 5. Нахил карток [data-tilt] – лише миша/тачпад з hover.
 * 6. Шапка при прокрутці, мобільна панель дій, передвибір послуги [data-service], анімація знака в шапці.
 *
 * Режими для скриншотів: ?still – усе відкрито, сцена – статичний кадр з променем;
 * ?calm – статичний кадр без променя. prefers-reduced-motion – як ?still, без жодних переходів.
 * Параметри руху – у tokens.css (--dur-*, --ease-*, --stagger) і в об'єкті P нижче.
 */
(function () {
  'use strict';
  var root = document.documentElement;
  var params = new URLSearchParams(location.search);
  var reduceMQ = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var MODE = params.has('still') ? 'still' : params.has('calm') ? 'calm' : 'live';
  var STATIC = MODE !== 'live' || reduceMQ.matches;
  root.classList.add('js');
  if (STATIC) root.classList.add('still');

  /* ---------- 1. Сцена першого екрана ---------- */
  var P = {
    growDelay: 350,      // мс до початку росту стійок
    growDur: 720,        // ріст однієї стійки (= --dur-l)
    stagger: 45,         // між стійками
    signalDelay: 250,    // після останньої стійки – вмикається квадрат
    beamFadeIn: 1600,    // промінь з'являється плавно
    period: 16000,       // повний прохід променя туди-назад (= --dur-scene)
    beamWidth: 0.16,     // ширина конуса, рад
    beamAlpha: 0.15,     // максимальна яскравість променя (не сліпить)
    fps: 30,             // промінь малюємо не частіше 30 к/с
    stillPhase: 0.32     // положення променя у статичному кадрі
  };
  var C = { sky0: '#101215', sky1: '#16181C', far: '#181B20', bld: '#1C1F25', bldEdge: '#262A31', panel: '#20242A',
    gate: '#121418', win: '#2A2D33', winLit: 'rgba(214,170,110,.22)', post: '#2B2F36', postLit: '#5A5F67',
    ground: '#14161A', mast: '#2B2F36', signal: '#FF5B1F', beam: '255,232,200' };

  function initScene() {
    var hero = document.querySelector('.hero');
    var cv = hero && hero.querySelector('.scene');
    if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d');
    var W, H, DPR, G = null, zones = [], t0 = 0, raf = 0, last = 0, inView = true, started = false;

    function rel(r, hr) { return { x: r.left - hr.left, y: r.top - hr.top, w: r.width, h: r.height }; }
    function measure() {
      var hr = hero.getBoundingClientRect();
      W = Math.round(hr.width); H = Math.round(hr.height);
      DPR = Math.min(window.devicePixelRatio || 1, W < 768 ? 1.5 : 2);
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      // Сцена стоїть у зоні .visual (десктоп – праворуч, мобільний – під текстом)
      var st = hero.querySelector('.visual');
      var s = st ? rel(st.getBoundingClientRect(), hr) : { x: W * .55, y: 0, w: W * .45, h: H };
      var wide = W >= 1080;
      var ground = H - (wide ? 0 : 0);
      var bw = Math.min(s.w * (wide ? .88 : .82), 660), bh = Math.min(s.h * (wide ? .6 : .52), bw * .7);
      var bx = s.x + s.w - bw - (wide ? 0 : s.w * .04), by = ground - bh;
      // «Шеренга» – стійки 24/14 у масштабі; висоти з ритму знака
      var k = wide ? 1 : .7, pw = 10 * k, gap = 7 * k, posts = [];
      var hs = [.42, .58, .46, .7, .5, .62, .44, .66, .52, .6];
      var fx0 = wide ? s.x - 20 : 0, fx1 = W;
      for (var x = fx0, i = 0; x < fx1; x += pw + gap, i++) posts.push({ x: x, h: (wide ? 64 : 44) * hs[i % hs.length] });
      var mastX = wide ? s.x + s.w * .06 : s.x + s.w * .1, mastTop = ground - Math.min(s.h * .78, wide ? 420 : 230);
      G = { s: s, wide: wide, ground: ground, b: { x: bx, y: by, w: bw, h: bh }, posts: posts, pw: pw,
        mast: { x: mastX, top: mastTop, w: wide ? 8 : 6, sq: wide ? 18 : 13 } };
      // Заборонені зони: текст і кнопки першого екрана (промінь там гасне)
      zones = [];
      hero.querySelectorAll('.copy > *').forEach(function (el) {
        var r = el.getBoundingClientRect(); if (r.width && r.height) zones.push(rel(r, hr));
      });
    }

    function drawBase(grow, signal) {
      var b = G.b, g = G.ground;
      var sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, C.sky0); sky.addColorStop(1, C.sky1);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      // далекий силует міста – глибина без деталей
      ctx.fillStyle = C.far;
      var fh = [.34, .5, .28, .42, .6, .36, .46, .3], fw = G.wide ? 70 : 46;
      for (var fx = G.s.x + (G.wide ? 40 : 0), j = 0; fx < W; fx += fw + 6, j++) { var hh = b.h * fh[j % fh.length] * 1.1; ctx.fillRect(fx, g - b.h * .35 - hh, fw, hh + b.h * .35); }
      // будівля з фірмовим скосом угорі праворуч
      var cut = Math.min(56, b.w * .09);
      ctx.fillStyle = C.bld; ctx.beginPath();
      ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.w - cut, b.y); ctx.lineTo(b.x + b.w, b.y + cut);
      ctx.lineTo(b.x + b.w, g); ctx.lineTo(b.x, g); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = C.bldEdge; ctx.lineWidth = 1; ctx.stroke();
      // панелі фасаду
      ctx.fillStyle = C.panel;
      for (var px = b.x + 24; px < b.x + b.w - 12; px += 38) ctx.fillRect(px, b.y + 14, 1, b.h - 14);
      // ворота і стрічка вікон
      var gw = b.w * .3, gx = b.x + b.w * .14, gh = b.h * .52;
      ctx.fillStyle = C.gate; ctx.fillRect(gx, g - gh, gw, gh);
      ctx.fillStyle = C.panel; for (var gy = g - gh + 10; gy < g; gy += 10) ctx.fillRect(gx, gy, gw, 1);
      var wy = b.y + b.h * .18, ww = 22, wh = 10;
      for (var wx = b.x + b.w * .52, n = 0; wx < b.x + b.w - cut - ww; wx += ww + 12, n++) {
        ctx.fillStyle = (n % 4 === 1) ? C.winLit : C.win; ctx.fillRect(wx, wy, ww, wh);
      }
      // земля
      ctx.fillStyle = C.ground; ctx.fillRect(0, g - 2, W, 2);
      // щогла прожектора
      var m = G.mast; ctx.fillStyle = C.mast; ctx.fillRect(m.x, m.top, m.w, g - m.top);
      ctx.fillRect(m.x - 6, m.top - 6, m.w + 12, 8);
      // сигнальний квадрат на щоглі
      if (signal > 0) {
        var sq = m.sq * (.7 + .3 * Math.min(signal, 1.05));
        ctx.globalAlpha = Math.min(signal, 1);
        ctx.fillStyle = C.signal; ctx.fillRect(m.x + m.w / 2 - sq / 2, m.top - 14 - sq, sq, sq);
        ctx.globalAlpha = 1;
      }
      drawPosts(grow, C.post);
    }
    function drawPosts(grow, color) {
      ctx.fillStyle = color;
      var n = G.posts.length;
      for (var i = 0; i < n; i++) {
        var p = G.posts[i], f = grow(i, n);
        if (f <= 0) continue;
        var h = p.h * f; ctx.fillRect(p.x, G.ground - h, G.pw, h);
      }
    }
    function beamPath(phase) {
      // промінь з голови щогли, кут ходить між «на будівлю» і «на периметр»
      var m = G.mast, ox = m.x + m.w / 2, oy = m.top - 2;
      var a0 = G.wide ? 0.18 : 0.12, a1 = G.wide ? 0.95 : 1.05;
      var e = .5 - .5 * Math.cos(phase * Math.PI * 2);           // туди-назад, м'яко на краях
      var a = a0 + (a1 - a0) * e, hw = P.beamWidth / 2, L = Math.hypot(W, H);
      return { ox: ox, oy: oy, a: a, p1: [ox + Math.cos(a - hw) * L, oy + Math.sin(a - hw) * L],
        p2: [ox + Math.cos(a + hw) * L, oy + Math.sin(a + hw) * L], L: L };
    }
    var off = document.createElement('canvas'), octx = off.getContext('2d');
    function drawBeam(phase, alpha, grow) {
      if (alpha <= 0) return;
      if (off.width !== cv.width || off.height !== cv.height) { off.width = cv.width; off.height = cv.height; }
      var bp = beamPath(phase), main = ctx;
      octx.setTransform(1, 0, 0, 1, 0, 0); octx.clearRect(0, 0, off.width, off.height);
      octx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx = octx;                                   // малюємо промінь в окремий шар
      ctx.save();
      ctx.beginPath(); ctx.moveTo(bp.ox, bp.oy); ctx.lineTo(bp.p1[0], bp.p1[1]); ctx.lineTo(bp.p2[0], bp.p2[1]); ctx.closePath();
      var gr = ctx.createRadialGradient(bp.ox, bp.oy, 4, bp.ox, bp.oy, Math.min(bp.L, G.wide ? 900 : 520));
      gr.addColorStop(0, 'rgba(' + C.beam + ',' + (P.beamAlpha * 1.6 * alpha) + ')');
      gr.addColorStop(.55, 'rgba(' + C.beam + ',' + (P.beamAlpha * alpha) + ')');
      gr.addColorStop(1, 'rgba(' + C.beam + ',0)');
      ctx.fillStyle = gr; ctx.fill();
      ctx.clip();                                   // що потрапило в конус – підсвічене
      ctx.globalAlpha = alpha; drawPosts(grow, C.postLit); ctx.globalAlpha = 1;
      ctx.restore();
      // заборонені зони: під текстом промінь гасне, з м'яким краєм
      var pad = G.wide ? 24 : 14;
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';
      if ('filter' in ctx) ctx.filter = 'blur(' + (G.wide ? 14 : 8) + 'px)';
      ctx.fillStyle = '#000';
      zones.forEach(function (z) { ctx.fillRect(z.x - pad, z.y - pad, z.w + pad * 2, z.h + pad * 2); });
      ctx.restore();
      ctx = main;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(off, 0, 0); ctx.restore();
    }

    function growAt(t) {
      return function (i, n) {
        var s = (t - P.growDelay - i * P.stagger) / P.growDur;
        s = s < 0 ? 0 : s > 1 ? 1 : s; return 1 - Math.pow(1 - s, 3);
      };
    }
    function full() { return 1; }
    function frame(now) {
      raf = 0;
      if (!running()) return;
      if (now - last < 1000 / P.fps) { raf = requestAnimationFrame(frame); return; }
      last = now;
      var t = now - t0, n = G.posts.length;
      var growEnd = P.growDelay + (n - 1) * P.stagger + P.growDur;
      var sig = Math.max(0, Math.min(1.05, (t - growEnd - P.signalDelay) / 260));
      var beamA = Math.max(0, Math.min(1, (t - growEnd - P.signalDelay - 300) / P.beamFadeIn));
      var g = t < growEnd ? growAt(t) : full;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      drawBase(g, sig > 1 ? 1 : sig);
      drawBeam(((t - growEnd) / P.period) % 1 + P.stillPhase, beamA, g);
      raf = requestAnimationFrame(frame);
    }
    function renderStatic() {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      drawBase(full, 1);
      if (MODE !== 'calm') drawBeam(P.stillPhase, reduceMQ.matches ? .8 : 1, full);
    }
    function running() { return started && G && !STATIC && !document.hidden && inView; }
    function start() {
      if (started) return; started = true;
      measure();
      if (STATIC) { renderStatic(); return; }
      t0 = performance.now(); raf = requestAnimationFrame(frame);
    }
    function relayout() {
      if (!started) return;
      measure();
      if (STATIC) { renderStatic(); return; }
      if (!raf && running()) raf = requestAnimationFrame(frame);
    }
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(relayout, 160); });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && running() && !raf) raf = requestAnimationFrame(frame);
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) {
      inView = e[0].isIntersecting; if (inView && running() && !raf) raf = requestAnimationFrame(frame);
    }).observe(hero);
    if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', function () { STATIC = MODE !== 'live' || reduceMQ.matches; relayout(); });
    // Зони тексту залежать від шрифтів: стартуємо після load + fonts.ready, але не пізніше 2,5 с
    function afterLoad() { if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start(); }
    if (document.readyState === 'complete') afterLoad(); else window.addEventListener('load', afterLoad);
    setTimeout(start, 2500);
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', relayout);
  }

  /* ---------- 2–4. Поява, таймлайн, лічильники ---------- */
  function initReveals() {
    var els = document.querySelectorAll('.reveal, .reveal-cut, .rh, .step');
    if (STATIC || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    els.forEach(function (el) { if (!el.classList.contains('step')) io.observe(el); });
    // кроки таймлайну вмикаються, коли доходять до середини екрана
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io2.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -30% 0px' });
    document.querySelectorAll('.step').forEach(function (el) { io2.observe(el); });
  }
  function initCounters() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.dataset.count);
      if (!isFinite(target)) return;                         // цифри немає – лишаємо «–», нічого не вигадуємо
      var suffix = el.dataset.suffix || '';
      function run() {
        if (STATIC) { el.textContent = target.toLocaleString('uk-UA') + suffix; return; }
        var t0 = performance.now(), dur = 1400;
        (function step(now) {
          var k = Math.min(1, (now - t0) / dur), v = target * (1 - Math.pow(1 - k, 3));
          el.textContent = Math.round(v).toLocaleString('uk-UA') + suffix;
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      }
      if (!('IntersectionObserver' in window)) { run(); return; }
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { run(); io.disconnect(); } });
      io.observe(el);
    });
  }

  /* ---------- 5. Нахил карток ---------- */
  function initTilt() {
    if (STATIC || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        card.style.setProperty('--rx', (-y * 4).toFixed(2) + 'deg');
        card.style.setProperty('--ry', (x * 5).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- 6. Шапка, мобільна панель, передвибір послуги ---------- */
  function initChrome() {
    var top = document.querySelector('.top');
    function onScroll() { if (top) top.classList.toggle('is-scrolled', window.scrollY > 40); }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if (!STATIC && top) top.classList.add('logo-boot');

    document.querySelectorAll('[data-service]').forEach(function (a) {
      a.addEventListener('click', function () {
        var r = document.querySelector('input[name="service"][value="' + a.dataset.service + '"]');
        if (r) r.checked = true;
      });
    });

    var bar = document.querySelector('.mbar'), hero = document.querySelector('.hero'), lead = document.getElementById('lead');
    if (!bar || !hero || !lead || !('IntersectionObserver' in window)) return;
    var heroVisible = true, leadVisible = false;
    function upd() { bar.classList.toggle('show', !heroVisible && !leadVisible); }
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; upd(); }).observe(hero);
    new IntersectionObserver(function (e) { leadVisible = e[0].isIntersecting; upd(); }, { threshold: .15 }).observe(lead);
  }

  function boot() { initScene(); initReveals(); initCounters(); initTilt(); initChrome(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
