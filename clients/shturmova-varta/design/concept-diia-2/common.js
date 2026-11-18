/* Спільне для всіх сторінок: тема, мобільне меню, вкладки з клавіатури. Без бібліотек. */
(function () {
  var root = document.documentElement;

  /* ---------- тема: light | dark | auto (як у системі) ---------- */
  function stored() { try { return localStorage.getItem('sv-theme'); } catch (e) { return null; } }
  function current() { return root.getAttribute('data-theme') || 'auto'; }
  function apply(v) {
    if (v === 'light' || v === 'dark') root.setAttribute('data-theme', v); else root.removeAttribute('data-theme');
    try { if (v === 'auto') localStorage.removeItem('sv-theme'); else localStorage.setItem('sv-theme', v); } catch (e) {}
    mark();
  }
  function mark() {
    var v = current();
    document.querySelectorAll('[data-theme-set]').forEach(function (b) {
      var on = b.dataset.themeSet === v;
      b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1;
    });
  }
  document.querySelectorAll('[data-theme-set]').forEach(function (b) {
    b.addEventListener('click', function () { apply(b.dataset.themeSet); });
  });
  document.querySelectorAll('.theme-g').forEach(function (g) { roving(g, '[role="radio"]', function (b) { apply(b.dataset.themeSet); }); });
  mark();

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
    if (/[?&]menu=open/.test(location.search)) open();
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
  window.SV = { roving: roving };
})();
