/* Майстер заявки: одне питання на екран, 4 кроки. Без бібліотек.
   Параметри адреси: t=object|person|event|unsure, p=обʼєкт, w=кого, e=захід, q=текст із пошуку. */
(function () {
  var TYPES = [
    { v: 'object', t: 'Обʼєкт', s: 'Офіс, склад, магазин, будмайданчик, будинок' },
    { v: 'person', t: 'Людину', s: 'Особиста охорона і супровід' },
    { v: 'event', t: 'Захід', s: 'Конференція, концерт, свято' },
    { v: 'unsure', t: 'Ще не знаю – порадьте', s: 'Менеджер допоможе обрати' }
  ];
  var STEP2 = {
    object: { k: 'place', q: 'Який це обʼєкт?', side: 'Обʼєкт', o: ['Офіс або бізнес-центр', 'Склад чи виробництво', 'Магазин або ТЦ', 'Будівельний майданчик', 'Приватний будинок', 'КПП', 'Інше'] },
    person: { k: 'who', q: 'Кого охороняємо?', side: 'Кого', o: ['Мене особисто', 'Мою родину', 'Гостей чи партнерів', 'Супровід'] },
    event: { k: 'ev', q: 'Який захід?', side: 'Захід', o: ['Корпоративний чи діловий', 'Концерт чи публічна подія', 'Приватне свято'], extra: { k: 'guests', l: 'Скільки гостей', o: ['До 50', '50–200', '200–1000', 'Понад 1000'] } },
    unsure: { k: 'place', q: 'Що найближче до вашої ситуації?', side: 'Ситуація', o: ['Бізнес: офіс, склад, магазин', 'Дім чи ділянка', 'Безпека людини', 'Подія чи захід'] }
  };
  var WHEN = ['Цілодобово', 'Лише вночі', 'Лише вдень', 'Разово, на кілька годин чи днів'];
  var START = ['Якнайшвидше', 'Цього тижня', 'Пізніше'];
  var CH = ['Дзвінок', 'Telegram', 'Viber'];

  var a = {}, step = 1, found = '';
  var P = new URLSearchParams(location.search);
  if (P.get('t')) a.type = P.get('t');
  if (P.get('p')) a.place = P.get('p');
  if (P.get('w')) a.who = P.get('w');
  if (P.get('e')) a.ev = P.get('e');
  var q = (P.get('q') || '').trim();
  if (q) {
    found = q; var l = q.toLowerCase();
    var R = [[/склад|вироб/, 'object', 'Склад чи виробництво'], [/офіс|бц|бізнес/, 'object', 'Офіс або бізнес-центр'], [/магаз|тц|торг/, 'object', 'Магазин або ТЦ'],
      [/будмайд|будів|будова/, 'object', 'Будівельний майданчик'], [/будин|дім|дач|котедж/, 'object', 'Приватний будинок'], [/кпп|пропуск|шлагбаум/, 'object', 'КПП'],
      [/супров/, 'person', 'Супровід'], [/особист|охоронц|людин|родин/, 'person', null], [/захід|конфер|концерт|весіл|свят|корпорат/, 'event', null]];
    for (var i = 0; i < R.length; i++) if (R[i][0].test(l)) {
      a.type = R[i][1];
      if (R[i][2]) a[R[i][1] === 'person' ? 'who' : 'place'] = R[i][2];
      if (/весіл|свят/.test(l)) a.ev = 'Приватне свято';
      break;
    }
  }
  if (a.type && STEP2[a.type]) step = 2;

  var box = document.getElementById('wiz'), side = document.getElementById('steps');
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function typeName(v) { for (var i = 0; i < TYPES.length; i++) if (TYPES[i].v === v) return TYPES[i].t; return ''; }
  function s2() { return STEP2[a.type] || STEP2.object; }
  function ok(n) {
    if (n === 1) return !!a.type;
    if (n === 2) { var c = s2(); return !!a[c.k] && (!c.extra || !!a[c.extra.k]); }
    if (n === 3) return !!a.when && !!a.start;
    if (n === 4) return (a.name || '').trim().length > 1 && (a.phone || '').replace(/\D/g, '').length >= 12;
  }
  function opt(k, v, t, s) {
    return '<button type="button" class="opt" role="radio" aria-checked="' + (a[k] === v) + '" data-k="' + k + '" data-v="' + esc(v) + '"><span class="dot"></span><span class="opt-t">' + esc(t || v) + (s ? '<span class="opt-s">' + esc(s) + '</span>' : '') + '</span></button>';
  }
  function chips(k, list, label) {
    var h = '<p class="lbl" id="l-' + k + '">' + label + '</p><div class="chips" role="radiogroup" aria-labelledby="l-' + k + '">';
    list.forEach(function (v) { h += '<button type="button" class="chip" role="radio" aria-checked="' + (a[k] === v) + '" data-k="' + k + '" data-v="' + esc(v) + '">' + esc(v) + '</button>'; });
    return h + '</div>';
  }
  function nav(n, last) {
    return '<div class="w-nav">' + (n > 1 ? '<button type="button" class="btn btn-ghost" data-act="back" aria-label="Назад"><svg class="i"><use href="#i-back"/></svg><span class="m-hide">Назад</span></button>' : '') +
      '<button type="button" class="btn" data-act="' + (last ? 'send' : 'next') + '"' + (ok(n) ? '' : ' disabled') + '>' + (last ? 'Надіслати заявку' : 'Далі') + '<svg class="i"><use href="#i-arrow"/></svg></button></div>';
  }
  function head(n) {
    var b = ''; for (var i = 1; i <= 4; i++) b += '<span class="' + (i <= n ? 'on' : '') + '"></span>';
    return '<div class="w-meta"><span>Крок ' + n + ' з 4</span><span>Без реєстрації</span></div><div class="w-bar" aria-hidden="true">' + b + '</div>';
  }

  function renderSide() {
    var c = s2(), rows = [
      ['Що охороняти', typeName(a.type)],
      [a.type ? c.side : 'Обʼєкт чи подія', [a[c.k], c.extra ? a[c.extra.k] && a[c.extra.k] + ' гостей' : ''].filter(Boolean).join(', ')],
      ['Графік', [a.when, a.start].filter(Boolean).join(', ').toLowerCase().replace(/^./, function (x) { return x.toUpperCase(); })],
      ['Контакт', a.phone && a.phone.replace(/\D/g, '').length >= 12 ? a.phone : '']
    ], h = '';
    rows.forEach(function (r, i) {
      var n = i + 1, cls = step > 4 || n < step ? 'done' : n === step ? 'now' : '';
      h += '<li class="' + cls + '"><button type="button" ' + (cls === 'done' && step <= 4 ? 'data-go="' + n + '"' : 'tabindex="-1"') + '><small>Крок ' + n + '</small><b>' + r[0] + '</b>' + (cls === 'done' && r[1] ? '<em>' + esc(r[1]) + '</em>' : '') + '</button></li>';
    });
    side.innerHTML = h;
  }

  function render(focus) {
    var h = '';
    if (step === 1) {
      h = head(1) + '<h2 class="w-q" tabindex="-1">Що потрібно охороняти?</h2>' + (found ? '<p class="w-found">Ви шукали: «' + esc(found) + '»</p>' : '') +
        '<div class="opts" role="radiogroup">' + TYPES.map(function (t) { return opt('type', t.v, t.t, t.s); }).join('') + '</div>' + nav(1);
    } else if (step === 2) {
      var c = s2();
      h = head(2) + '<h2 class="w-q" tabindex="-1">' + c.q + '</h2>' + (found ? '<p class="w-found">Ви шукали: «' + esc(found) + '»</p>' : '') +
        '<div class="opts" role="radiogroup">' + c.o.map(function (v) { return opt(c.k, v); }).join('') + '</div>' +
        (c.extra ? chips(c.extra.k, c.extra.o, c.extra.l) : '') +
        (a.type === 'object' || a.type === 'event' ? '<label class="fld"><span>Адреса або район <i>– необовʼязково</i></span><input type="text" data-in="addr" autocomplete="street-address" value="' + esc(a.addr || '') + '" placeholder="Київ, район або вулиця"></label>' : '') + nav(2);
    } else if (step === 3) {
      h = head(3) + '<h2 class="w-q" tabindex="-1">Коли потрібна охорона?</h2><div class="opts" role="radiogroup">' + WHEN.map(function (v) { return opt('when', v); }).join('') + '</div>' +
        chips('start', START, 'Коли почати') + nav(3);
    } else if (step === 4) {
      if (!a.channel) a.channel = 'Дзвінок';
      h = head(4) + '<h2 class="w-q" tabindex="-1">Як з вами звʼязатися?</h2><p class="w-sub">Менеджер передзвонить, уточнить деталі і назве вартість.</p>' +
        '<label class="fld"><span>Імʼя</span><input type="text" data-in="name" autocomplete="name" value="' + esc(a.name || '') + '" placeholder="Як до вас звертатися"></label>' +
        '<label class="fld"><span>Телефон</span><input type="tel" inputmode="tel" data-in="phone" autocomplete="tel" value="' + esc(a.phone || '+380 ') + '"></label>' +
        chips('channel', CH, 'Зручніше відповісти') +
        '<p class="fine">Месенджери – [уточнити], чи підключені. Надсилаючи заявку, ви погоджуєтесь на обробку даних для звʼязку.</p>' + nav(4, true);
    } else {
      var c2 = s2(), rows = [['Послуга', typeName(a.type)], [c2.side, [a[c2.k], a.guests && a.guests + ' гостей', a.addr].filter(Boolean).join(', ')], ['Графік', a.when + ', ' + a.start.toLowerCase()], ['Звʼязок', a.channel + ' · ' + a.phone]];
      h = '<div class="done-mark"><svg class="i"><use href="#i-check"/></svg></div><h2 class="w-q" tabindex="-1">Заявку надіслано</h2><p class="w-sub">Менеджер звʼяжеться з вами [уточнити: протягом якого часу]. Це демо – заявка нікуди не відправляється.</p><dl class="sum">' +
        rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; }).join('') + '</dl><div class="w-nav"><a class="btn" href="index.html">На головну</a></div>';
    }
    box.innerHTML = h; renderSide();
    if (focus) { var t = box.querySelector('.w-q'); t && t.focus({ preventScroll: true }); if (innerWidth < 900) box.scrollIntoView({ block: 'start', behavior: 'smooth' }); }
  }

  function refreshNext() { var b = box.querySelector('[data-act="next"],[data-act="send"]'); if (b) b.disabled = !ok(step); }

  box.addEventListener('click', function (e) {
    var o = e.target.closest('[data-k]');
    if (o) {
      var k = o.dataset.k;
      if (k === 'type' && a.type !== o.dataset.v) { delete a.place; delete a.who; delete a.ev; delete a.guests; }
      a[k] = o.dataset.v;
      o.parentNode.querySelectorAll('[data-k="' + k + '"]').forEach(function (x) { x.setAttribute('aria-checked', x === o); });
      refreshNext(); renderSide(); return;
    }
    var act = e.target.closest('[data-act]');
    if (!act) return;
    if (act.dataset.act === 'back') step--;
    if (act.dataset.act === 'next' && ok(step)) step++;
    if (act.dataset.act === 'send' && ok(4)) step = 5;
    render(true);
  });
  box.addEventListener('input', function (e) {
    var k = e.target.dataset.in; if (!k) return;
    a[k] = e.target.value; refreshNext();
  });
  side.addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) { step = +b.dataset.go; render(true); } });

  render(false);
})();
