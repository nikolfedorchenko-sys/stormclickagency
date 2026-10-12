const DICT = {
  uk: {
    'meta.title': 'StormClick – digital-агенція повного циклу',
    'meta.description': 'Сайти, реклама, автоматизація, SMM і брендинг. Від логотипу до заявок.',
    'preloader.label': 'Заряджаємо шторм',
    'nav.services': 'Послуги',
    'nav.cases': 'Кейси',
    'nav.faq': 'FAQ',
    'nav.contact': 'Контакти',
    'cta.discuss': 'Обговорити проєкт',
    'cta.quote': 'Отримати розрахунок',

    'hero.badge': 'Digital-агенція · Україна · Європа · США',
    'hero.title1': 'Від логотипу',
    'hero.title2': 'до заявок',
    'hero.subtitle': 'Сайти, реклама, автоматизація і брендинг. Одна команда веде вашого клієнта від першого кліку до заявки.',
    'hero.scroll': 'Гортайте',
    'stage2.eyebrow': 'Удар блискавки = клік',
    'stage2.title': 'Один удар. Точно в ціль.',
    'stage3.eyebrow': 'Повний цикл',
    'stage3.title': '5 напрямків. Одна система.',

    'services.eyebrow': 'Послуги',
    'services.title': 'Беремо окрему задачу або будуємо всю систему залучення клієнтів',
    'services.hint': 'Гортайте далі',
    's1.title': 'Реклама і трафік',
    's1.text': 'Таргет у Meta і TikTok, Google Ads, пікселі й аналітика. Приводимо клієнтів, а не лайки.',
    's1.tags': 'Meta Ads · Google Ads · TikTok · GA4',
    's2.title': 'Сайти і розробка',
    's2.text': 'Лендинги, сайти-візитівки, магазини, кастомний код, інтеграції з CRM і платіжками.',
    's2.tags': 'Лендинги · E-commerce · WebGL · CRM',
    's3.title': 'Telegram і автоматизація',
    's3.text': 'Чат-боти, автопостинг, воронки в месенджерах, AI-асистенти. Рутина працює без вас.',
    's3.tags': 'Боти · Автопостинг · AI · Воронки',
    's4.title': 'SMM і контент',
    's4.text': 'Ведення соцмереж, контент-план, креативи для реклами. SMM для агенцій під white label.',
    's4.tags': 'Instagram · TikTok · Креативи · White label',
    's5.title': 'Брендинг і дизайн',
    's5.text': 'Логотип, фірмовий стиль, дизайн соцмереж і рекламних матеріалів.',
    's5.tags': 'Лого · Айдентика · Ключові візуали',
    's6.title': 'Нестандартна задача?',
    's6.text': 'Опишіть, що потрібно. Скажемо чесно, чи беремося, і запропонуємо рішення.',
    's6.cta': 'Написати',

    'traffic.eyebrow': 'Трафік → заявки',
    'traffic.title': 'Ми рахуємо не охоплення, а заявки',
    'traffic.text': 'Кожен клік має куди вести: на сайт, що продає, або в бота, що відповідає за 15 секунд. Тому реклама, сайт і автоматизація у нас працюють як одна система.',
    'traffic.demo': 'Демо-дані для ілюстрації',
    'traffic.visitors': 'Відвідувачі',
    'traffic.leads': 'Заявки',
    'traffic.chart': 'Заявки за тиждень, демо',
    'traffic.week': 'Тиж.',

    'facts.title': 'Чесні факти замість вигаданих цифр',
    'f1.num': '3',
    'f1.label': 'регіони: Україна, Європа, США',
    'f2.num': '5',
    'f2.label': 'напрямків під одним дахом',
    'f3.num': '2',
    'f3.label': 'мови: українська та англійська',
    'f4.num': '15',
    'f4.label': 'хвилин до першої відповіді в робочий час',

    'cases.eyebrow': 'Кейси',
    'cases.title': 'Демо-проєкти',
    'cases.note': 'Реальні кейси з\'являться тут після перших проєктів. Поки показуємо, як ми думаємо.',
    'c1.kind': 'Telegram-бот',
    'c1.title': 'Бот-адміністратор для салону краси',
    'c1.text': 'Запис, нагадування, відгуки й повторні продажі без адміністратора на телефоні.',
    'c1.m1': 'Привіт! Хочу записатися на манікюр',
    'c1.m2': 'Є вільно завтра о 12:00 і 16:30. Коли зручно?',
    'c1.m3': 'О 16:30',
    'c1.m4': 'Записала. Нагадаю за 2 години до візиту.',
    'c2.kind': 'Лендинг',
    'c2.title': 'Сторінка для курсу з англійської',
    'c2.text': 'Один екран, один оффер, квіз замість форми. Конверсія в заявку як головна метрика.',
    'c2.ui1': 'Розмовна англійська за 3 місяці',
    'c2.ui2': 'Пройти тест рівня',
    'c3.kind': 'Рекламна кампанія',
    'c3.title': 'Запуск Meta Ads для доставки їжі',
    'c3.text': 'Тест креативів, масштабування переможців, щоденний звіт у Telegram.',
    'c3.legend': 'Заявки на день, демо',
    'cases.demo': 'Демо',

    'tech.title': 'Інструменти, з якими працюємо',

    'reviews.eyebrow': 'Відгуки',
    'reviews.title': 'Що скажуть клієнти',
    'reviews.note': 'Демо-відгуки. Справжні з\'являться після перших проєктів.',
    'r1.text': '«Нарешті не треба тримати п\'ятьох підрядників. Сайт, реклама і бот зроблені однією командою і працюють разом».',
    'r1.name': 'Власник сервісу доставки',
    'r2.text': '«Запустили за два тижні. Перші заявки пішли на третій день після старту реклами».',
    'r2.name': 'Засновниця онлайн-школи',
    'r3.text': '«Відповідають швидко, пояснюють без термінів, рахують ціну під задачу, а не продають пакет».',
    'r3.name': 'Маркетолог e-commerce бренду',

    'faq.title': 'Часті запитання',
    'q1.q': 'Скільки коштують послуги?',
    'q1.a': 'Фіксованих пакетів немає. Розбираємо задачу і рахуємо ціну під неї. Перший розрахунок безкоштовний і ні до чого не зобов\'язує.',
    'q2.q': 'Як швидко ви запускаєтесь?',
    'q2.a': 'Лендинг або бот – від 1 до 3 тижнів. Рекламна кампанія – від 3 днів після погодження креативів. Великі проєкти оцінюємо окремо.',
    'q3.q': 'Чи працюєте з клієнтами з Європи та США?',
    'q3.a': 'Так. Ведемо комунікацію українською та англійською, працюємо з GDPR і локальними платіжними системами.',
    'q4.q': 'Що потрібно від мене для старту?',
    'q4.a': 'Опис задачі і 20 хвилин на дзвінок або листування. Решту (доступи, матеріали, тексти) збираємо разом за чек-листом.',
    'q5.q': 'Чи можна замовити лише одну послугу?',
    'q5.a': 'Так. Беремо окрему задачу: тільки сайт, тільки рекламу або тільки бота. Систему будуємо, якщо вона вам потрібна.',

    'contact.eyebrow': 'Контакти',
    'contact.title': 'Обговоримо ваш проєкт',
    'contact.text': 'Дайте відповідь на 4 питання, і ми повернемося з розрахунком. Або напишіть у месенджер.',
    'contact.email': 'Email',

    'quiz.step': 'Крок',
    'quiz.of': 'з',
    'quiz.q1': 'Що потрібно?',
    'quiz.q2': 'Орієнтовний бюджет',
    'quiz.q3': 'Коли потрібно запуститись?',
    'quiz.q4': 'Куди надіслати розрахунок?',
    'quiz.b1': 'до $500',
    'quiz.b2': '$500 – 2 000',
    'quiz.b3': '$2 000+',
    'quiz.b4': 'Ще не знаю',
    'quiz.t1': 'Якнайшвидше',
    'quiz.t2': 'Протягом місяця',
    'quiz.t3': 'За 1–3 місяці',
    'quiz.t4': 'Поки вивчаю',
    'quiz.name': 'Ім\'я',
    'quiz.contact': 'Telegram, WhatsApp або телефон',
    'quiz.comment': 'Коротко про задачу (необов\'язково)',
    'quiz.back': 'Назад',
    'quiz.next': 'Далі',
    'quiz.submit': 'Надіслати',
    'quiz.success': 'Дякуємо! Відкриваємо Telegram із вашою заявкою. Ми відповімо найближчим часом.',
    'quiz.prefix': 'Заявка з сайту StormClick',
    'quiz.l.service': 'Послуга',
    'quiz.l.budget': 'Бюджет',
    'quiz.l.timing': 'Терміни',

    'footer.rights': 'Усі права захищено.',
    'footer.privacy': 'Політика конфіденційності',
  },
  en: {
    'meta.title': 'StormClick – full-cycle digital agency',
    'meta.description': 'Websites, ads, automation, SMM and branding. From logo to leads.',
    'preloader.label': 'Charging the storm',
    'nav.services': 'Services',
    'nav.cases': 'Cases',
    'nav.faq': 'FAQ',
    'nav.contact': 'Contact',
    'cta.discuss': 'Discuss a project',
    'cta.quote': 'Get a quote',

    'hero.badge': 'Digital agency · Ukraine · Europe · USA',
    'hero.title1': 'From logo',
    'hero.title2': 'to leads',
    'hero.subtitle': 'Websites, ads, automation and branding. One team takes your customer from the first click to a request.',
    'hero.scroll': 'Scroll',
    'stage2.eyebrow': 'Lightning strike = click',
    'stage2.title': 'One strike. Right on target.',
    'stage3.eyebrow': 'Full cycle',
    'stage3.title': '5 disciplines. One system.',

    'services.eyebrow': 'Services',
    'services.title': 'Take a single task or let us build your whole client acquisition system',
    'services.hint': 'Keep scrolling',
    's1.title': 'Ads & traffic',
    's1.text': 'Meta and TikTok ads, Google Ads, pixels and analytics. We bring customers, not likes.',
    's1.tags': 'Meta Ads · Google Ads · TikTok · GA4',
    's2.title': 'Websites & development',
    's2.text': 'Landing pages, business sites, online stores, custom code, CRM and payment integrations.',
    's2.tags': 'Landing pages · E-commerce · WebGL · CRM',
    's3.title': 'Telegram & automation',
    's3.text': 'Chatbots, auto-posting, messenger funnels, AI assistants. Routine work runs without you.',
    's3.tags': 'Bots · Auto-posting · AI · Funnels',
    's4.title': 'SMM & content',
    's4.text': 'Social media management, content plans, ad creatives. White-label SMM for agencies.',
    's4.tags': 'Instagram · TikTok · Creatives · White label',
    's5.title': 'Branding & design',
    's5.text': 'Logo, brand identity, social media and ad design.',
    's5.tags': 'Logo · Identity · Key visuals',
    's6.title': 'Something custom?',
    's6.text': 'Tell us what you need. We\'ll be honest about whether we can do it and propose a solution.',
    's6.cta': 'Write to us',

    'traffic.eyebrow': 'Traffic → leads',
    'traffic.title': 'We count leads, not reach',
    'traffic.text': 'Every click needs somewhere to go: a site that sells or a bot that replies in 15 seconds. That is why ads, website and automation work as one system here.',
    'traffic.demo': 'Demo data for illustration',
    'traffic.visitors': 'Visitors',
    'traffic.leads': 'Leads',
    'traffic.chart': 'Leads per week, demo',
    'traffic.week': 'Wk',

    'facts.title': 'Honest facts instead of invented numbers',
    'f1.num': '3',
    'f1.label': 'regions: Ukraine, Europe, USA',
    'f2.num': '5',
    'f2.label': 'disciplines under one roof',
    'f3.num': '2',
    'f3.label': 'languages: Ukrainian and English',
    'f4.num': '15',
    'f4.label': 'minutes to a first reply during business hours',

    'cases.eyebrow': 'Cases',
    'cases.title': 'Demo projects',
    'cases.note': 'Real cases will appear here after our first projects. For now, this is how we think.',
    'c1.kind': 'Telegram bot',
    'c1.title': 'Admin bot for a beauty salon',
    'c1.text': 'Booking, reminders, reviews and repeat sales without an admin on the phone.',
    'c1.m1': 'Hi! I\'d like to book a manicure',
    'c1.m2': 'Tomorrow at 12:00 or 16:30 is free. Which works?',
    'c1.m3': '16:30',
    'c1.m4': 'Booked. I\'ll remind you 2 hours before.',
    'c2.kind': 'Landing page',
    'c2.title': 'Page for an English course',
    'c2.text': 'One screen, one offer, a quiz instead of a form. Lead conversion as the main metric.',
    'c2.ui1': 'Conversational English in 3 months',
    'c2.ui2': 'Take the level test',
    'c3.kind': 'Ad campaign',
    'c3.title': 'Meta Ads launch for food delivery',
    'c3.text': 'Creative testing, scaling the winners, daily report in Telegram.',
    'c3.legend': 'Leads per day, demo',
    'cases.demo': 'Demo',

    'tech.title': 'Tools we work with',

    'reviews.eyebrow': 'Reviews',
    'reviews.title': 'What clients will say',
    'reviews.note': 'Demo reviews. Real ones will appear after our first projects.',
    'r1.text': '"Finally no need to manage five contractors. Website, ads and bot were built by one team and work together."',
    'r1.name': 'Owner of a delivery service',
    'r2.text': '"Launched in two weeks. First leads came on day three after the ads went live."',
    'r2.name': 'Founder of an online school',
    'r3.text': '"Fast replies, no jargon, and they price the task instead of selling a package."',
    'r3.name': 'Marketer at an e-commerce brand',

    'faq.title': 'Frequently asked questions',
    'q1.q': 'How much do your services cost?',
    'q1.a': 'There are no fixed packages. We break down the task and price it individually. The first estimate is free and non-binding.',
    'q2.q': 'How fast can you launch?',
    'q2.a': 'A landing page or a bot takes 1–3 weeks. An ad campaign starts within 3 days after creatives are approved. Larger projects are scoped separately.',
    'q3.q': 'Do you work with clients in Europe and the USA?',
    'q3.a': 'Yes. We communicate in Ukrainian and English and work with GDPR and local payment systems.',
    'q4.q': 'What do you need from me to start?',
    'q4.a': 'A task description and 20 minutes for a call or chat. The rest (access, materials, copy) we collect together using a checklist.',
    'q5.q': 'Can I order just one service?',
    'q5.a': 'Yes. We take single tasks: only a website, only ads or only a bot. We build the full system only if you need it.',

    'contact.eyebrow': 'Contact',
    'contact.title': 'Let\'s discuss your project',
    'contact.text': 'Answer 4 questions and we\'ll come back with a quote. Or message us directly.',
    'contact.email': 'Email',

    'quiz.step': 'Step',
    'quiz.of': 'of',
    'quiz.q1': 'What do you need?',
    'quiz.q2': 'Approximate budget',
    'quiz.q3': 'When do you need to launch?',
    'quiz.q4': 'Where should we send the quote?',
    'quiz.b1': 'under $500',
    'quiz.b2': '$500 – 2,000',
    'quiz.b3': '$2,000+',
    'quiz.b4': 'Not sure yet',
    'quiz.t1': 'As soon as possible',
    'quiz.t2': 'Within a month',
    'quiz.t3': 'In 1–3 months',
    'quiz.t4': 'Just exploring',
    'quiz.name': 'Name',
    'quiz.contact': 'Telegram, WhatsApp or phone',
    'quiz.comment': 'Briefly about the task (optional)',
    'quiz.back': 'Back',
    'quiz.next': 'Next',
    'quiz.submit': 'Send',
    'quiz.success': 'Thank you! Opening Telegram with your request. We\'ll reply shortly.',
    'quiz.prefix': 'Request from StormClick website',
    'quiz.l.service': 'Service',
    'quiz.l.budget': 'Budget',
    'quiz.l.timing': 'Timing',

    'footer.rights': 'All rights reserved.',
    'footer.privacy': 'Privacy policy',
  },
};

const LANGS = Object.keys(DICT);
let lang = detect();
const listeners = [];

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
export const getLang = () => lang;
export const onLangChange = (fn) => listeners.push(fn);

function apply() {
  document.documentElement.lang = lang;
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  listeners.forEach((fn) => fn(lang));
}

export function initI18n() {
  document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => {
    lang = b.dataset.lang;
    try { localStorage.setItem('lang', lang); } catch (e) { /* сховище недоступне */ }
    apply();
  }));
  apply();
}
