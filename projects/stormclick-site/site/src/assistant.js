import { CONFIG } from './config.js';
import { t, getLang, onLangChange } from './i18n.js';

// ШІ-асистент на сайті. З налаштованим apiBase спілкується з Claude через Worker,
// без нього – демо-режим зі сценарними відповідями, щоб показати механіку.
// Порядок правил важливий: виграє перше, що збіглося. Вузькі правила (аудит реклами, бонусна картка,
// «заявки губляться») стоять вище за широкі, реклама – вище за SEO, SEO – вище за сайт.
// Кирилиця не має \b, тому межа слова – (?:^|[^а-яіїєґ]) … (?![а-яіїєґ]).
const UK_SITE = 'Сайт для бізнесу – $100, готовий за кілька годин: до 5 екранів, мобільна версія, кнопка в Telegram, хостинг на рік. Якщо сайт уже є, але не продає – аудит і переробка за $150. Лишите контакт для розрахунку?';
const EN_SITE = 'A business website is $100, ready in a few hours: up to 5 screens, mobile, Telegram button, hosting for a year. If you already have a site that doesn\'t sell, an audit and rework is $150. Leave a contact for the quote?';
const EN_SHOP = 'An online store is from $400, 1–2 days: up to 100 products, payments, delivery, admin panel, Instagram catalog. How many products do you plan?';
const UK_SEO = 'SEO сайту – від $200 на місяць: технічні помилки, структура, тексти під запити, звіт про позиції щомісяця. Перші правки за 3 дні. Якщо бізнес локальний, почніть із Google Business Profile – $120 за 2 дні. Яка адреса сайту?';
const EN_SEO = 'Website SEO is from $200 a month: technical errors, structure, copy for search queries, a ranking report every month. First fixes in 3 days. For a local business, start with Google Business Profile: $120 in 2 days. What is your site address?';
const UK_PRICE = 'Найдешевший старт – ШІ-аудит за $100. Сайт – $100, бот – від $150, ведення реклами – від $200 на місяць, ШІ-асистент – від $300, магазин – від $400, Telegram Mini App – від $600, CRM – від $1 000. Усе залежить від ТЗ, точну ціну назвемо протягом 15 хвилин у робочий час. Що саме болить?';
const EN_PRICE = 'The cheapest start is the $100 AI audit. Website $100, bot from $150, ad management from $200 a month, AI assistant from $300, store from $400, Telegram Mini App from $600, CRM from $1,000. It all depends on the brief; exact price within 15 minutes during business hours. What hurts?';

// Контакт: «@» або телефон – від 9 цифр, можна з пробілами, дужками, дефісами й крапками («067 123 45 67»,
// «(067) 123 45 67», «+1 415 555 0123»). Не контакт: сума з валютою («100 000 000 грн», «$1 000 000 000»)
// і діапазон бюджету («10 000-15 000», «10000-15000»). Об'єкт із test() стоїть у правилах на місці регулярки.
const PHONE = /(^|[^\d$€₴])(\+?\d(?:[\s().-]{0,3}\d){8,14})(?!\d)(?!\s*(?:грн|гривень|uah|usd|дол|\$|€|eur|євро|тис|k\b))/gi;
const RANGE = /^(?:\d{1,3}(?:\s\d{3})+|\d{4,7})\s?-\s?(?:\d{1,3}(?:\s\d{3})+|\d{4,7})$/;
const CONTACT = { test: (text) => text.includes('@') || [...text.matchAll(PHONE)].some((m) => !RANGE.test(m[2])) };

