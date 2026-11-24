// Кейси (демо): мінісцени. Чат бота – клієнт пише, бот «друкує» 0,9 с і відповідає (діалог ~6 с, повтор);
// висота сцени фіксована, репліки притиснуті донизу, ще не показані сховані, зверху маска-затухання.
// Лендинг – курсор підводиться до кнопки, натискає, з'являється «+ заявка».
// Таймери біжать лише поки картка видима; поза екраном і при reduced-motion – повний діалог і «+ заявка».
function onView(el, cb, threshold) {
  new IntersectionObserver(([e]) => cb(e.isIntersecting), { threshold }).observe(el);
}

export function initCasesLive() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const chat = document.querySelector('[data-live="chat"]');
  if (chat) {
    const bubbles = [...chat.querySelectorAll('.bubble')]; const typing = chat.querySelector('.typing'); let t = [];
    const clear = () => { t.forEach(clearTimeout); t = []; };
    const showAll = () => { typing.classList.remove('show'); bubbles.forEach((b) => b.classList.add('show')); };
    let vis = false;
    function play() {
      if (!vis) return;
      bubbles.forEach((b) => b.classList.remove('show')); typing.classList.remove('show');
      // клієнт пише → бот «друкує» 0,9 с → відповідає (бот відповідає за секунди)
      let at = 400;
      bubbles.forEach((b) => {
        if (b.classList.contains('out')) {
          t.push(setTimeout(() => { chat.insertBefore(typing, b); typing.classList.add('show'); }, at)); at += 900;
          t.push(setTimeout(() => { typing.classList.remove('show'); b.classList.add('show'); }, at)); at += 900;
        } else { t.push(setTimeout(() => b.classList.add('show'), at)); at += 1100; }
      });
      t.push(setTimeout(play, at + 3500));
    }
    chat.classList.add('is-live');   // ховати ще не показані репліки можна лише з JS – без нього видно весь діалог
    showAll();
    if (!reduce) onView(chat, (v) => { vis = v; clear(); if (v) play(); else showAll(); }, 0.4);
  }

  const land = document.querySelector('[data-live="landing"]');
  if (land) {
    const cur = land.querySelector('.cursor'); const btn = land.querySelector('.mock-btn'); const chip = land.querySelector('.lead-chip');
    let lt = []; let lv = false;
    function playL() {
      if (!lv) return;
      const pr = land.querySelector('.browser-page').getBoundingClientRect(); const br = btn.getBoundingClientRect();
      cur.style.transition = 'none'; cur.style.left = '82%'; cur.style.top = '92%'; cur.style.opacity = 0; chip.classList.remove('show');
      void cur.offsetWidth; cur.style.transition = '';
      lt.push(setTimeout(() => { cur.style.opacity = 1; cur.style.left = `${br.left - pr.left + br.width * 0.6}px`; cur.style.top = `${br.top - pr.top + br.height * 0.55}px`; }, 300));
      lt.push(setTimeout(() => btn.classList.add('press'), 1300));
      lt.push(setTimeout(() => { btn.classList.remove('press'); chip.classList.add('show'); }, 1500));
      lt.push(setTimeout(() => { cur.style.opacity = 0; }, 2600));
      lt.push(setTimeout(playL, 5200));
    }
    chip.classList.add('show');
    if (!reduce) onView(land, (v) => { lv = v; lt.forEach(clearTimeout); lt = []; if (v) playL(); else { cur.style.opacity = 0; chip.classList.add('show'); } }, 0.4);
  }
}
