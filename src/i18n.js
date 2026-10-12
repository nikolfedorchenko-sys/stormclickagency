const DICT = {
  uk: {
    'meta.title': 'StormClick – digital-агенція повного циклу',
    'meta.description': 'Сайти, реклама, автоматизація, SMM і брендинг. Від логотипу до заявок.',
    'preloader.label': 'Заряджаємо шторм',
    'cta.discuss': 'Обговорити проєкт',
    'hero.badge': 'Digital-агенція · Україна · Європа · США',
    'hero.title1': 'Від логотипу',
    'hero.title2': 'до заявок',
    'hero.subtitle': 'Сайти, реклама, автоматизація і брендинг. Одна команда веде вашого клієнта від першого кліку до заявки.',
    'hero.scroll': 'Гортайте, щоб зібрати шторм',
    'stage2.eyebrow': 'Удар блискавки = клік',
    'stage2.title': 'Один удар. Точно в ціль.',
    'stage3.title': '5 напрямків. Одна система.',
    'service.ads': 'Реклама і трафік',
    'service.web': 'Сайти і розробка',
    'service.automation': 'Telegram і автоматизація',
    'service.smm': 'SMM і контент',
    'service.branding': 'Брендинг і дизайн',
    'next.note': 'Концепт першого екрана. Далі тут буде блок послуг.',
  },
  en: {
    'meta.title': 'StormClick – full-cycle digital agency',
    'meta.description': 'Websites, ads, automation, SMM and branding. From logo to leads.',
    'preloader.label': 'Charging the storm',
    'cta.discuss': 'Discuss a project',
    'hero.badge': 'Digital agency · Ukraine · Europe · USA',
    'hero.title1': 'From logo',
    'hero.title2': 'to leads',
    'hero.subtitle': 'Websites, ads, automation and branding. One team takes your customer from the first click to a request.',
    'hero.scroll': 'Scroll to build the storm',
    'stage2.eyebrow': 'Lightning strike = click',
    'stage2.title': 'One strike. Right on target.',
    'stage3.title': '5 disciplines. One system.',
    'service.ads': 'Ads & traffic',
    'service.web': 'Websites & development',
    'service.automation': 'Telegram & automation',
    'service.smm': 'SMM & content',
    'service.branding': 'Branding & design',
    'next.note': 'First screen concept. The services section comes next.',
  },
};

const LANGS = Object.keys(DICT);
let lang = detect();

function detect() {
  // ?lang=en має пріоритет – зручно для окремих рекламних кампаній
  const param = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(param)) return param;
  try {
    const saved = localStorage.getItem('lang');
    if (LANGS.includes(saved)) return saved;
  } catch (e) { /* сховище недоступне */ }
  return (navigator.language || '').toLowerCase().startsWith('uk') ? 'uk' : 'en';
}

export const t = (key) => DICT[lang][key] ?? DICT.uk[key] ?? key;

function apply() {
  document.documentElement.lang = lang;
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}

export function initI18n() {
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
    lang = b.dataset.lang;
    try { localStorage.setItem('lang', lang); } catch (e) { /* сховище недоступне */ }
    apply();
  }));
  apply();
}
