import { PAINS } from './pricing.js';
import { t, getLang, onLangChange } from './i18n.js';

// Табло цін першого екрана. Сайт і CRM – з прайсу (pricing.js), Telegram-бот – з i18n (s2.*):
// у прайсі немає окремої позиції «Telegram-бот», лише конкретні боти.
const item = (id) => PAINS.flatMap((p) => p.items).find((it) => it.id === id);

const ROWS = {
  site: () => { const [name, , price, time] = item('site')[getLang()]; return { name, price, time }; },
  bot: () => ({ name: t('proof.bot'), price: t('s2.price'), time: t('s2.time') }),
  crm: () => { const [name, , price, time] = item('crm')[getLang()]; return { name, price, time }; },
};

// «від $150» -> <small>від</small> $150 (справжній пробіл між ними – для екранного диктора)
function setPrice(el, price) {
  const m = /^(від|from)\s+(.+)$/i.exec(price);
  if (!m) { el.textContent = price; return; }
  const small = document.createElement('small');
  small.textContent = m[1];
  el.replaceChildren(small, document.createTextNode(` ${m[2]}`));
}

export function initProof(root) {
  if (!root) return;
  const render = () => {
    root.querySelectorAll('[data-proof]').forEach((li) => {
      const row = ROWS[li.dataset.proof]?.();
      if (!row) return;
      li.querySelector('.p-name').textContent = row.name;
      setPrice(li.querySelector('.p-price'), row.price);
      li.querySelector('.p-time > span').textContent = row.time;
    });
  };
  render();
  onLangChange(render);
}
