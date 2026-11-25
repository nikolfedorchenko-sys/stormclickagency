// Єдине джерело прайсу: з нього рендеряться картки послуг, варіанти квізу і табло першого екрана.
// Ці цифри дублюють промпт сервера (worker/src/index.js) і сценарій демо-асистента (src/assistant.js) –
// після зміни прайсу онови їх теж.
// Ціни орієнтовні, фінальна залежить від технічного завдання.

export const PAINS = [
  {
    id: 'clients',
    uk: { pain: 'Не встигаю відповідати клієнтам', hint: 'Повідомлення в усіх месенджерах, пропущені дзвінки, клієнти, що не приходять' },
    en: { pain: 'I can\'t keep up with customer messages', hint: 'Messages in every app, missed calls, no-shows' },
    items: [
      { id: 'assistant', uk: ['ШІ-асистент у Telegram, Instagram і на сайті', 'Відповідає 24/7 на базі ваших даних, записує, збирає заявки, передає гарячі вам.', 'від $300', '1 день'], en: ['AI assistant in Telegram, Instagram and on your site', 'Answers 24/7 from your data, books, collects leads, hands hot ones to you.', 'from $300', '1 day'] },
      { id: 'phone', uk: ['ШІ-секретар на телефоні', 'Приймає дзвінок, записує клієнта, надсилає вам резюме розмови.', 'від $400', '2 дні'], en: ['AI phone receptionist', 'Answers the call, books the client, sends you a summary.', 'from $400', '2 days'] },
      { id: 'booking', uk: ['Бот запису з нагадуваннями', 'Запис, підтвердження, нагадування за 2 години. Менше неявок.', 'від $150', 'година'], en: ['Booking bot with reminders', 'Booking, confirmation, a reminder 2 hours before. Fewer no-shows.', 'from $150', 'an hour'] },
      { id: 'reviews', uk: ['Автозбір відгуків', 'Після візиту бот просить відгук, ШІ відповідає на нього від вашого імені.', '$100', 'година'], en: ['Automatic review collection', 'After a visit the bot asks for a review; AI replies on your behalf.', '$100', 'an hour'] },
    ],
  },
  {
    id: 'content',
    uk: { pain: 'Не встигаю з контентом', hint: 'Соцмережі простоюють, відео дорого, на статті й банери немає часу' },
    en: { pain: 'No time for content', hint: 'Social media stalls, video is expensive, no time for articles and banners' },
    items: [
      { id: 'smm', uk: ['Автопостинг соцмереж', 'Контент-план, 12 постів і 8 сторіс на місяць, редактура людиною.', '$120 / міс', 'старт за день'], en: ['Social media on autopilot', 'Content plan, 12 posts and 8 stories a month, edited by a human.', '$120 / mo', 'starts in a day'] },
      { id: 'video', uk: ['Reels і Shorts зі ШІ', '8 роликів на місяць: сценарій, озвучка, монтаж, субтитри.', '$150 / міс', 'тиждень'], en: ['Reels and Shorts with AI', '8 videos a month: script, voice-over, editing, captions.', '$150 / mo', 'a week'] },
      { id: 'blog', uk: ['Блог зі ШІ', '8 статей на місяць під пошукові запити. Кожну вичитує людина.', '$120 / міс', 'старт за 2 дні'], en: ['AI-assisted blog', '8 articles a month for search queries. A human edits every one.', '$120 / mo', 'starts in 2 days'] },
      { id: 'creatives', uk: ['Пакет креативів', '12 банерів і коротких відео під тест реклами, у форматах Meta і TikTok.', '$80', '1 день'], en: ['Ad creative pack', '12 banners and short videos for ad testing, in Meta and TikTok formats.', '$80', '1 day'] },
    ],
  },
  {
    id: 'leads',
    uk: { pain: 'Заявок мало або вони дорогі', hint: 'Реклама зливає бюджет, сайт не видно в пошуку, клієнти не повертаються' },
    en: { pain: 'Too few leads, or they cost too much', hint: 'Ads burn the budget, your site doesn\'t show up in search, customers don\'t come back' },
    items: [
      { id: 'ads', uk: ['Запуск реклами Meta / Google', 'ШІ готує креативи, ми масштабуємо ті, що дають заявки. Плюс бюджет.', '$150', 'того ж дня'], en: ['Meta / Google ads launch', 'AI drafts creatives, we scale the ones that bring leads. Plus ad budget.', '$150', 'same day'] },
      { id: 'adsmgmt', uk: ['Ведення реклами', 'Meta, Google, TikTok: щотижня нові креативи, вимикаємо те, що не дає заявок, звіт раз на місяць. Плюс бюджет.', 'від $200 / міс', 'старт за день'], en: ['Ad management', 'Meta, Google, TikTok: new creatives weekly, we switch off what brings no leads, a report every month. Plus ad budget.', 'from $200 / mo', 'starts in a day'] },
      { id: 'adsaudit', uk: ['Аудит рекламного кабінету', 'Показуємо, куди йде бюджет, які кампанії вимкнути і що запустити замість них.', '$60', '1 день'], en: ['Ad account audit', 'We show where the budget goes, which campaigns to switch off and what to launch instead.', '$60', '1 day'] },
      { id: 'seo', uk: ['SEO сайту', 'Технічні помилки, структура, тексти під запити. Звіт про позиції щомісяця.', 'від $200 / міс', 'перші правки за 3 дні'], en: ['Website SEO', 'Technical errors, structure, copy for search queries. A ranking report every month.', 'from $200 / mo', 'first fixes in 3 days'] },
      { id: 'local', uk: ['Google Business Profile + локальне SEO', 'Щоб вас знаходили на мапі й у пошуку, збір відгуків.', '$120', '2 дні'], en: ['Google Business Profile + local SEO', 'So people find you on the map and in search, plus review collection.', '$120', '2 days'] },
      { id: 'mailing', uk: ['Розсилки', 'Email, Telegram, Viber: ланцюжки для нових клієнтів і тих, хто давно не купував.', 'від $150', '2 дні'], en: ['Email and messenger campaigns', 'Email, Telegram, Viber: sequences for new customers and for those who haven\'t bought in a while.', 'from $150', '2 days'] },
    ],
  },
  {
    id: 'routine',
    uk: { pain: 'Рутина забирає час', hint: 'Дані переносяться вручну, заявки губляться, документи робляться руками' },
    en: { pain: 'Routine eats my time', hint: 'Manual data entry, lost leads, documents made by hand' },
    items: [
      { id: 'automation', uk: ['Автоматизація процесів', 'Зв\'язуємо Sheets, CRM, Telegram, пошту, платіжки. Дані переносяться самі.', 'від $200', 'того ж дня'], en: ['Process automation', 'We connect Sheets, CRM, Telegram, email, payments. Data moves itself.', 'from $200', 'same day'] },
      { id: 'minicrm', uk: ['Міні-CRM у Telegram або Sheets', 'Усі заявки в одному місці зі сповіщеннями й статусами.', 'від $250', '1 день'], en: ['Mini-CRM in Telegram or Sheets', 'All leads in one place with notifications and statuses.', 'from $250', '1 day'] },
      { id: 'docs', uk: ['Генератор документів', 'Рахунки, акти, договори, КП: шаблон → PDF за хвилину.', 'від $150', '1 день'], en: ['Document generator', 'Invoices, acts, contracts, proposals: template → PDF in a minute.', 'from $150', '1 day'] },
      { id: 'dashboard', uk: ['Дашборд бізнесу', 'Продажі, заявки, витрати на одному екрані. Оновлюється сам.', 'від $250', '1–2 дні'], en: ['Business dashboard', 'Sales, leads, costs on one screen. Updates itself.', 'from $250', '1–2 days'] },
    ],
  },
  {
    id: 'build',
    uk: { pain: 'Потрібен сайт, магазин або\u00a0CRM', hint: 'Агенції просять тисячі доларів і місяці, фрилансери зникають' },
    en: { pain: 'I need a website, a store or a\u00a0CRM', hint: 'Agencies ask for thousands and months, freelancers vanish' },
    items: [
      { id: 'site', uk: ['Сайт для бізнесу', 'Кав\'ярня, салон, майстер. До 5 екранів, мобільна версія, кнопка в Telegram, хостинг на рік.', '$100', 'кілька годин'], en: ['Business website', 'Coffee shop, salon, freelancer. Up to 5 screens, mobile, Telegram button, hosting for a year.', '$100', 'a few hours'] },
      { id: 'shop', uk: ['Інтернет-магазин', 'До 100 товарів, оплата, доставка, адмінка, Instagram-каталог.', 'від $400', '1–2 дні'], en: ['Online store', 'Up to 100 products, payments, delivery, admin panel, Instagram catalog.', 'from $400', '1–2 days'] },
      { id: 'crm', uk: ['CRM під ваш бізнес', 'Клієнти, угоди, задачі, звіти, ролі. Інтеграція з сайтом, ботом і платіжками.', 'від $1 000', '2–3 дні'], en: ['Custom CRM', 'Customers, deals, tasks, reports, roles. Integrated with site, bot and payments.', 'from $1,000', '2–3 days'] },
      { id: 'fix', uk: ['Сайт є, але не продає', 'Аудит, переробка на конверсію, пікселі й аналітика.', '$150', '1 день'], en: ['Your site doesn\'t sell', 'Audit, conversion rework, pixels and analytics.', '$150', '1 day'] },
    ],
  },
  {
    id: 'apps',
    uk: { pain: 'Потрібен додаток або гра', hint: 'Студії рахують місяцями, а клієнти вже сидять у телефоні й Telegram' },
    en: { pain: 'I need an app or a game', hint: 'Studios quote months, while your customers already live in their phones and Telegram' },
    items: [
      { id: 'tma', uk: ['Telegram Mini App', 'Магазин, запис або бонусна картка прямо в Telegram. Без встановлення.', 'від $600', '3–5 днів'], en: ['Telegram Mini App', 'A store, booking or a loyalty card right inside Telegram. Nothing to install.', 'from $600', '3–5 days'] },
      { id: 'mobile', uk: ['Мобільний додаток', 'Перша версія для iOS і Android: вхід, каталог або запис, оплата, сповіщення.', 'від $2 500', '2–3 тижні + перевірка в магазинах'], en: ['Mobile app', 'First version for iOS and Android: sign-in, catalog or booking, payments, notifications.', 'from $2,500', '2–3 weeks + store review'] },
      { id: 'minigame', uk: ['Рекламна міні-гра', 'Колесо призів, скретч-картка або вікторина. Гравець лишає контакт, щоб забрати приз.', 'від $250', '1–2 дні'], en: ['Promo mini-game', 'Prize wheel, scratch card or quiz. The player leaves a contact to claim the prize.', 'from $250', '1–2 days'] },
      { id: 'loyalty', uk: ['Гейміфікація лояльності', 'Рівні, завдання і бонуси в боті або додатку. Щоб клієнти поверталися за наступною нагородою.', 'від $400', '2–3 дні'], en: ['Gamified loyalty', 'Levels, quests and bonuses in a bot or an app. So customers come back for the next reward.', 'from $400', '2–3 days'] },
    ],
  },
];

// Вхідний продукт: дешево, без ризику, зараховується в будь-який проєкт
export const ENTRY = {
  id: 'audit',
  uk: ['ШІ-аудит бізнесу', 'За день розбираємо, що у вашому бізнесі автоматизувати, скільки це заощадить і з чого почати. $100 зараховуємо в будь-який наступний проєкт.', '$100', '1 день', 'Замовити аудит'],
  en: ['AI business audit', 'In a day we map what to automate in your business, how much it saves and where to start. The $100 counts towards any next project.', '$100', '1 day', 'Order the audit'],
};

export const EXTRAS = {
  uk: 'Також: логотип і фірмовий стиль – $80, презентація або комерційна пропозиція – $60, лендинг під рекламу – $150.',
  en: 'Also: logo and identity – $80, presentation or proposal – $60, landing page for ads – $150.',
};

export const allItems = () => [ENTRY, ...PAINS.flatMap((p) => p.items)];
