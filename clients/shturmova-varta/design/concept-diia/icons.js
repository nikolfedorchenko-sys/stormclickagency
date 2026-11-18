/* Об'ємні «глиняні» іконки концепції D. Один SVG-спрайт, кольори – з CSS-змінних палітри
   (--ic-deep, --ic-mid, --ic-light, --ic-alt, --ic-alt-d, --ic-warm), тож іконки перефарбовуються разом із палітрою.
   Використання: <svg class="ic"><use href="#ic-building"/></svg> */
(function () {
  var s = function (v) { return 'style="stop-color:var(' + v + ')"'; };
  var sprite = '' +
  '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><defs>' +
    '<linearGradient id="g-deep" x1="0" y1="0" x2="1" y2="1"><stop offset="0" ' + s('--ic-mid') + '/><stop offset="1" ' + s('--ic-deep') + '/></linearGradient>' +
    '<linearGradient id="g-deep2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" ' + s('--ic-deep') + '/><stop offset="1" ' + s('--ic-deeper') + '/></linearGradient>' +
    '<linearGradient id="g-light" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:#fff"/><stop offset="1" ' + s('--ic-light') + '/></linearGradient>' +
    '<linearGradient id="g-alt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" ' + s('--ic-alt') + '/><stop offset="1" ' + s('--ic-alt-d') + '/></linearGradient>' +
    '<linearGradient id="g-warm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:#FFF1C9"/><stop offset="1" ' + s('--ic-warm') + '/></linearGradient>' +
    '<linearGradient id="g-skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:#FCE6D4"/><stop offset="1" style="stop-color:#E9B994"/></linearGradient>' +
    '<radialGradient id="g-gloss" cx=".3" cy=".25" r=".6"><stop offset="0" style="stop-color:#fff;stop-opacity:.75"/><stop offset="1" style="stop-color:#fff;stop-opacity:0"/></radialGradient>' +
    '<filter id="f-shadow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>' +

    /* Будівля – охорона об'єкта */
    '<symbol id="ic-building" viewBox="0 0 120 120">' +
      '<ellipse cx="62" cy="108" rx="40" ry="6" fill="#0B1838" opacity=".16" filter="url(#f-shadow)"/>' +
      '<path d="M78 30 L96 21 Q99 20 99 23 L99 92 Q99 95 96 97 L78 104 Z" fill="url(#g-deep2)"/>' +
      '<path d="M28 30 Q28 24 34 23 L72 21 Q78 21 78 27 L78 104 L34 104 Q28 104 28 98 Z" fill="url(#g-light)"/>' +
      '<path d="M28 30 Q28 24 34 23 L60 22 L40 104 L34 104 Q28 104 28 98 Z" fill="url(#g-gloss)" opacity=".7"/>' +
      '<g fill="url(#g-deep)">' +
        '<rect x="36" y="33" width="11" height="11" rx="3"/><rect x="53" y="33" width="11" height="11" rx="3"/>' +
        '<rect x="36" y="51" width="11" height="11" rx="3"/><rect x="53" y="51" width="11" height="11" rx="3"/>' +
        '<rect x="36" y="69" width="11" height="11" rx="3"/><rect x="53" y="69" width="11" height="11" rx="3" opacity=".45"/>' +
      '</g>' +
      '<rect x="44" y="88" width="18" height="16" rx="3" fill="url(#g-warm)"/>' +
      '<g fill="#fff" opacity=".35"><rect x="83" y="36" width="9" height="8" rx="2"/><rect x="83" y="54" width="9" height="8" rx="2"/><rect x="83" y="72" width="9" height="8" rx="2"/></g>' +
      '<circle cx="92" cy="90" r="17" fill="url(#g-alt)"/><circle cx="92" cy="90" r="17" fill="url(#g-gloss)" opacity=".6"/>' +
      '<path d="M84.5 90.5 L90 96 L100 84.5" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</symbol>' +

    /* Людина в окулярах з навушником – особиста охорона */
    '<symbol id="ic-person" viewBox="0 0 120 120">' +
      '<ellipse cx="60" cy="109" rx="38" ry="6" fill="#0B1838" opacity=".16" filter="url(#f-shadow)"/>' +
      '<path d="M22 106 Q22 74 46 68 L74 68 Q98 74 98 106 Z" fill="url(#g-deep)"/>' +
      '<path d="M50 68 L60 86 L70 68 Z" fill="#fff"/><path d="M57 72 L60 92 L63 72 L60 69 Z" fill="url(#g-deep2)"/>' +
      '<path d="M30 92 Q34 76 46 70 L42 80 Z" fill="#fff" opacity=".18"/>' +
      '<rect x="51" y="56" width="18" height="16" rx="6" fill="url(#g-skin)"/>' +
      '<circle cx="60" cy="40" r="22" fill="url(#g-skin)"/>' +
      '<path d="M38 38 Q38 16 60 16 Q82 16 82 36 Q74 27 60 28 Q46 28 38 38 Z" fill="#2A2522"/>' +
      '<rect x="40" y="38" width="17" height="10" rx="5" fill="#141824"/><rect x="63" y="38" width="17" height="10" rx="5" fill="#141824"/><rect x="55" y="40" width="10" height="3" rx="1.5" fill="#141824"/>' +
      '<rect x="43" y="40" width="6" height="3" rx="1.5" fill="#fff" opacity=".45"/><rect x="66" y="40" width="6" height="3" rx="1.5" fill="#fff" opacity=".45"/>' +
      '<circle cx="81" cy="46" r="3.5" fill="url(#g-alt)"/>' +
      '<path d="M81 49 Q86 58 80 66 Q76 71 79 76" fill="none" style="stroke:var(--ic-alt-d)" stroke-width="2" stroke-linecap="round"/>' +
    '</symbol>' +

    /* Журнал змін – планшет з відмітками */
    '<symbol id="ic-journal" viewBox="0 0 120 120">' +
      '<ellipse cx="60" cy="109" rx="36" ry="6" fill="#0B1838" opacity=".16" filter="url(#f-shadow)"/>' +
      '<rect x="24" y="18" width="72" height="88" rx="14" fill="url(#g-deep)"/>' +
      '<rect x="32" y="28" width="56" height="70" rx="8" fill="url(#g-light)"/>' +
      '<rect x="44" y="12" width="32" height="14" rx="6" fill="url(#g-warm)"/>' +
      '<g fill="url(#g-alt)"><circle cx="42" cy="44" r="5"/><circle cx="42" cy="62" r="5"/></g>' +
      '<g stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"><path d="M39.6 44 l1.8 1.8 l3.2 -3.4"/><path d="M39.6 62 l1.8 1.8 l3.2 -3.4"/></g>' +
      '<circle cx="42" cy="80" r="5" fill="none" style="stroke:var(--ic-mid)" stroke-width="2.2"/>' +
      '<g style="fill:var(--ic-mid)" opacity=".55"><rect x="52" y="41" width="28" height="6" rx="3"/><rect x="52" y="59" width="22" height="6" rx="3"/><rect x="52" y="77" width="26" height="6" rx="3"/></g>' +
    '</symbol>' +

    /* Договір з печаткою-галочкою */
    '<symbol id="ic-contract" viewBox="0 0 120 120">' +
      '<ellipse cx="60" cy="109" rx="36" ry="6" fill="#0B1838" opacity=".16" filter="url(#f-shadow)"/>' +
      '<g transform="rotate(-6 60 60)"><rect x="28" y="16" width="62" height="84" rx="10" fill="url(#g-light)"/>' +
      '<path d="M28 26 Q28 16 38 16 L66 16 L36 100 L38 100 Q28 100 28 90 Z" fill="url(#g-gloss)" opacity=".6"/>' +
      '<g style="fill:var(--ic-mid)" opacity=".5"><rect x="38" y="30" width="40" height="6" rx="3"/><rect x="38" y="42" width="32" height="5" rx="2.5"/><rect x="38" y="52" width="36" height="5" rx="2.5"/><rect x="38" y="62" width="24" height="5" rx="2.5"/></g></g>' +
      '<circle cx="80" cy="82" r="19" fill="url(#g-deep)"/><circle cx="80" cy="82" r="13" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-dasharray="3 3"/>' +
      '<path d="M73.5 82.5 L78.5 87.5 L87 77.5" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<g transform="rotate(38 40 84)"><rect x="18" y="80" width="44" height="9" rx="4.5" fill="url(#g-warm)"/><path d="M62 80 L72 84.5 L62 89 Z" fill="#2A2522"/></g>' +
    '</symbol>' +

    /* Рахунок і монети */
    '<symbol id="ic-invoice" viewBox="0 0 120 120">' +
      '<ellipse cx="60" cy="109" rx="38" ry="6" fill="#0B1838" opacity=".16" filter="url(#f-shadow)"/>' +
      '<path d="M26 22 Q26 14 34 14 L74 14 Q82 14 82 22 L82 98 L75 93 L68 98 L61 93 L54 98 L47 93 L40 98 L33 93 L26 98 Z" fill="url(#g-light)"/>' +
      '<g style="fill:var(--ic-mid)" opacity=".5"><rect x="35" y="28" width="30" height="6" rx="3"/><rect x="35" y="42" width="38" height="5" rx="2.5"/><rect x="35" y="52" width="26" height="5" rx="2.5"/></g>' +
      '<rect x="35" y="66" width="38" height="10" rx="5" fill="url(#g-alt)"/>' +
      '<g><ellipse cx="88" cy="96" rx="18" ry="7" fill="#C9962F"/><rect x="70" y="86" width="36" height="10" fill="#C9962F"/><ellipse cx="88" cy="86" rx="18" ry="7" fill="url(#g-warm)"/>' +
      '<ellipse cx="88" cy="80" rx="18" ry="7" fill="#C9962F"/><rect x="70" y="72" width="36" height="8" fill="#C9962F"/><ellipse cx="88" cy="72" rx="18" ry="7" fill="url(#g-warm)"/><ellipse cx="88" cy="72" rx="10" ry="3.6" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2"/></g>' +
    '</symbol>' +

    /* Ключ-картка і зчитувач – системи безпеки */
    '<symbol id="ic-keycard" viewBox="0 0 120 120">' +
      '<ellipse cx="60" cy="109" rx="38" ry="6" fill="#0B1838" opacity=".16" filter="url(#f-shadow)"/>' +
      '<rect x="62" y="14" width="34" height="62" rx="12" fill="url(#g-light)"/><rect x="70" y="24" width="18" height="30" rx="6" style="fill:var(--ic-light)"/>' +
      '<circle cx="79" cy="64" r="4.5" fill="url(#g-alt)"/>' +
      '<path d="M62 36 Q54 40 54 48" fill="none" style="stroke:var(--ic-mid)" stroke-width="2.5" stroke-linecap="round" opacity=".6"/><path d="M62 28 Q48 34 47 48" fill="none" style="stroke:var(--ic-mid)" stroke-width="2.5" stroke-linecap="round" opacity=".35"/>' +
      '<g transform="rotate(-18 46 74)"><rect x="16" y="54" width="62" height="42" rx="9" fill="url(#g-deep)"/><rect x="16" y="54" width="62" height="20" rx="9" fill="url(#g-gloss)" opacity=".35"/>' +
      '<rect x="25" y="64" width="15" height="12" rx="3" fill="url(#g-warm)"/><rect x="25" y="83" width="34" height="4" rx="2" fill="#fff" opacity=".45"/></g>' +
    '</symbol>' +

    /* Годинник з місяцем – графік і нічні зміни */
    '<symbol id="ic-clock" viewBox="0 0 120 120">' +
      '<ellipse cx="60" cy="109" rx="34" ry="6" fill="#0B1838" opacity=".16" filter="url(#f-shadow)"/>' +
      '<circle cx="58" cy="62" r="40" fill="url(#g-deep)"/><circle cx="58" cy="62" r="31" fill="url(#g-light)"/>' +
      '<circle cx="58" cy="62" r="31" fill="url(#g-gloss)" opacity=".5"/>' +
      '<g style="fill:var(--ic-mid)" opacity=".5"><rect x="56.5" y="35" width="3" height="7" rx="1.5"/><rect x="56.5" y="82" width="3" height="7" rx="1.5"/><rect x="31" y="60.5" width="7" height="3" rx="1.5"/><rect x="78" y="60.5" width="7" height="3" rx="1.5"/></g>' +
      '<path d="M58 62 L58 44" style="stroke:var(--ic-deep)" stroke-width="5" stroke-linecap="round"/><path d="M58 62 L72 70" style="stroke:var(--ic-alt-d)" stroke-width="5" stroke-linecap="round"/><circle cx="58" cy="62" r="5" style="fill:var(--ic-deep)"/>' +
      '<path d="M92 14 A16 16 0 1 0 106 38 A12 12 0 1 1 92 14 Z" fill="url(#g-warm)"/>' +
    '</symbol>' +

    /* Чат – звʼязок (без слухавки, щоб не нагадувати логотипи месенджерів) */
    '<symbol id="ic-chat" viewBox="0 0 120 120">' +
      '<ellipse cx="60" cy="109" rx="36" ry="6" fill="#0B1838" opacity=".16" filter="url(#f-shadow)"/>' +
      '<path d="M30 20 L90 20 Q102 20 102 32 L102 70 Q102 82 90 82 L52 82 L32 98 L34 82 L30 82 Q18 82 18 70 L18 32 Q18 20 30 20 Z" fill="url(#g-deep)"/>' +
      '<path d="M30 20 L80 20 L26 70 L20 70 Q18 66 18 60 L18 32 Q18 20 30 20 Z" fill="#fff" opacity=".18"/>' +
      '<g fill="#fff"><circle cx="42" cy="51" r="6"/><circle cx="60" cy="51" r="6"/><circle cx="78" cy="51" r="6"/></g>' +
      '<circle cx="94" cy="24" r="11" fill="url(#g-alt)"/>' +
    '</symbol>' +

    /* Велика галочка – успіх */
    '<symbol id="ic-done" viewBox="0 0 120 120">' +
      '<ellipse cx="60" cy="109" rx="34" ry="6" fill="#0B1838" opacity=".16" filter="url(#f-shadow)"/>' +
      '<circle cx="60" cy="58" r="42" fill="url(#g-alt)"/><circle cx="60" cy="58" r="42" fill="url(#g-gloss)" opacity=".6"/>' +
      '<path d="M41 59 L54 72 L80 44" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</symbol>' +

    /* Пульт / тривожна кнопка – послуги «незабаром» */
    '<symbol id="ic-alarm" viewBox="0 0 120 120">' +
      '<ellipse cx="60" cy="109" rx="36" ry="6" fill="#0B1838" opacity=".16" filter="url(#f-shadow)"/>' +
      '<rect x="22" y="56" width="76" height="44" rx="14" fill="url(#g-light)"/>' +
      '<ellipse cx="60" cy="62" rx="26" ry="9" style="fill:var(--ic-light)"/>' +
      '<path d="M36 60 Q36 30 60 30 Q84 30 84 60 Z" fill="url(#g-deep)"/><path d="M42 54 Q43 37 58 35" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5" stroke-linecap="round"/>' +
      '<g style="stroke:var(--ic-warm)" stroke-width="4" stroke-linecap="round"><path d="M60 12 L60 20"/><path d="M30 22 L35 28"/><path d="M90 22 L85 28"/></g>' +
    '</symbol>' +
  '</defs></svg>';
  var host = document.createElement('div');
  host.innerHTML = sprite;
  (document.body || document.documentElement).insertBefore(host.firstChild, (document.body || document.documentElement).firstChild);
})();
