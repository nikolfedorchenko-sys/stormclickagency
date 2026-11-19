/* Майстер заявки: одне питання на екран, 4 кроки + екран «надіслано». Без бібліотек.
   Параметри адреси (див. README):
     t = object | person | event | unsure   – що охороняти (відкриває крок 2)
     p = обʼєкт, w = кого, e = захід        – точне значення варіанта кроку 2
     q = текст із пошуку на головній        – розбираємо ключовими словами
   Надсилання – на SV_CONFIG.ENDPOINT (js/config.js). Якщо його немає – НЕ вдаємо успіх,
   а показуємо «Залишився один крок – подзвоніть» з усіма відповідями. */
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
  var C = window.SV_CONFIG || {};
  var TEL = 'tel:' + (C.PHONE || '+380675495710'), TEL_TXT = C.PHONE_DISPLAY || '+380 67 549 5710';
  var T0 = Date.now(); // антиспам: час відкриття майстра
  var TS = C.TURNSTILE_SITEKEY || '', tsToken = '', tsLoading = false; // Cloudflare Turnstile – лише якщо задано site key

  var a = {}, step = 1, found = '', foundOk = false;
  var st = { sending: false, sendErr: false, offline: false, touched: {}, showAll: false };
  var P = new URLSearchParams(location.search);
  if (P.get('t') && STEP2[P.get('t')]) a.type = P.get('t');
  if (P.get('p')) a.place = P.get('p');
  if (P.get('w')) a.who = P.get('w');
  if (P.get('e')) a.ev = P.get('e');
  // приймаємо з адреси лише відомі варіанти кроку 2 для обраного типу; невідоме – ігноруємо
  (function () {
    var c = a.type && STEP2[a.type];
    ['place', 'who', 'ev'].forEach(function (k) { if (a[k] && (!c || c.k !== k || c.o.indexOf(a[k]) < 0)) delete a[k]; });
    if (a.guests && (!c || !c.extra || c.extra.o.indexOf(a.guests) < 0)) delete a.guests;
  })();
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


  var box = document.getElementById('wiz'), side = document.getElementById('steps'), live = document.getElementById('live');
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function typeName(v) { for (var i = 0; i < TYPES.length; i++) if (TYPES[i].v === v) return TYPES[i].t; return ''; }
  function s2() { return STEP2[a.type] || STEP2.object; }
  function digits(v) { return (v || '').replace(/\D/g, ''); }
  function motion() { return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'; }
  function say(t) { live.textContent = ''; setTimeout(function () { live.textContent = t; }, 50); }

  /* телефон: маска +380 XX XXX XX XX (див. README, «Маска телефону»).
     У полі завжди «+380 » + до 9 цифр національного номера (N).
     core() – нормалізація довільного рядка: з початку прибираємо «380» (лише якщо після нього ще ≥ 9 цифр),
     потім «38», потім «0». Так «+380…», «380…», «+38 (0…)», «0…» і «67…» дають той самий номер. */
  var PFX = '+380 ';
  function core(v) {
    var d = digits(v);
    if (d.slice(0, 3) === '380' && d.length - 3 >= 9) d = d.slice(3);
    if (d.slice(0, 2) === '38') d = d.slice(2);
    if (d[0] === '0') d = d.slice(1);
    return d;
  }
  function show(n) { return PFX + [n.slice(0, 2), n.slice(2, 5), n.slice(5, 7), n.slice(7, 9)].filter(Boolean).join(' '); }
  function fmt(v) { return show(core(v).slice(0, 9)); }
  function natOf(v) { return digits(v.slice(PFX.length)).slice(0, 9); } // N з уже відформатованого поля
  function idxAt(v, pos) { return pos <= PFX.length ? 0 : digits(v.slice(PFX.length, pos)).length; } // позиція курсора → кількість цифр N перед нею
  function posOf(v, k) { // кількість цифр N → позиція курсора одразу після k-ї цифри
    if (k <= 0) return PFX.length;
    for (var i = PFX.length, c = 0; i < v.length; i++) if (/\d/.test(v[i]) && ++c === k) return i + 1;
    return v.length;
  }
  var pend = ''; // набрані в порожнє поле «3», «38», «380» чи «0» – ще не ясно, префікс це чи номер; не показуємо
  function isPend(c) { return c === '0' || c === '3' || c === '38' || c === '380'; }
  /* редагування: замінюємо цифри N у діапазоні [s, e) на вставлене; повертаємо нове значення і позицію курсора */
  function edit(v, s, e, text) {
    var n = natOf(v), ds = idxAt(v, s), de = idxAt(v, e), t = digits(text);
    var full = core(text);
    if (full.length >= 9) { pend = ''; n = full.slice(0, 9); return { v: show(n), k: 9 }; } // фрагмент сам є повним номером – замінює все поле
    var head = n.slice(0, ds), tail = n.slice(de);
    if (!head && !tail) { // поле фактично порожнє: розбираємо префікс разом з уже набраним «у запас»
      var c = pend + t;
      if (isPend(c)) { pend = c; return { v: PFX, k: 0 }; }
      pend = ''; t = core(c);
    } else pend = '';
    n = (head + t + tail).slice(0, 9);
    return { v: show(n), k: Math.min(head.length + t.length, n.length) };
  }
  /* перевірка кроку 4: повертає текст помилки або '' */
  function errName() {
    var n = (a.name || '').trim();
    if (!n) return 'Вкажіть ім’я – так менеджер знатиме, як до вас звертатися';
    if (!/\p{L}.*\p{L}/u.test(n)) return 'Ім’я – хоча б 2 літери';
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
    else if (last) main = '<button type="submit" class="btn">'; // у формі: Enter у полі теж надсилає
    else main = '<button type="button" class="btn" data-act="next"' + (can ? '' : ' disabled aria-describedby="why"') + '>';
    if (!(last && st.sending)) main += (last ? 'Надіслати заявку' : 'Далі') + '<svg class="i" aria-hidden="true"><use href="#i-arrow"/></svg></button>';
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

  /* підсумок відповідей: екран «надіслано», стан «не вдалося надіслати онлайн», лист і тіло заявки */
  function sumRows() {
    var c2 = s2(), rows = [['Послуга', typeName(a.type)], [c2.side, [a[c2.k], a.guests && a.guests + ' гостей'].filter(Boolean).join(', ')], ['Адреса', a.addr || ''], ['Графік', a.when + ', ' + a.start.toLowerCase()], ['Ім’я', a.name], ['Зв’язок', a.channel + ' · ' + a.phone]];
    return rows.filter(function (r) { return r[0] !== 'Адреса' || r[1] || a.type === 'object' || a.type === 'event'; })
      .map(function (r) { return [r[0], (r[1] || '').trim()]; });
  }
  function sumList() {
    return '<dl class="sum">' + sumRows().map(function (r) {
      return '<div><dt>' + r[0] + '</dt><dd' + (r[1] ? '' : ' class="empty"') + '>' + esc(r[1] || 'не вказано') + '</dd></div>';
    }).join('') + '</dl>';
  }
  function sumText() { return sumRows().map(function (r) { return r[0] + ': ' + (r[1] || 'не вказано'); }).join('\n'); }
  function mailto() {
    return 'mailto:' + C.EMAIL + '?subject=' + encodeURIComponent('Заявка з сайту – Штурмова варта') + '&body=' + encodeURIComponent(sumText() + '\n');
  }
  var lastStep = 0;

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
      h = head(4, 'Як з вами зв’язатися?') + '<p class="w-sub">Менеджер зв’яжеться з вами, уточнить деталі і назве ціну.</p>' +
        '<form id="contact" novalidate' + (st.sending ? ' aria-busy="true"' : '') + '>' +
        field('name', 'Ім’я', false, 'text', 'type="text" maxlength="60" autocomplete="name" placeholder="Як до вас звертатися"') +
        field('phone', 'Телефон', false, 'tel', 'type="tel" inputmode="tel" autocomplete="tel"') +
        chips('channel', CH, 'Як зручніше відповісти') +
        (TS ? '<div class="ts" id="ts"></div>' : '') +
        // антиспам-пастка: людина поля не бачить і не заповнює, бот – заповнює
        // назва і підпис нейтральні, autocomplete="new-password" – щоб браузер не автозаповнив пастку в людей
        '<div class="hp" aria-hidden="true"><label for="f-hp">Не заповнюйте це поле</label><input id="f-hp" name="hp_url" type="text" tabindex="-1" autocomplete="new-password"></div>' +
        '<p class="fine">Надсилаючи заявку, ви погоджуєтеся, що ТОВ «Охоронна компанія „Штурмова варта“» обробить ваші ім’я, телефон, адресу (якщо вказали), відповіді на питання майстра та службові дані про джерело переходу, щоб зв’язатися з вами щодо заявки. <a href="privacy.html">Політика конфіденційності [уточнити]</a></p>' +
        (C.TELEGRAM_URL || C.VIBER_URL ? '' : '<p class="fine">Telegram і Viber – [уточнити], чи підключені.</p>') +
        (st.sendErr ? '<div class="alert" role="alert" tabindex="-1" id="send-err"><h3><svg class="i" aria-hidden="true"><use href="#i-alert"/></svg>Не вдалося надіслати заявку</h3><p>Ваші відповіді збережені. Спробуйте ще раз або подзвоніть – оформимо заявку телефоном.</p>' +
          '<div class="acts"><button type="submit" class="btn">Спробувати ще раз</button><a class="btn btn-ghost" href="' + TEL + '"><svg class="i" aria-hidden="true"><use href="#i-phone"/></svg>Подзвонити</a></div></div>' : '') +
        (st.sendErr ? '' : nav(4)) + '</form>';
    } else if (st.offline) {
      // заявка НЕ надіслана (немає ENDPOINT або спрацював антиспам): це не помилка клієнта, а наступний крок –
      // нейтральний знак телефону, номер і всі відповіді, які треба назвати менеджеру
      var alt = '';
      if (C.EMAIL) alt += '<a class="btn btn-ghost" href="' + esc(mailto()) + '">Надіслати e-mail</a>';
      if (C.TELEGRAM_URL) alt += '<a class="btn btn-ghost" href="' + esc(C.TELEGRAM_URL) + '" rel="noopener">Telegram</a>';
      if (C.VIBER_URL) alt += '<a class="btn btn-ghost" href="' + esc(C.VIBER_URL) + '" rel="noopener">Viber</a>';
      h = '<div class="done-mark call" aria-hidden="true"><svg class="i"><use href="#i-phone"/></svg></div>' +
        '<h2 class="w-q" id="wq" tabindex="-1">Залишився один крок – подзвоніть</h2>' +
        '<p class="w-sub">Заявку приймемо телефоном: наберіть <a class="w-tel" href="' + TEL + '">' + TEL_TXT + '</a>' + (C.EMAIL ? ' або надішліть відповіді e-mail' : '') + ' і назвіть менеджеру відповіді нижче. Графік роботи лінії – ' + esc(C.LINE_HOURS || '[уточнити]') + '.</p>' +
        '<div class="w-nav w-off"><a class="btn" href="' + TEL + '"><svg class="i" aria-hidden="true"><use href="#i-phone"/></svg>Подзвонити</a>' + alt + '</div>' +
        '<h3 class="sum-h">Ваші відповіді</h3>' + sumList() +
        '<div class="w-nav end"><button type="button" class="btn btn-ghost" data-act="edit"><svg class="i" aria-hidden="true"><use href="#i-back"/></svg>Змінити відповіді</button></div>';
    } else {
      h = '<div class="done-mark" aria-hidden="true"><svg class="i"><use href="#i-check"/></svg></div><h2 class="w-q" id="wq" tabindex="-1">Заявку надіслано</h2><p class="w-sub">Менеджер зв’яжеться з вами ' + esc(C.CALLBACK_TIME || '[уточнити: протягом якого часу]') + '.</p>' +
        sumList() + '<div class="w-nav end"><a class="btn" href="index.html">На головну</a></div>';
    }
    box.innerHTML = h; pend = ''; renderSide();
    if (TS && step === 4 && !st.sending) tsMount();
    var wc = document.querySelector('.w-call'); if (wc) wc.hidden = step > 4 || st.sendErr;
    if (step <= 4 && step !== lastStep) { lastStep = step; SV.track('wizard_step', { step: step }); }
    box.querySelectorAll('[role="radiogroup"]').forEach(function (g) { SV.roving(g, '[role="radio"]', pick); });
    if (focus) {
      var t = box.querySelector('#wq'); t && t.focus({ preventScroll: true });
      // мобільний – завжди до початку кроку; десктоп – лише якщо початок кроку чи результату вище краю екрана
      if (innerWidth < 900 || box.getBoundingClientRect().top < 0) box.scrollIntoView({ block: 'start', behavior: motion() });
    }
  }

  /* Turnstile: скрипт Cloudflare вантажимо лише на кроці 4 і лише з TURNSTILE_SITEKEY. Віджет перемальовується разом
     з кроком, тож кожна спроба надсилання має свіжий одноразовий токен. Немає токена – приймач відповість 403,
     сайт покаже «Не вдалося надіслати заявку» з повтором і «Подзвонити». */
  function tsMount() {
    var el = box.querySelector('#ts'); if (!el) return;
    if (!window.turnstile) {
      if (!tsLoading) {
        tsLoading = true;
        var sc = document.createElement('script'); sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; sc.async = true;
        sc.onload = function () { if (step === 4 && !st.sending) tsMount(); };
        sc.onerror = function () { tsLoading = false; sc.remove(); }; // не завантажився – спробуємо на наступному показі кроку 4
        document.head.appendChild(sc);
      }
      return;
    }
    tsToken = '';
    try {
      window.turnstile.render(el, { sitekey: TS, size: 'flexible', appearance: 'interaction-only', language: 'uk',
        callback: function (t) { tsToken = t; }, 'expired-callback': function () { tsToken = ''; }, 'error-callback': function () { tsToken = ''; } });
    } catch (e) { /* без токена приймач відмовить – клієнт побачить «Подзвонити» */ }
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
    if (st.sending) return;
    st.showAll = true; showErr('name'); showErr('phone');
    var bad = errName() ? 'name' : errPhone() ? 'phone' : '';
    if (bad) {
      var n = (errName() ? 1 : 0) + (errPhone() ? 1 : 0);
      say(n > 1 ? 'Перевірте два поля: ім’я і телефон' : 'Перевірте поле: ' + (bad === 'name' ? 'ім’я' : 'телефон'));
      box.querySelector('#f-' + bad).focus(); return;
    }
    var hp = box.querySelector('#f-hp'), bot = !!(hp && hp.value) || Date.now() - T0 < (C.MIN_FILL_MS || 0);
    SV.track('lead_submit', { service: a.type });
    // немає куди надсилати або схоже на бота – нічого не відправляємо і НЕ показуємо «надіслано»
    if (!C.ENDPOINT || bot) { SV.track('lead_offline', { reason: !C.ENDPOINT ? 'no_endpoint' : 'antispam' }); offline(); return; }
    st.sending = true; st.sendErr = false; render(false); say('Надсилаємо заявку');
    post(payload()).then(function () {
      st.sending = false; step = 5; render(true); SV.track('generate_lead', { service: a.type });
    }, function () {
      st.sending = false; st.sendErr = true; render(false); SV.track('lead_error', { service: a.type });
      var al = box.querySelector('#send-err'); if (!al) return;
      al.focus({ preventScroll: true });
      var r = al.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) al.scrollIntoView({ block: 'center', behavior: motion() });
    });
  }
  function offline() { st.offline = true; st.sendErr = false; step = 5; render(true); }
  function payload() {
    var c = s2(), u = new URLSearchParams(location.search), d = {
      service: typeName(a.type), service_code: a.type, details: a[c.k] || '', guests: a.guests || '', address: (a.addr || '').trim(),
      schedule: a.when, start: a.start, name: (a.name || '').trim(), phone: '+' + digits(a.phone), channel: a.channel,
      search: found, message: sumText(), page: location.href.split('#')[0], referrer: document.referrer,
      elapsed_ms: Date.now() - T0, hp_url: '' // hp_url – антиспам-поле, приймач відкидає заявки, де воно не порожнє
    };
    if (TS) d.cf_turnstile = tsToken;
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(function (k) { if (u.get(k)) d[k] = u.get(k).slice(0, 200); });
    return d;
  }
  function post(d) {
    var ctl = 'AbortController' in window ? new AbortController() : null, tm = ctl && setTimeout(function () { ctl.abort(); }, C.TIMEOUT_MS || 15000);
    var form = C.ENDPOINT_FORMAT === 'form';
    return fetch(C.ENDPOINT, {
      method: 'POST', signal: ctl ? ctl.signal : undefined,
      headers: { 'Accept': 'application/json', 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' },
      body: form ? new URLSearchParams(d).toString() : JSON.stringify(d)
    }).then(function (r) { clearTimeout(tm); if (!r.ok) throw new Error('HTTP ' + r.status); return r; },
      function (e) { clearTimeout(tm); throw e; });
  }

  box.addEventListener('click', function (e) {
    var o = e.target.closest('[data-k]');
    if (o && !o.disabled) { pick(o); return; }
    var act = e.target.closest('[data-act]');
    if (!act || act.disabled) return;
    if (act.dataset.act === 'back') { step--; render(true); }
    if (act.dataset.act === 'next' && ok(step)) { step++; render(true); }
    if (act.dataset.act === 'edit') { st.offline = false; step = 4; render(true); }
  });
  box.addEventListener('submit', function (e) { e.preventDefault(); send(); });
  function changed(k, el) {
    a[k] = el.value;
    if (k === 'name' || k === 'phone') { if (el.getAttribute('aria-invalid')) showErr(k); renderSide(); }
  }
  /* телефон: набір, вставку і видалення обробляємо самі (beforeinput), щоб курсор лишався на місці
     за кількістю цифр перед ним. Усе інше (автозаповнення, перетягування, IME) – запасний шлях через fmt() в input. */
  box.addEventListener('beforeinput', function (e) {
    var el = e.target; if (!el.dataset || el.dataset.in !== 'phone' || !e.cancelable) return;
    var v = el.value, s = el.selectionStart, en = el.selectionEnd, it = e.inputType, r;
    if (it === 'insertText' || it === 'insertFromPaste' || it === 'insertReplacementText') {
      var text = e.data != null ? e.data : (e.dataTransfer ? e.dataTransfer.getData('text/plain') : '');
      r = edit(v, s, en, text || '');
    } else if (it === 'deleteContentBackward' || it === 'deleteContentForward') {
      if (s === en) {
        var k = idxAt(v, s);
        if (it === 'deleteContentBackward') { if (k === 0) { pend = pend.slice(0, -1); e.preventDefault(); return; } s = posOf(v, k - 1); en = posOf(v, k); }
        else { if (k >= natOf(v).length) { e.preventDefault(); return; } en = posOf(v, k + 1); s = posOf(v, k); }
      }
      pend = ''; r = edit(v, s, en, '');
      if (r.v === PFX) pend = '';
    } else return;
    e.preventDefault();
    el.value = r.v; var p = posOf(r.v, r.k); el.setSelectionRange(p, p);
    changed('phone', el);
  });
  box.addEventListener('input', function (e) {
    var k = e.target.dataset.in; if (!k) return;
    if (k === 'phone') { var v = fmt(e.target.value); if (v !== e.target.value) { pend = ''; e.target.value = v; e.target.setSelectionRange(v.length, v.length); } }
    changed(k, e.target);
  });
  // курсор у префіксі «+380 » (фокус чи клік) – переносимо в кінець; виділення (Tab у заповнене поле) не чіпаємо
  function caretOut(t) { if (document.activeElement === t && t.selectionStart === t.selectionEnd && t.selectionStart < PFX.length) t.setSelectionRange(t.value.length, t.value.length); }
  box.addEventListener('focusin', function (e) { var t = e.target; if (t.dataset && t.dataset.in === 'phone') setTimeout(function () { caretOut(t); }, 0); });
  box.addEventListener('mouseup', function (e) { var t = e.target; if (t.dataset && t.dataset.in === 'phone') setTimeout(function () { caretOut(t); }, 0); });
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
