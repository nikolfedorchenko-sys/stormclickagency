/* Майстер заявки «одне питання на екран». Простий JS без бібліотек.
   <div class="wiz" data-start="1"></div>  – інтерактивний, з першого кроку
   <div class="wiz" data-start="3" data-preset='{"type":"object","place":"Склад чи виробництво"}' data-static></div> – статичний кадр */
(function () {
  var Q = {
    type: { title: 'Що потрібно охороняти?', options: [
      { v: 'object', t: 'Обʼєкт', s: 'Офіс, склад, дім', ic: 'ic-building' },
      { v: 'person', t: 'Людину', s: 'Особиста охорона', ic: 'ic-person' }
    ], extra: 'Ще не знаю – порадьте' },
    place: { title: 'Який це обʼєкт?', options: ['Офіс або бізнес-центр', 'Склад чи виробництво', 'Магазин або ТЦ', 'Приватний будинок', 'Інше'] },
    who: { title: 'Кого охороняємо?', options: ['Мене особисто', 'Мою родину', 'Гостей чи партнерів', 'Учасників події'] },
    when: { title: 'Коли потрібна охорона?', options: ['Цілодобово', 'Лише вночі', 'Лише вдень', 'Разово, на подію'],
      start: ['Якнайшвидше', 'Цього тижня', 'Пізніше'] }
  };
  var TOTAL = 4;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function head(step, back) {
    var bars = '';
    for (var i = 1; i <= TOTAL; i++) bars += '<span class="' + (i < step ? 'done' : i === step ? 'now' : '') + '"></span>';
    return '<div class="w-top">' +
      (back ? '<button class="w-icon" type="button" data-act="back" aria-label="Назад"><svg class="i"><use href="#i-back"/></svg></button>' : '<span class="w-icon w-ghost"></span>') +
      '<span class="w-step">Крок ' + step + ' з ' + TOTAL + '</span>' +
      '<button class="w-icon" type="button" data-act="close" aria-label="Закрити"><svg class="i"><use href="#i-close"/></svg></button></div>' +
      '<div class="progress" aria-hidden="true">' + bars + '</div>';
  }

  function callFoot() {
    return '<div class="w-foot"><p class="w-hint">4 питання · без реєстрації</p><a class="btn btn-secondary btn-block" href="tel:+380675495710"><svg class="i"><use href="#i-phone"/></svg>Або подзвонити</a></div>';
  }

  function render(el) {
    var st = el._st, a = st.ans, h = '';
    if (st.step === 1) {
      h += head(1, false) + '<h3 class="w-q">' + Q.type.title + '</h3><div class="w-tiles" role="radiogroup">';
      Q.type.options.forEach(function (o) {
        h += '<button type="button" class="tile" role="radio" aria-checked="' + (a.type === o.v) + '" data-k="type" data-v="' + o.v + '">' +
          '<svg class="ic"><use href="#' + o.ic + '"/></svg><span class="tile-title">' + o.t + '</span><span class="tile-sub">' + o.s + '</span></button>';
      });
      h += '</div><button type="button" class="w-row" data-k="type" data-v="unsure" aria-checked="' + (a.type === 'unsure') + '">' + Q.type.extra + '<svg class="i"><use href="#i-chev"/></svg></button>' + callFoot();
    } else if (st.step === 2) {
      var q = a.type === 'person' ? Q.who : Q.place, k = a.type === 'person' ? 'who' : 'place';
      if (a.type === 'unsure') { q = { title: 'Що найближче до вашої ситуації?', options: ['Бізнес: офіс, склад, магазин', 'Дім чи ділянка', 'Безпека людини', 'Подія чи захід'] }; k = 'place'; }
      h += head(2, true) + '<h3 class="w-q">' + q.title + '</h3><div class="w-list" role="radiogroup">';
      q.options.forEach(function (o) {
        h += '<button type="button" class="w-row" role="radio" aria-checked="' + (a[k] === o) + '" data-k="' + k + '" data-v="' + esc(o) + '">' + esc(o) + '<span class="w-radio"></span></button>';
      });
      h += '</div>' + callFoot();
    } else if (st.step === 3) {
      h += head(3, true) + '<h3 class="w-q">' + Q.when.title + '</h3><div class="w-grid" role="radiogroup">';
      Q.when.options.forEach(function (o) {
        h += '<button type="button" class="w-cell" role="radio" aria-checked="' + (a.when === o) + '" data-k="when" data-v="' + esc(o) + '" data-stay>' + esc(o) + '</button>';
      });
      h += '</div><p class="w-label">Коли почати</p><div class="w-chips" role="radiogroup">';
      Q.when.start.forEach(function (o) {
        h += '<button type="button" class="w-chip" role="radio" aria-checked="' + (a.start === o) + '" data-k="start" data-v="' + esc(o) + '" data-stay>' + esc(o) + '</button>';
      });
      h += '</div><div class="w-foot"><button type="button" class="btn btn-primary btn-block" data-act="next"' + (a.when && a.start ? '' : ' disabled') + '>Далі <svg class="i"><use href="#i-arrow"/></svg></button></div>';
    } else if (st.step === 4) {
      var ok = (a.name || '').trim().length > 1 && (a.phone || '').replace(/\D/g, '').length >= 12;
      h += head(4, true) + '<h3 class="w-q">Як з вами звʼязатися?</h3>' +
        '<label class="w-field"><span>Імʼя</span><input type="text" autocomplete="name" data-in="name" value="' + esc(a.name || '') + '" placeholder="Як до вас звертатися"></label>' +
        '<label class="w-field"><span>Телефон</span><input type="tel" inputmode="tel" autocomplete="tel" data-in="phone" value="' + esc(a.phone || '+380 ') + '"></label>' +
        '<p class="w-label">Зручніше відповісти</p><div class="w-chips" role="radiogroup">';
      ['Дзвінок', 'Telegram', 'Viber'].forEach(function (o) {
        h += '<button type="button" class="w-chip" role="radio" aria-checked="' + ((a.channel || 'Дзвінок') === o) + '" data-k="channel" data-v="' + o + '" data-stay>' + o + '</button>';
      });
      h += '</div><p class="w-fine">Месенджери – [уточнити], чи підключені. Надсилаючи, ви погоджуєтесь на обробку даних для звʼязку.</p>' +
        '<div class="w-foot"><button type="button" class="btn btn-primary btn-block" data-act="send"' + (ok ? '' : ' disabled') + '>Надіслати заявку <svg class="i"><use href="#i-send"/></svg></button></div>';
    } else {
      var sum = [
        ['Послуга', a.type === 'person' ? 'Особиста охорона' : a.type === 'unsure' ? 'Потрібна порада' : 'Охорона обʼєкта'],
        [a.type === 'person' ? 'Кого' : 'Обʼєкт', a.who || a.place || '–'],
        ['Графік', (a.when || '–') + (a.start ? ', ' + a.start.toLowerCase() : '')],
        ['Звʼязок', (a.channel || 'Дзвінок') + (a.phone ? ' · ' + a.phone : '')]
      ];
      h += '<div class="w-done"><svg class="ic"><use href="#ic-done"/></svg><h3 class="w-q">Заявку надіслано</h3>' +
        '<p class="w-sub">Менеджер звʼяжеться з вами [уточнити: протягом якого часу].</p><dl class="w-sum">';
      sum.forEach(function (r) { h += '<div><dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd></div>'; });
      h += '</dl><div class="w-foot"><button type="button" class="btn btn-secondary btn-block" data-act="restart">Почати спочатку</button></div></div>';
    }
    el.innerHTML = h;
  }

  function next(el) { var st = el._st; st.step = Math.min(5, st.step + 1); render(el); }

  function init(el) {
    var preset = {};
    try { preset = JSON.parse(el.getAttribute('data-preset') || '{}'); } catch (e) {}
    el._st = { step: +el.getAttribute('data-start') || 1, ans: preset };
    render(el);
    if (el.hasAttribute('data-static')) { el.setAttribute('inert', ''); return; }

    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !el.contains(b)) return;
      var st = el._st, act = b.getAttribute('data-act');
      if (act === 'back') { st.step = Math.max(1, st.step - 1); return render(el); }
      if (act === 'close' || act === 'restart') { st.step = 1; st.ans = {}; return render(el); }
      if (act === 'next') return next(el);
      if (act === 'send') { st.step = 5; return render(el); }
      var k = b.getAttribute('data-k');
      if (!k) return;
      st.ans[k] = b.getAttribute('data-v');
      if (k === 'type') { delete st.ans.place; delete st.ans.who; }
      if (b.hasAttribute('data-stay')) {
        render(el);
      } else {
        render(el);
        setTimeout(function () { next(el); }, 260); // один дотик – і наступне питання
      }
    });
    el.addEventListener('input', function (e) {
      var k = e.target.getAttribute('data-in'); if (!k) return;
      el._st.ans[k] = e.target.value;
      var a = el._st.ans, ok = (a.name || '').trim().length > 1 && (a.phone || '').replace(/\D/g, '').length >= 12;
      var s = el.querySelector('[data-act="send"]'); if (s) s.disabled = !ok;
    });
  }

  document.querySelectorAll('.wiz').forEach(init);
})();