const DEMO = {
  uk: [
    [CONTACT, 'Дякую! Записав контакт. Команда надішле точний розрахунок протягом 15 хвилин у робочий час.'],
    [/(лендинг|лендінг|landing|посадков\S*|сторінк\S*)\s+(під|для)\s+реклам/i, 'Лендинг під рекламу – $150. Саму рекламу в Meta або Google запускаємо за $150 плюс бюджет, старт того ж дня. Точний обсяг залежить від ТЗ. Що рекламуємо?'],
    [/(збір|збирати|збирання|зібрати|автозбір|більше|мало|немає|нема|просити)\S*\s+(\S+\s+)?відгук|відгук\S*\s+(на|в|у)\s+(гугл|google|мап|карт)/i, 'Автозбір відгуків – $100, готово за годину: після візиту бот просить відгук, а ШІ відповідає на нього від вашого імені. Де хочете збирати відгуки – на Google Maps чи в соцмережах?'],
    [/логотип|(?:^|[^а-яіїєґ])лого(?![а-яіїєґ])|фірмов\S*\s+стил|айдентик|брендбук/i, 'Логотип і фірмовий стиль – $80. Обсяг і термін залежать від ТЗ, точно скажемо протягом 15 хвилин у робочий час. Для якого бізнесу логотип?'],
    [/презентац|комерційн\S*\s+пропозиц|(?:^|[^а-яіїєґ])кп(?![а-яіїєґ])/i, 'Презентація або комерційна пропозиція для вашого бізнесу – $60. Якщо ж потрібен наш розрахунок – лишіть контакт, і команда надішле його протягом 15 хвилин у робочий час. Про що презентація?'],
    [/(аудит|перевір).*(реклам|кабінет|таргет|\bads\b)|(реклам\S*|\bads)\s+(аудит|кабінет)/i, 'Аудит рекламного кабінету – $60 за день: показуємо, куди йде бюджет, які кампанії вимкнути і що запустити замість них. Де крутите рекламу – Meta, Google чи TikTok?'],
    [/(бонусн|дисконтн)\S*\s+карт|карт\S*\s+лояльн/i, 'Бонусну картку робимо як Telegram Mini App – від $600, 3–5 днів: картка відкривається прямо в Telegram, без встановлення. До неї можна додати гейміфікацію лояльності з рівнями, завданнями і бонусами – від $400 за 2–3 дні. Скільки у вас постійних клієнтів?'],
    [/mini.?app|міні.?ап|міні.?додат|міні.?застосун/i, 'Telegram Mini App – від $600, 3–5 днів: магазин, запис або бонусна картка прямо в Telegram, без встановлення. Що має робити ваш додаток?'],
    [/додаток|додатк(?:у|а|ом|и|ів|ах)(?![а-яіїєґ])|застосун|(?:^|[^а-яіїєґ])(?:апп|апк)(?![а-яіїєґ])|\bapp\b|\bios\b|айфон|android|андроїд/i, 'Мобільний додаток – від $2 500: перша версія для iOS і Android за 2–3 тижні плюс перевірка в магазинах. Вхід, каталог або запис, оплата, сповіщення. Швидше й дешевше – Telegram Mini App від $600 за 3–5 днів. Для чого потрібен додаток?'],
    [/не поверта|повернути\s+клієнт|повторн\S*\s+(продаж|покуп)|постійн\S*\s+клієнт/i, 'Для тих, хто давно не купував, – розсилки від $150 за 2 дні: ланцюжки в Email, Telegram і Viber. Гейміфікація лояльності з рівнями, завданнями і бонусами – від $400 за 2–3 дні: щоб клієнти поверталися за наступною нагородою. Де зараз ваша база клієнтів?'],
    [/(?:^|[^а-яіїєґ])(?:гр[аиуі]|грою|ігр[аиу]|ігор)(?![а-яіїєґ])|колес\S*\s+(приз|фортун)|вікторин|скретч|гейміф|лояльн|бонус/i, 'Рекламна міні-гра – від $250 за 1–2 дні: колесо призів, скретч-картка або вікторина, гравець лишає контакт, щоб забрати приз. Гейміфікація лояльності з рівнями, завданнями і бонусами – від $400 за 2–3 дні. Що ближче: зібрати нові контакти чи повернути постійних клієнтів?'],
    [/розсил|e-?mail|імейл|viber|вайбер|ланцюжк/i, 'Розсилки – від $150 за 2 дні: Email, Telegram, Viber, ланцюжки для нових клієнтів і тих, хто давно не купував. Де зараз ваша база клієнтів?'],
    [/блог(?!ер)|статт|статей|статі/i, 'Блог зі ШІ – $120 на місяць: 8 статей під пошукові запити, кожну вичитує людина. Старт за 2 дні. Про що пишемо?'],
    [/креатив|банер/i, 'Пакет креативів – $80 за день: 12 банерів і коротких відео під тест реклами, у форматах Meta і TikTok. Що рекламуємо?'],
    [/аудит\S*\s+сайт|сайт\S*\s+(?:є,?\s+(?:але\s+)?)?не\s+прода/i, UK_SITE],
    [/аудит/i, 'ШІ-аудит – $100 і один день: розбираємо ваш бізнес, кажемо, що автоматизувати першим, скільки це заощадить і з чого почати. Ці $100 зараховуємо в будь-який наступний проєкт. Який у вас бізнес?'],
    [/губл|губим|губит|загуб|втрача\S*\s+(заявк|лід|замовлен|звернен)|(заявк|лід|замовлен|звернен)\S*\s+втрача/i, 'Щоб заявки не губилися – міні-CRM у Telegram або Sheets, від $250 за день: усі заявки в одному місці зі сповіщеннями й статусами. Якщо дані ще й переносите вручну, автоматизація процесів – від $200, того ж дня. Звідки зараз приходять заявки?'],
    [/crm|срм|црм/i, 'CRM під ваш бізнес – від $1 000, готова за 2–3 дні: клієнти, угоди, задачі, звіти, ролі, інтеграція з сайтом і ботом. Якщо заявок небагато, міні-CRM у Telegram або Sheets – від $250 за день. Скільки людей працюватиме в системі?'],
    [/соцмереж|контент|(?:^|[^а-яіїєґ])(?:авто)?пост(?:и|ів|инг|ити|у|а)?(?![а-яіїєґ])|reels|рілс|відео(?!спостереж|нагляд|камер|реєстр|домофон)|\bsmm\b|(?:^|[^а-яіїєґ])смм(?![а-яіїєґ])|(вести|веденн\S*|веду|ведемо|наповн\S*)\s+(\S+\s+)?(інстаграм|instagram|інсту|фейсбук|facebook|тік.?ток|tik.?tok)|(інстаграм|instagram)\S*\s+(\S+\s+)?(не\s+прода|просто[юї]|закинут)/i, 'Соцмережі на автопілоті – $120 на місяць: контент-план, 12 постів і 8 сторіс, редагує людина. Reels і Shorts зі ШІ – 8 роликів за $150 на місяць. Яку соцмережу ведете?'],
    [/не встига|відповіда|повідомлен|дзвін|пропущ|(клієнт\S*|люд\S*|пацієнт\S*)\s+не\s+приход|неявк/i, 'Це наш головний профіль. ШІ-асистент у Telegram, Instagram і на сайті відповідає клієнтам 24/7 – від $300 за день. Пропущені дзвінки закриває ШІ-секретар – від $400 за 2 дні. Клієнти не приходять – бот запису з нагадуваннями, від $150 за годину. Що болить найбільше?'],
    [/google business|google maps|гугл.?мап|гугл.?карт|на\s+(?:гугл\S*\s+|google\s+)?(?:карт(?:і|ах)|мап(?:і|ах))(?![а-яіїєґ])|(додати|поставити)\S*\s+.*на\s+(карту|мапу)|(?:^|[^а-яіїєґ])мап(?:а|у|и)(?![а-яіїєґ])|maps|локальн/i, 'Google Business Profile і локальне SEO – $120 за 2 дні: вас знаходять на мапі й у пошуку, плюс автозбір відгуків. Де ваш бізнес розташований?'],
    [/органічн\S*\s+(трафік|пошук|видач)/i, UK_SEO],
    [/реклам|таргет|трафік|\bads\b|adwords|\bppc\b|тік.?ток|tik.?tok|лідоген|lead.?gen|мало\s+(заявок|лідів|клієнтів|продажів|замовлень)|(заявок|лідів|клієнтів|замовлень)\s+мало|дорог\S*\s+(заявк|лід)|(заявки|ліди)\s+дорог|(більше|нових|нові|потрібн\S*|треба|хочу|немає|нема)\s+(заявок|заявки|лідів|ліди|клієнтів|клієнти|продажів|замовлень)|(?:^|[^а-яіїєґ])(заявк\S*|замовлен\S*|лід\S*)\s+(з\s+\S+\s+)?не\s+(приход|надход|йдуть)|пошук\S*\s+клієнт/i, 'Запуск Meta або Google Ads – $150 плюс бюджет, старт того ж дня. Ведення реклами в Meta, Google і TikTok – від $200 на місяць плюс бюджет: щотижня нові креативи, вимикаємо те, що не дає заявок. Якщо реклама вже працює і зливає бюджет – аудит кабінету за $60. Який продукт рекламуємо?'],
    [/\bseo\b|(?:^|[^а-яіїєґ])сео(?![а-яіїєґ])|пошук|(?:^|[^а-яіїєґ])позиці|не\s+знаход|знаходили|знаходять|знайти\s+(мене|нас)|видач|(просуван|розкрут)\S*\s+сайт|сайт\S*\s+не\s+видно/i, UK_SEO],
    [/просуван|просунути|розкрут|маркетинг/i, 'Є два шляхи. Запуск реклами в Meta або Google – $150 плюс бюджет, старт того ж дня. SEO сайту – від $200 на місяць, перші правки за 3 дні. Що просуваємо: сайт, сторінку в соцмережах чи локальний бізнес?'],
    [/рутин|вручну|руками|таблиц|документ|(генер\S*|шаблон\S*|створ\S*|формув\S*|готу\S*|роб\S*|випису\S*|склада\S*)\s+(\S+\s+)?(рахунк|рахунок|договор|договір|акт(?:и|ів)?(?![а-яіїєґ]))|автоматиз|дашборд/i, 'Автоматизація процесів – від $200, того ж дня: зв\'язуємо Sheets, CRM, Telegram, пошту й платіжки, дані переносяться самі. Генератор документів (рахунки, акти, КП у PDF) – від $150. Що робите вручну найчастіше?'],
    [/магазин|shop|товар/i, 'Інтернет-магазин – від $400, 1–2 дні: до 100 товарів, оплата, доставка, адмінка, Instagram-каталог. Скільки товарів плануєте?'],
    [/(?:^|[^а-яіїєґ])пропозиц/i, UK_PRICE],
    [/кав['’ʼ]ярн|кафе|салон|візитівк|сайт|лендинг|лендінг|landing/i, UK_SITE],
    [/(?:^|[^а-яіїєґ])бот|чат.?бот|telegram|телеграм|запис/i, 'Бот запису з нагадуваннями – від $150, готовий за годину. ШІ-асистент, що сам відповідає клієнтам – від $300 за день. Що з цього ближче?'],
    [/(?:^|[^а-яіїєґ])цін[аиу]|кошту|вартість|прайс|бюджет|скільки|дешев|розрахун/i, UK_PRICE],
  ],
  en: [
    [CONTACT, 'Thank you! Contact saved. The team will send an exact quote within 15 minutes during business hours.'],
    [/landing( page)?s? for (\w+ )?(ads?|advertising|campaigns?)|\bad landing/i, 'A landing page for ads is $150. The ad launch itself on Meta or Google is $150 plus budget, live the same day. The exact scope depends on the brief. What are we promoting?'],
    [/(get|more|collect|gather|ask for|need|few|no)\s+(\w+\s+){0,2}reviews|review (collection|requests?)|reviews? on google|google reviews/i, 'Automatic review collection is $100, ready in an hour: after a visit the bot asks for a review and AI replies on your behalf. Where do you want reviews: on Google Maps or on social media?'],
    [/\blogos?\b|identity|brand ?book/i, 'A logo and identity is $80. Scope and timing depend on the brief; we will confirm within 15 minutes during business hours. What business is the logo for?'],
    [/presentation|(pitch|slide) deck|proposal/i, 'A presentation or a proposal for your business is $60. If you want our quote instead, leave a contact and the team will send it within 15 minutes during business hours. What is the presentation about?'],
    [/ad account|ads? audit|account audit|audit.*\bads?\b|\b(check|review)\b.*\bads?\b|\bads?\b.*\baudit/i, 'An ad account audit is $60 in a day: we show where the budget goes, which campaigns to switch off and what to launch instead. Where do you run ads: Meta, Google or TikTok?'],
    [/(loyalty|bonus|rewards?|discount|punch|stamp) card/i, 'A loyalty card works as a Telegram Mini App: from $600, 3–5 days, it opens right inside Telegram with nothing to install. You can add gamified loyalty with levels, quests and bonuses, from $400 in 2–3 days. How many regular customers do you have?'],
    [/mini.?app/i, 'A Telegram Mini App is from $600, 3–5 days: a store, booking or a loyalty card right inside Telegram, nothing to install. What should your app do?'],
    [/\bapps?\b|\bios\b|iphone|android/i, 'A mobile app is from $2,500: a first version for iOS and Android in 2–3 weeks plus store review. Sign-in, catalog or booking, payments, notifications. Faster and cheaper: a Telegram Mini App from $600 in 3–5 days. What is the app for?'],
    [/come back|coming back|(don'?t|do not|not|never) return|repeat (customers?|purchases?|sales|business)|retention|win.?back|returning customers/i, 'For customers who haven\'t bought in a while: email and messenger campaigns from $150 in 2 days, with sequences in Email, Telegram and Viber. Gamified loyalty with levels, quests and bonuses is from $400 in 2–3 days, so customers come back for the next reward. Where is your customer list now?'],
    [/\bgames?\b|mini.?game|wheel|scratch.?card|quiz|gamif|loyalt|reward|bonus/i, 'A promo mini-game is from $250 in 1–2 days: prize wheel, scratch card or quiz, and the player leaves a contact to claim the prize. Gamified loyalty with levels, quests and bonuses is from $400 in 2–3 days. Which is closer: new contacts or bringing regulars back?'],
    [/newsletter|mailing|e-?mail|viber|sequence/i, 'Email and messenger campaigns are from $150 in 2 days: Email, Telegram, Viber, sequences for new customers and for those who haven\'t bought in a while. Where is your customer list now?'],
    [/blog|article/i, 'An AI-assisted blog is $120 a month: 8 articles for search queries, a human edits every one. Starts in 2 days. What do we write about?'],
    [/creative|banner/i, 'An ad creative pack is $80 in a day: 12 banners and short videos for ad testing, in Meta and TikTok formats. What are we promoting?'],
    [/site audit|audit.*\b(web)?site|site (doesn'?t|does not|won'?t) (sell|convert)/i, EN_SITE],
    [/audit/i, 'The AI audit is $100 and one day: we map your business, say what to automate first, how much it saves and where to start. The $100 counts towards any next project. What is your business?'],
    [/\b(lose|lost|losing)\b.*\b(leads?|orders?|requests?|inquir)|\b(leads?|orders?|requests?|inquiries)\b.*\b(lost|slip|fall through|forgotten)/i, 'So leads stop getting lost: a mini-CRM in Telegram or Sheets, from $250 in a day, with all leads in one place, notifications and statuses. If you also move data by hand, process automation is from $200, same day. Where do your leads come from now?'],
    [/\bcrm\b/i, 'A custom CRM is from $1,000, ready in 2–3 days: customers, deals, tasks, reports, roles, integrated with your site and bot. For fewer leads, a mini-CRM in Telegram or Sheets is from $250 in a day. How many people will use it?'],
    [/social|content|\bposts?\b|posting|reels|shorts|video|\bsmm\b|(run|manage|running|managing|post(ing)? on)\s+(my |our |the |an? )?(instagram|facebook|tiktok)|instagram\s+(page |account |profile )?(is )?(not|isn'?t|doesn'?t)\s+(sell|grow|work)/i, 'Social media on autopilot is $120 a month: content plan, 12 posts and 8 stories, edited by a human. Reels and Shorts with AI: 8 videos for $150 a month. Which network do you run?'],
    [/keep up|messag|repl(y|ies)|\bcalls?\b|missed|no-?shows?|(don'?t|doesn'?t|do not|didn'?t|never|forget to)\s+(show|turn)\s+up(?!\s+(in|on)\s+(google|search|maps?|the map))/i, 'That is our core. An AI assistant in Telegram, Instagram and on your site answers customers 24/7 from $300 in a day. Missed calls go to an AI receptionist from $400 in 2 days. No-shows: a booking bot with reminders from $150 in an hour. What hurts the most?'],
    [/google business|\bmaps?\b|local/i, 'Google Business Profile and local SEO is $120 in 2 days: people find you on the map and in search, plus automatic reviews. Where is your business?'],
    [/organic (traffic|search|results|ranking)/i, EN_SEO],
    [/\bads?\b|advert|target|traffic|\bppc\b|tik.?tok|adwords|lead.?gen|(few|more|no|not enough|need|new|get|cheaper|expensive)\s+(leads|customers|clients|sales)\b|\bleads\s+(are|cost|too)\b/i, 'A Meta or Google Ads launch is $150 plus budget, live the same day. Ad management on Meta, Google and TikTok is from $200 a month plus budget: new creatives weekly, we switch off what brings no leads. If ads already run and burn the budget, an account audit is $60. What are we promoting?'],
    [/\bseo\b|\bsearch|\brank|be found|find (me|us|my|our)|organic|show(s|ing)? up (in|on) (google|search)|promot\w*\s+(my |our |the |a )?(web)?site/i, EN_SEO],
    [/promot|marketing/i, 'There are two ways. A Meta or Google Ads launch is $150 plus budget, live the same day. Website SEO is from $200 a month, first fixes in 3 days. What are we promoting: a website, a social page or a local business?'],
    [/routine|manual|by hand|\b(spread)?sheets?\b|document|(generat\w*|creat\w*|mak\w*|templat\w*|prepar\w*|writ\w*)\s+(\w+\s+)?(invoices?|contracts?)|(invoices?|contracts?)\s+(by hand|manually|generator)|automat|dashboard/i, 'Process automation is from $200, same day: we connect Sheets, CRM, Telegram, email and payments so data moves itself. A document generator (invoices, acts, proposals to PDF) is from $150. What do you do by hand most often?'],
    [/online (store|shop)|e-?commerce|web ?shop|\bstores?\b|\bproducts?\b|sell online/i, EN_SHOP],
    [/coffee|salon|\bsites?\b|landing|website|web ?page/i, EN_SITE],
    [/\bshop\b/i, EN_SHOP],
    [/\bbots?\b|chatbot|telegram|\bbook/i, 'A booking bot with reminders is from $150, ready in an hour. An AI assistant that answers customers itself is from $300 in a day. Which is closer?'],
    [/price|pricing|cost|budget|how much|cheap|quote|\boffers?\b/i, EN_PRICE],
  ],
};

export function initAssistant(root) {
  const panel = root.querySelector('.assistant-panel');
  const log = root.querySelector('.assistant-log');
  const form = root.querySelector('.assistant-form');
  const input = form.querySelector('input');
  const toggle = root.querySelector('.assistant-toggle');
  const closeBtn = root.querySelector('.assistant-close');
  const chips = root.querySelector('.assistant-chips');
  const history = [];
  let busy = false;

  const live = Boolean(CONFIG.apiBase);
  root.classList.toggle('is-demo', !live);

  const open = () => { root.classList.add('is-open'); toggle.setAttribute('aria-expanded', 'true'); setTimeout(() => input.focus(), 300); };
  const close = () => { root.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', () => (root.classList.contains('is-open') ? close() : open()));
  closeBtn.addEventListener('click', close);
  document.querySelectorAll('[data-assistant]').forEach((el) => el.addEventListener('click', (e) => {
    e.preventDefault();
    open();
    if (el.dataset.assistant) ask(el.dataset.assistant);
  }));
  chips.addEventListener('click', (e) => {
    const chip = e.target.closest('button');
    if (chip) ask(chip.textContent);
  });

  const bubble = (role, text = '') => {
    const el = document.createElement('div');
    el.className = `assistant-msg from-${role}`;
    el.textContent = text;
    log.append(el);
    log.scrollTop = log.scrollHeight;
    return el;
  };

  const greet = () => {
    log.innerHTML = '';
    history.length = 0;
    bubble('assistant', t('assistant.greeting'));
    chips.innerHTML = ['assistant.chip1', 'assistant.chip2', 'assistant.chip3'].map((k) => `<button type="button">${t(k)}</button>`).join('');
  };
  greet();
  onLangChange(greet);

  async function ask(text) {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    chips.hidden = true;
    input.value = '';
    bubble('user', text);
    history.push({ role: 'user', content: text });
    const el = bubble('assistant');
    el.classList.add('is-typing');
    try {
      const reply = live ? await streamReply(el) : await demoReply(text, el);
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      el.textContent = t('assistant.error');
    } finally {
      el.classList.remove('is-typing');
      busy = false;
      input.focus();
    }
  }

  async function streamReply(el) {
    const res = await fetch(`${CONFIG.apiBase}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history, lang: getLang() }),
    });
    if (!res.ok || !res.body) throw new Error(res.status);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop();
      for (const part of parts) {
        const event = /^event: (\w+)/m.exec(part)?.[1];
        const data = /^data: (.*)$/m.exec(part)?.[1];
        if (!event || data === undefined) continue;
        const payload = JSON.parse(data);
        if (event === 'text') { text += payload; el.textContent = text; log.scrollTop = log.scrollHeight; }
        if (event === 'lead') root.classList.add('has-lead');
        if (event === 'error') throw new Error(payload.message);
      }
    }
    return text;
  }

  async function demoReply(text, el) {
    const rules = DEMO[getLang()] || DEMO.uk;
    const match = rules.find(([re]) => re.test(text));
    const reply = match ? match[1] : t('assistant.demoFallback');
    // Імітуємо стрім, щоб відчути темп справжнього асистента
    for (let i = 1; i <= reply.length; i += 3) {
      el.textContent = reply.slice(0, i);
      log.scrollTop = log.scrollHeight;
      await new Promise((r) => setTimeout(r, 14));
    }
    el.textContent = reply;
    return reply;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });
}
