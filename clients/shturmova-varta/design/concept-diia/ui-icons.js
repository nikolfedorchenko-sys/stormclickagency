/* Лінійні іконки інтерфейсу (2 px, заокруглені кінці). <svg class="i"><use href="#i-phone"/></svg> */
(function () {
  var p = {
    'i-phone': '<path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z"/>',
    'i-chat': '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" stroke-width="2.6"/>',
    'i-user': '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-5.5 8-5.5s6.5 1.5 8 5.5"/>',
    'i-plus': '<path d="M12 5v14M5 12h14"/>',
    'i-arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    'i-back': '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    'i-close': '<path d="M6 6l12 12M18 6L6 18"/>',
    'i-check': '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    'i-doc': '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h4"/>',
    'i-home': '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
    'i-chev': '<path d="M9 6l6 6-6 6"/>',
    'i-bell': '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    'i-download': '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    'i-send': '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>'
  };
  var out = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">';
  for (var k in p) out += '<symbol id="' + k + '" viewBox="0 0 24 24">' + p[k] + '</symbol>';
  out += '</svg>';
  var host = document.createElement('div');
  host.innerHTML = out;
  (document.body || document.documentElement).insertBefore(host.firstChild, (document.body || document.documentElement).firstChild);
})();
