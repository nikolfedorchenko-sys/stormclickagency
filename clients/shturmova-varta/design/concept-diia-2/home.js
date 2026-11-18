(function () {
  var hero = document.getElementById('hero');
  var still = /[?&]still/.test(location.search);
  if (still) document.documentElement.classList.add('still');

  // перемикач «Підібрати / Подзвонити»
  hero.querySelectorAll('.switch button').forEach(function (b) {
    b.addEventListener('click', function () {
      hero.querySelectorAll('.switch button').forEach(function (x) { x.setAttribute('aria-selected', x === b); });
      hero.classList.toggle('mode-call', b.dataset.mode === 'call');
    });
  });

  // короткий плейсхолдер на вузьких екранах
  var q = document.getElementById('q'), longPh = q.placeholder;
  function ph() { q.placeholder = innerWidth < 560 ? q.dataset.short : longPh; }
  ph(); addEventListener('resize', ph);

  // пауза градієнта
  var aur = hero.querySelector('.aurora'), pb = hero.querySelector('.pause');
  pb.addEventListener('click', function () {
    var p = aur.classList.toggle('paused');
    pb.setAttribute('aria-pressed', p);
    pb.setAttribute('aria-label', p ? 'Увімкнути анімацію фону' : 'Зупинити анімацію фону');
    pb.querySelector('use').setAttribute('href', p ? '#i-play' : '#i-pause');
  });

  // вкладки Бізнесу / Приватним
  var tabs = document.querySelectorAll('.tabs button');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) {
        var on = x === t; x.setAttribute('aria-selected', on);
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      update();
    });
  });

  // карусель: стрілки + смуга прогресу
  var bar = document.querySelector('.progress i'), arrows = document.querySelectorAll('.arrows button');
  function rail() { return document.querySelector('.tabpanel:not([hidden]) .rail'); }
  function update() {
    var r = rail(); if (!r) return;
    var max = r.scrollWidth - r.clientWidth, vis = r.clientWidth / r.scrollWidth;
    var w = Math.max(vis, .12) * 100, pos = max > 0 ? r.scrollLeft / max : 0;
    bar.style.width = w + '%'; bar.style.left = (100 - w) * pos + '%';
    arrows[0].disabled = r.scrollLeft <= 2; arrows[1].disabled = r.scrollLeft >= max - 2;
  }
  document.querySelectorAll('.rail').forEach(function (r) { r.addEventListener('scroll', update, { passive: true }); });
  arrows.forEach(function (a) {
    a.addEventListener('click', function () { var r = rail(); r.scrollBy({ left: +a.dataset.dir * (r.querySelector('.card').offsetWidth + 30), behavior: 'smooth' }); });
  });
  addEventListener('resize', update); update();

  // мобільні «Ситуації» – акордеони згорнуті
  if (innerWidth <= 640) document.querySelectorAll('.sit-col details').forEach(function (d, i) { if (i > 0) d.open = false; });

  // мобільна панель після першого екрана
  var mbar = document.querySelector('.mbar');
  if ('IntersectionObserver' in window && !still) {
    new IntersectionObserver(function (e) { mbar.classList.toggle('show', !e[0].isIntersecting); }).observe(hero);
  }
})();
