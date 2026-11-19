/* Налаштування сайту «Штурмова варта». Єдине місце, яке треба редагувати перед запуском.
   Тут НЕ можна зберігати ключі, токени чи паролі: файл публічний, його бачить кожен відвідувач.
   Ключі (Telegram-бота, Formspree тощо) живуть лише на сервері-приймачі (див. README, «Заявки»). */
window.SV_CONFIG = {
  /* ---------- Заявки ---------- */
  // Адреса, куди майстер надсилає заявку методом POST (JSON). Порожньо – заявки онлайн НЕ надсилаються:
  // клієнт бачить «Залишився один крок – подзвоніть» і всі свої відповіді.
  // Приклади: 'https://formspree.io/f/xxxxxxx' або 'https://zayavky.<ваш-акаунт>.workers.dev'  [уточнити]
  ENDPOINT: '',
  // 'json' – тіло application/json (Formspree, Cloudflare Worker); 'form' – application/x-www-form-urlencoded.
  ENDPOINT_FORMAT: 'json',
  // Скільки чекати відповіді сервера, мс. Після – стан «Не вдалося надіслати заявку» з повтором.
  TIMEOUT_MS: 15000,
  // Антиспам: мінімальний час від відкриття майстра до надсилання, мс. Швидше – вважаємо ботом.
  // Те саме число – у змінній MIN_FILL_MS приймача (integrations/cloudflare-worker.js), інакше сервер і сайт розійдуться.
  MIN_FILL_MS: 3000,
  // Cloudflare Turnstile (захист від ботів, необов’язково). Публічний site key з панелі Cloudflare – його можна тут.
  // Секретний ключ – ЛИШЕ в приймачі (TURNSTILE_SECRET у воркері). Порожньо – Turnstile не завантажується взагалі.  [уточнити]
  TURNSTILE_SITEKEY: '',

  /* ---------- Контакти ---------- */
  PHONE: '+380675495710',            // для tel:
  PHONE_DISPLAY: '+380 67 549 5710', // як показувати
  // E-mail для заявок. Якщо задано – у стані «подзвоніть» з’явиться кнопка листа з відповідями.  [уточнити]
  EMAIL: '',
  // Посилання на канали компанії, напр. 'https://t.me/...' і 'viber://chat?number=%2B380...'  [уточнити]
  // Якщо задано хоч одне – зникає рядок «Telegram і Viber – [уточнити], чи підключені», а в стані
  // «подзвоніть» з’являються кнопки «Написати в Telegram / Viber».
  TELEGRAM_URL: '',
  VIBER_URL: '',

  /* ---------- Тексти, яких поки немає ---------- */
  // Графік телефонної лінії, напр. 'щодня 08:00–22:00'. Порожньо – на сайті «[уточнити]».
  LINE_HOURS: '',
  // За скільки менеджер передзвонює, напр. 'протягом 30 хвилин у робочий час'. Порожньо – «[уточнити…]».
  CALLBACK_TIME: '',
  // Посилання на ліцензію (документ чи реєстр). Порожньо – у футері звичайний текст без посилання.
  LICENSE_URL: ''

  /* ---------- Аналітика (нічого не підключено) ----------
     Коли будуть ідентифікатори – вставте код лічильників у <head> index.html, wizard.html і privacy.html
     (або сюди, як нижче) і розкоментуйте. Ідентифікатори – лише від клієнта, не вигадувати.

     GA4:
       // var GA4_ID = 'G-XXXXXXXXXX'; // [уточнити]
       // (function(){var s=document.createElement('script');s.async=1;s.src='https://www.googletagmanager.com/gtag/js?id='+GA4_ID;document.head.appendChild(s);
       //   window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments);};gtag('js',new Date());gtag('config',GA4_ID);})();

     Meta Pixel:
       // var META_PIXEL_ID = '000000000000000'; // [уточнити]
       // !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
       //   if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
       //   s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
       //   fbq('init', META_PIXEL_ID); fbq('track', 'PageView');

     Події сайт уже надсилає через SV.track() (js/common.js) – вони спрацюють, щойно з’явиться gtag або fbq:
       click_call        – клік по будь-якому tel:-посиланню
       click_wizard      – клік по посиланню на майстер (кнопки «Залишити заявку», «Почати», картки, пігулки)
       wizard_step       – перехід на крок майстра (step: 1–4)
       lead_submit       – натиснули «Надіслати заявку» і поля пройшли перевірку
       generate_lead     – сервер прийняв заявку (для Meta – подія Lead)
       lead_error        – сервер не відповів або повернув помилку
       lead_offline      – ENDPOINT не задано або спрацював антиспам: показали «Залишився один крок – подзвоніть»
     Згоду на cookies (банер) для аналітики – погодити з юристом.  [уточнити] */
};
