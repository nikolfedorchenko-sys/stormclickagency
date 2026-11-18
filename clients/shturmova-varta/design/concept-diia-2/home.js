/* Головна: перемикач першого екрана, пауза градієнта, вкладки, карусель, акордеони, нижня панель. */
(function () {
  var hero = document.getElementById('hero');
  var still = /[?&]still/.test(location.search);
  if (still) document.documentElement.classList.add('still');

  /* вкладки (ARIA tabs): клік, стрілки, Home/End */
  function tabs(list, onChange) {
    var t = list.querySelectorAll('[role="tab"]');
    function pick(b) {
      t.forEach(function (x) {
        var on = x === b;
        x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      onChange && onChange(b);
    }
    t.forEach(function (b) { b.addEventListener('click', function () { pick(b); }); });
    SV.roving(list, '[role="tab"]', pick);
    return pick;
  }

  // перший екран: «Підібрати / Подзвонити»
  tabs(hero.querySelector('.switch'));
  if (/[?&]mode=call/.test(location.search)) hero.querySelector('#sw-call').click();

  // короткий плейсхолдер на вузьких екранах
  var q = document.getElementById('q'), longPh = q.placeholder;
  function ph() { q.placeholder = innerWidth < 560 ? q.dataset.short : longPh; }
  ph(); addEventListener('resize', ph);
  // порожній пошук – просто відкриваємо майстер з першого кроку
  q.form.addEventListener('submit', function (e) { if (!q.value.trim()) { e.preventDefault(); location.href = 'wizard.html'; } });

  // пауза градієнта
  var aur = hero.querySelector('.aurora'), pb = hero.querySelector('.pause');
  pb.addEventListener('click', function () {
    var p = aur.classList.toggle('paused');
    pb.setAttribute('aria-pressed', p);
    pb.setAttribute('aria-label', p ? 'Увімкнути анімацію фону' : 'Зупинити анімацію фону');
    pb.querySelector('use').setAttribute('href', p ? '#i-play' : '#i-pause');
  });

  // карусель: стрілки + смуга прогресу
  var bar = document.querySelector('.progress i'), arrows = document.querySelectorAll('.arrows button');
  function rail() { return document.querySelector('.tabpanel:not([hidden]) .rail'); }
  function update() {
    var r = rail(); if (!r) return;
    var max = r.scrollWidth - r.clientWidth, vis = r.clientWidth / r.scrollWidth;
    var w = Math.min(Math.max(vis, .12), 1) * 100, pos = max > 0 ? r.scrollLeft / max : 0;
    bar.style.width = w + '%'; bar.style.left = (100 - w) * pos + '%';
    arrows[0].disabled = r.scrollLeft <= 2; arrows[1].disabled = r.scrollLeft >= max - 2;
    arrows.forEach(function (a) { a.setAttribute('aria-controls', r.id); });
  }
  tabs(document.querySelector('.tabs'), function () { var r = rail(); if (r) r.scrollLeft = 0; update(); });
  document.querySelectorAll('.rail').forEach(function (r) { r.addEventListener('scroll', update, { passive: true }); });
  var smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  arrows.forEach(function (a) {
    a.addEventListener('click', function () { var r = rail(); r.scrollBy({ left: +a.dataset.dir * (r.querySelector('.card').offsetWidth + 30), behavior: smooth }); });
  });
  addEventListener('resize', update); update();

  // «Ситуації»: на мобільному – акордеони (перший відкритий), на ширших – завжди відкриті списки
  var dets = document.querySelectorAll('.sit-col details');
  function sit() {
    var mob = innerWidth <= 640;
    dets.forEach(function (d, i) {
      var s = d.querySelector('summary');
      if (mob) { s.removeAttribute('tabindex'); s.removeAttribute('aria-disabled'); }
      else { d.open = true; s.tabIndex = -1; }
    });
  }
  dets.forEach(function (d, i) {
    d.querySelector('summary').addEventListener('click', function (e) { if (innerWidth > 640) e.preventDefault(); });
    if (innerWidth <= 640 && i > 0) d.open = false;
  });
  sit(); addEventListener('resize', sit);

  // мобільна панель після першого екрана
  var mbar = document.querySelector('.mbar');
  if ('IntersectionObserver' in window && !still) {
    new IntersectionObserver(function (e) { mbar.classList.toggle('show', !e[0].isIntersecting); }).observe(hero);
  }
})();
