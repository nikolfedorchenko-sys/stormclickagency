/* Спільне для всіх сторінок: мобільне меню, вкладки з клавіатури. Без бібліотек. */
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
