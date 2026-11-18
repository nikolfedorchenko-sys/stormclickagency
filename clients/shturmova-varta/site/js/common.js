/* Спільне для всіх сторінок: налаштування з config.js, аналітика-заглушка, мобільне меню, вкладки з клавіатури. Без бібліотек. */
(function () {
  /* ---------- мобільне меню ---------- */
  var menu = document.getElementById('mnav'), burger = document.querySelector('.burger');
  if (menu && burger) {
    var closeBtn = menu.querySelector('.mnav-close');
    function focusables() { return menu.querySelectorAll('a[href], button:not([disabled])'); }
    function open() {
      menu.hidden = false; document.body.classList.add('lock');
      burger.setAttribute('aria-expanded', 'true');
      closeBtn.focus();
    }
    function close(back) {
      menu.hidden = true; document.body.classList.remove('lock');
      burger.setAttribute('aria-expanded', 'false');
      if (back !== false) burger.focus();
    }
    burger.addEventListener('click', open);
    closeBtn.addEventListener('click', function () { close(); });
    menu.addEventListener('click', function (e) { var a = e.target.closest('a[href]'); if (a) close(false); });
    document.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') { // утримуємо фокус у меню
        var f = focusables(), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    addEventListener('resize', function () { if (!menu.hidden && innerWidth > 900) close(false); });
  }

  /* ---------- ролінговий фокус: стрілки ←→ (і ↑↓) у групі ---------- */
  function roving(group, sel, onPick) {
    group.addEventListener('keydown', function (e) {
      var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: 'first', End: 'last' };
      if (!(e.key in keys)) return;
      var items = Array.prototype.filter.call(group.querySelectorAll(sel), function (x) { return !x.disabled; });
      var i = items.indexOf(document.activeElement); if (i < 0) return;
      var k = keys[e.key], n = k === 'first' ? 0 : k === 'last' ? items.length - 1 : (i + k + items.length) % items.length;
      e.preventDefault(); items[n].focus(); onPick(items[n]);
    });
  }

  /* ---------- налаштування з config.js: тексти, яких поки немає ---------- */
  var C = window.SV_CONFIG || {};
  function setText(sel, v) { if (v) document.querySelectorAll(sel).forEach(function (el) { el.textContent = v; }); }
  setText('[data-cfg="hours"]', C.LINE_HOURS);
  setText('[data-cfg="callback"]', C.CALLBACK_TIME);
  if (C.LICENSE_URL) document.querySelectorAll('[data-cfg="license"]').forEach(function (a) { a.href = C.LICENSE_URL; a.rel = 'noopener'; });

  /* ---------- аналітика: лише передаємо події, якщо лічильник підключено (див. config.js) ---------- */
  function track(name, params) {
    params = params || {};
    try {
      if (typeof window.gtag === 'function') window.gtag('event', name, params);
      if (typeof window.fbq === 'function') {
        if (name === 'generate_lead') window.fbq('track', 'Lead', params);
        else if (name === 'click_call') window.fbq('track', 'Contact', params);
        else window.fbq('trackCustom', name, params);
      }
    } catch (e) { /* аналітика не повинна ламати сайт */ }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href');
    if (/^tel:/.test(h)) track('click_call', { place: a.className || 'link' });
    else if (/(^|\/)wizard\.html/.test(h)) track('click_wizard', { place: a.className || 'link', target: h });
  });

  window.SV = { roving: roving, track: track, config: C };
})();
