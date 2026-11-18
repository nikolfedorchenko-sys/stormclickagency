/* Майстер заявки: одне питання на екран, 4 кроки + екран «надіслано». Без бібліотек.
   Параметри адреси (див. README):
     t = object | person | event | unsure   – що охороняти (відкриває крок 2)
     p = обʼєкт, w = кого, e = захід        – точне значення варіанта кроку 2
     q = текст із пошуку на головній        – розбираємо ключовими словами
     demo = errors | sending | fail | done | long – показати стан для макета
     theme = light | dark                   – тема (обробляє скрипт у <head>) */
(function () {
  var TYPES = [
    { v: 'object', t: 'Об’єкт', s: 'Офіс, склад, магазин, будмайданчик, будинок' },
    { v: 'person', t: 'Людину', s: 'Особиста охорона і супровід' },
    { v: 'event', t: 'Захід', s: 'Конференція, концерт, свято' },
    { v: 'unsure', t: 'Ще не знаю – порадьте', s: 'Менеджер допоможе обрати' }
  ];
  var STEP2 = {
    object: { k: 'place', q: 'Який це об’єкт?', side: 'Об’єкт', o: ['Офіс або бізнес-центр', 'Склад чи виробництво', 'Магазин або ТЦ', 'Будівельний майданчик', 'Приватний будинок', 'КПП', 'Інше'] },
    person: { k: 'who', q: 'Кого охороняємо?', side: 'Кого', o: ['Мене особисто', 'Мою родину', 'Гостей чи партнерів', 'Супровід'] },
    event: { k: 'ev', q: 'Який захід?', side: 'Захід', o: ['Корпоративний чи діловий', 'Концерт чи публічна подія', 'Приватне свято'], extra: { k: 'guests', l: 'Скільки гостей', o: ['До 50', '50–200', '200–1000', 'Понад 1000'] } },
    unsure: { k: 'place', q: 'Що найближче до вашої ситуації?', side: 'Ситуація', o: ['Бізнес: офіс, склад, магазин', 'Дім чи ділянка', 'Безпека людини', 'Подія чи захід'] }
  };
  var WHEN = ['Цілодобово', 'Лише вночі', 'Лише вдень', 'Разово, на кілька годин чи днів'];
  var START = ['Якнайшвидше', 'Цього тижня', 'Пізніше'];
  var CH = ['Дзвінок', 'Telegram', 'Viber'];
  var SEND_MS = 1400;

  var a = {}, step = 1, found = '', foundOk = false;
  var st = { sending: false, sendErr: false, failNext: false, touched: {}, showAll: false };
  var P = new URLSearchParams(location.search);
  if (P.get('t') && STEP2[P.get('t')]) a.type = P.get('t');
  if (P.get('p')) a.place = P.get('p');
  if (P.get('w')) a.who = P.get('w');
  if (P.get('e')) a.ev = P.get('e');
  var q = (P.get('q') || '').trim().slice(0, 80);
  if (q) {
    found = q; var l = q.toLowerCase();
    var R = [[/склад|вироб/, 'object', 'Склад чи виробництво'], [/офіс|бц|бізнес/, 'object', 'Офіс або бізнес-центр'], [/магаз|тц|торг/, 'object', 'Магазин або ТЦ'],
      [/будмайд|будів|будова/, 'object', 'Будівельний майданчик'], [/будин|дім|дач|котедж/, 'object', 'Приватний будинок'], [/кпп|пропуск|шлагбаум/, 'object', 'КПП'],
      [/супров/, 'person', 'Супровід'], [/особист|охоронц|людин|родин/, 'person', null], [/захід|конфер|концерт|весіл|свят|корпорат/, 'event', null]];
    for (var i = 0; i < R.length; i++) if (R[i][0].test(l)) {
      a.type = R[i][1]; foundOk = true;
      if (R[i][2]) a[R[i][1] === 'person' ? 'who' : 'place'] = R[i][2];
      if (/весіл|свят/.test(l)) a.ev = 'Приватне свято';
      break;
    }
  }
  if (a.type) step = 2;

  // стани для макета
  var demo = P.get('demo');
  if (demo) {
    a = { type: 'object', place: 'Склад чи виробництво', when: 'Цілодобово', start: 'Якнайшвидше', channel: 'Дзвінок', name: 'Ім’я клієнта', phone: '+380 67 000 00 00' };
    step = 4;
    if (demo === 'errors') { a.name = ''; a.phone = '+380 67 12'; st.showAll = true; }
    if (demo === 'sending') st.sending = true;
    if (demo === 'fail') st.sendErr = true;
    if (demo === 'done') step = 5;
    if (demo === 'long') { step = 5; a.name = 'Олександра-Валентина Костянтинівна Олександренко-Великосвятська'; a.addr = 'Київ, Дарницький район, вулиця Бориса Гмирі, будинок 15-Б, корпус 3, під’їзд 2, склад у дворі за шлагбаумом'; }
  }

  var box = document.getElementById('wiz'), side = document.getElementById('steps'), live = document.getElementById('live');
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function typeName(v) { for (var i = 0; i < TYPES.length; i++) if (TYPES[i].v === v) return TYPES[i].t; return ''; }
  function s2() { return STEP2[a.type] || STEP2.object; }
  function digits(v) { return (v || '').replace(/\D/g, ''); }
  function say(t) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 50); }

  /* телефон: маска +380 XX XXX XX XX */
  function fmt(v) {
    var sub, m = /\+\s*3\s*8\s*0/.exec(v || '');
    if (m) sub = digits(v.slice(0, m.index) + v.slice(m.index + m[0].length)); // префікс +380 лишаємо, решта – номер
    else { sub = digits(v); if (sub.slice(0, 3) === '380') sub = sub.slice(3); else if (sub.slice(0, 2) === '38') sub = sub.slice(2); }
    if (sub[0] === '0') sub = sub.slice(1); // 067… → 67…
    sub = sub.slice(0, 9);
    var parts = [sub.slice(0, 2), sub.slice(2, 5), sub.slice(5, 7), sub.slice(7, 9)].filter(Boolean);
    return '+380 ' + parts.join(' ');
  }
  /* перевірка кроку 4: повертає текст помилки або '' */
  function errName() {
    var n = (a.name || '').trim();
    if (!n) return 'Вкажіть ім’я – так менеджер знатиме, як до вас звертатися';
    if (n.length < 2) return 'Ім’я – хоча б 2 літери';
    return '';
  }
  function errPhone() {
    var d = digits(a.phone);
    if (d.length <= 3) return 'Вкажіть телефон – на нього передзвонить менеджер';
    if (d.length < 12 || d.slice(0, 3) !== '380') return 'Номер неповний: після +380 потрібно 9 цифр';
    return '';
  }
  function ok(n) {
    if (n === 1) return !!a.type;
    if (n === 2) { var c = s2(); return !!a[c.k] && (!c.extra || !!a[c.extra.k]); }
    if (n === 3) return !!a.when && !!a.start;
    if (n === 4) return !errName() && !errPhone();
  }

  /* розмітка */
  var I_ERR = '<svg class="i" aria-hidden="true"><use href="#i-alert"/></svg>';
  function group(k, list, cls, label) {
    var cur = a[k], any = list.some(function (x) { return (x.v || x) === cur; });
    return list.map(function (x, i) {
      var v = x.v || x, on = cur === v, tab = on || (!any && i === 0) ? 0 : -1, dis = st.sending ? ' disabled' : '';
      if (cls === 'opt') return '<button type="button" class="opt" role="radio" aria-checked="' + on + '" tabindex="' + tab + '" data-k="' + k + '" data-v="' + esc(v) + '"' + dis + '><span class="dot" aria-hidden="true"></span><span class="opt-t">' + esc(x.t || v) + (x.s ? '<span class="opt-s">' + esc(x.s) + '</span>' : '') + '</span></button>';
      return '<button type="button" class="chip" role="radio" aria-checked="' + on + '" tabindex="' + tab + '" data-k="' + k + '" data-v="' + esc(v) + '"' + dis + '>' + esc(v) + '</button>';
    }).join('');
  }
  function opts(k, list, labelId) { return '<div class="opts" role="radiogroup" aria-labelledby="' + labelId + '">' + group(k, list, 'opt') + '</div>'; }
  function chips(k, list, label) { return '<p class="lbl" id="l-' + k + '">' + label + '</p><div class="chips" role="radiogroup" aria-labelledby="l-' + k + '">' + group(k, list, 'chip') + '</div>'; }
  function head(n, q) {
    var b = ''; for (var i = 1; i <= 4; i++) b += '<span class="' + (i <= n ? 'on' : '') + '"></span>';
    return '<div class="w-meta"><span>Крок ' + n + ' з 4</span><span>Без реєстрації</span></div><div class="w-bar" aria-hidden="true">' + b + '</div>' +
      '<h2 class="w-q" id="wq" tabindex="-1">' + q + '</h2>';
  }
  function foundNote() {
    if (!found) return '';
    return '<p class="w-found"><span>Ви шукали:</span> <b>«' + esc(found) + '»</b>' + (foundOk ? '' : '<span>– не впізнали, оберіть варіант</span>') + '</p>';
  }
  function nav(n) {
    var last = n === 4, can = last || ok(n);
    var back = n > 1 ? '<button type="button" class="btn btn-ghost" data-act="back" aria-label="Назад"' + (st.sending ? ' disabled' : '') + '><svg class="i" aria-hidden="true"><use href="#i-back"/></svg><span class="m-hide">Назад</span></button>' : '';
    var main;
    if (last && st.sending) main = '<button type="button" class="btn is-loading" disabled aria-disabled="true"><span class="spin" aria-hidden="true"></span>Надсилаємо…</button>';
    else main = '<button type="button" class="btn" data-act="' + (last ? 'send' : 'next') + '"' + (can ? '' : ' disabled aria-describedby="why"') + '>' + (last ? 'Надіслати заявку' : 'Далі') + '<svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></button>';
    return '<div class="w-nav">' + back + main + (can ? '' : '<p class="w-why" id="why">Оберіть варіант, щоб продовжити</p>') + '</div>';
  }
  function field(k, label, opt, type, extra) {
    var e = k === 'name' ? errName() : k === 'phone' ? errPhone() : '';
    var show = !!e && (st.showAll || st.touched[k]);
    var id = 'f-' + k, help = k === 'phone' ? '<p class="help" id="h-phone">Мобільний або міський, у форматі +380</p>' : '';
    return '<div class="fld"><label for="' + id + '">' + label + (opt ? ' <i>– необов’язково</i>' : '') + '</label>' +
      '<input id="' + id + '" ' + extra + ' data-in="' + k + '" value="' + esc(a[k] || (k === 'phone' ? '+380 ' : '')) + '"' +
      (show ? ' aria-invalid="true"' : '') + ' aria-describedby="' + (help ? 'h-phone ' : '') + 'e-' + k + '"' + (st.sending ? ' disabled' : '') + '>' + help +
      '<p class="err" id="e-' + k + '"' + (show ? '' : ' hidden') + '>' + I_ERR + '<span>' + esc(e) + '</span></p></div>';
  }

  function renderSide() {
    var c = s2(), rows = [
      ['Що охороняти', typeName(a.type)],
      [a.type ? c.side : 'Об’єкт чи подія', [a[c.k], c.extra && a[c.extra.k] ? a[c.extra.k] + ' гостей' : ''].filter(Boolean).join(', ')],
      ['Графік', [a.when, a.start].filter(Boolean).join(', ').toLowerCase().replace(/^./, function (x) { return x.toUpperCase(); })],
      ['Контакт', !errPhone() ? a.phone : '']
    ], h = '';
    rows.forEach(function (r, i) {
      var n = i + 1, cls = step > 4 || n < step ? 'done' : n === step ? 'now' : '';
      var go = cls === 'done' && step <= 4 && !st.sending;
      h += '<li class="' + cls + '"' + (cls === 'now' ? ' aria-current="step"' : '') + '><button type="button" ' + (go ? 'data-go="' + n + '" aria-label="Змінити: ' + r[0] + '"' : 'tabindex="-1" aria-disabled="true"') + '><small>Крок ' + n + (cls === 'done' ? ' · готово' : '') + '</small><b>' + r[0] + '</b>' + (cls === 'done' && r[1] ? '<em>' + esc(r[1]) + '</em>' : '') + '</button></li>';
    });
    side.innerHTML = h;
  }

  function render(focus) {
    var h = '';
    if (step === 1) {
      h = head(1, 'Що потрібно охороняти?') + foundNote() + opts('type', TYPES, 'wq') + nav(1);
    } else if (step === 2) {
      var c = s2();
      h = head(2, c.q) + foundNote() + opts(c.k, c.o, 'wq') + (c.extra ? chips(c.extra.k, c.extra.o, c.extra.l) : '') +
        (a.type === 'object' || a.type === 'event' ? field('addr', 'Адреса або район', true, 'text', 'type="text" maxlength="120" autocomplete="street-address" placeholder="Київ, район або вулиця"') : '') + nav(2);
    } else if (step === 3) {
      h = head(3, 'Коли потрібна охорона?') + opts('when', WHEN, 'wq') + chips('start', START, 'Коли почати') + nav(3);
    } else if (step === 4) {
      if (!a.channel) a.channel = 'Дзвінок';
      h = head(4, 'Як з вами зв’язатися?') + '<p class="w-sub">Менеджер передзвонить, уточнить деталі і назве ціну.</p>' +
        '<form id="contact" novalidate' + (st.sending ? ' aria-busy="true"' : '') + '>' +
        field('name', 'Ім’я', false, 'text', 'type="text" maxlength="60" autocomplete="name" placeholder="Як до вас звертатися"') +
        field('phone', 'Телефон', false, 'tel', 'type="tel" inputmode="tel" maxlength="17" autocomplete="tel"') +
        chips('channel', CH, 'Як зручніше відповісти') +
        '<p class="fine">Telegram і Viber – [уточнити], чи підключені. Надсилаючи заявку, ви погоджуєтеся на обробку даних для зв’язку – <a href="#">політика конфіденційності</a>.</p>' +
        (st.sendErr ? '<div class="alert" role="alert" tabindex="-1" id="send-err"><h3><svg class="i" aria-hidden="true"><use href="#i-alert"/></svg>Не вдалося надіслати заявку</h3><p>Ваші відповіді збережені. Спробуйте ще раз або подзвоніть – оформимо заявку по телефону.</p>' +
          '<div class="acts"><button type="button" class="btn" data-act="send">Спробувати ще раз</button><a class="btn btn-ghost" href="tel:+380675495710"><svg class="i" aria-hidden="true"><use href="#i-phone"/></svg>Подзвонити</a></div></div>' : '') +
        '</form>' + (st.sendErr ? '' : nav(4));
    } else {
      var c2 = s2(), rows = [['Послуга', typeName(a.type)], [c2.side, [a[c2.k], a.guests && a.guests + ' гостей'].filter(Boolean).join(', ')], ['Адреса', a.addr || ''], ['Графік', a.when + ', ' + a.start.toLowerCase()], ['Ім’я', a.name], ['Зв’язок', a.channel + ' · ' + a.phone]];
      h = '<div class="done-mark" aria-hidden="true"><svg class="i"><use href="#i-check"/></svg></div><h2 class="w-q" id="wq" tabindex="-1">Заявку надіслано</h2><p class="w-sub">Менеджер зв’яжеться з вами [уточнити: протягом якого часу].</p><dl class="sum">' +
        rows.filter(function (r) { return r[0] !== 'Адреса' || r[1] || a.type === 'object' || a.type === 'event'; }).map(function (r) {
          return '<div><dt>' + r[0] + '</dt><dd' + (r[1] ? '' : ' class="empty"') + '>' + esc(r[1] || 'не вказано') + '</dd></div>';
        }).join('') + '</dl><p class="fine">Демо: заявка нікуди не відправляється.</p><div class="w-nav end"><a class="btn" href="index.html">На головну</a></div>';
    }
    box.innerHTML = h; renderSide();
    var wc = document.querySelector('.w-call'); if (wc) wc.hidden = step > 4 || st.sendErr;
    box.querySelectorAll('[role="radiogroup"]').forEach(function (g) { SV.roving(g, '[role="radio"]', pick); });
    if (focus) {
      var t = box.querySelector('#wq'); t && t.focus({ preventScroll: true });
      if (innerWidth < 900) box.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  }

  function refreshNext() {
    var b = box.querySelector('[data-act="next"]'); if (!b) return;
    var can = ok(step); b.disabled = !can;
    if (can) { b.removeAttribute('aria-describedby'); var w = box.querySelector('#why'); w && w.remove(); }
  }
  function pick(o) {
    var k = o.dataset.k;
    if (k === 'type' && a.type !== o.dataset.v) { delete a.place; delete a.who; delete a.ev; delete a.guests; }
    a[k] = o.dataset.v;
    o.parentNode.querySelectorAll('[data-k="' + k + '"]').forEach(function (x) { var on = x === o; x.setAttribute('aria-checked', on); x.tabIndex = on ? 0 : -1; });
    refreshNext(); renderSide();
  }
  function showErr(k) {
    var inp = box.querySelector('#f-' + k), p = box.querySelector('#e-' + k); if (!inp) return;
    var e = k === 'name' ? errName() : errPhone(), show = !!e && (st.showAll || st.touched[k]);
    p.hidden = !show; p.querySelector('span').textContent = e;
    if (show) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid');
  }
  function send() {
    st.showAll = true; showErr('name'); showErr('phone');
    var bad = errName() ? 'name' : errPhone() ? 'phone' : '';
    if (bad) {
      var n = (errName() ? 1 : 0) + (errPhone() ? 1 : 0);
      say(n > 1 ? 'Перевірте два поля: ім’я і телефон' : 'Перевірте поле: ' + (bad === 'name' ? 'ім’я' : 'телефон'));
      box.querySelector('#f-' + bad).focus(); return;
    }
    st.sending = true; st.sendErr = false; render(false); say('Надсилаємо заявку');
    setTimeout(function () {
      st.sending = false;
      if (st.failNext) { st.failNext = false; st.sendErr = true; render(false); var al = box.querySelector('#send-err'); al && al.focus(); return; }
      step = 5; render(true);
    }, SEND_MS);
  }
  if (demo === 'fail') st.failNext = false; // повтор після помилки – успішний
  if (P.get('fail') === '1') st.failNext = true; // ?fail=1 – перше надсилання завершиться помилкою

  box.addEventListener('click', function (e) {
    var o = e.target.closest('[data-k]');
    if (o && !o.disabled) { pick(o); return; }
    var act = e.target.closest('[data-act]');
    if (!act || act.disabled) return;
    if (act.dataset.act === 'back') { step--; render(true); }
    if (act.dataset.act === 'next' && ok(step)) { step++; render(true); }
    if (act.dataset.act === 'send') send();
  });
  box.addEventListener('submit', function (e) { e.preventDefault(); send(); });
  box.addEventListener('input', function (e) {
    var k = e.target.dataset.in; if (!k) return;
    if (k === 'phone') { var v = fmt(e.target.value); if (v !== e.target.value) { e.target.value = v; e.target.setSelectionRange(v.length, v.length); } }
    a[k] = e.target.value;
    if (k === 'name' || k === 'phone') { if (e.target.getAttribute('aria-invalid')) showErr(k); renderSide(); }
  });
  box.addEventListener('focusin', function (e) { // курсор – у кінець номера, після +380
    if (e.target.dataset && e.target.dataset.in === 'phone') { var t = e.target; setTimeout(function () { t.setSelectionRange(t.value.length, t.value.length); }, 0); }
  });
  box.addEventListener('focusout', function (e) {
    var k = e.target.dataset && e.target.dataset.in;
    if (k === 'name' || k === 'phone') {
      if (k === 'phone' && digits(a.phone).length <= 3 && !st.showAll) return; // не сваримося на порожнє, поки не натиснули «Надіслати»
      if (k === 'name' && !(a.name || '').trim() && !st.showAll) return;
      st.touched[k] = true; showErr(k);
    }
  });
  side.addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) { step = +b.dataset.go; render(true); } });

  render(false);
})();
