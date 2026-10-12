# StormClick Worker

Cloudflare Worker, який ховає ключ Claude від сайту та приймає заявки.

- `POST /chat` – стрім відповіді ШІ-асистента (SSE). Асистент сам збирає заявку інструментом `submit_lead`.
- `POST /lead` – заявка з квізу на сайті.

Заявки надсилаються в Telegram (бот) і, за наявності `RESEND_API_KEY`, на email.

## Запуск

```
cd worker
npm install
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npm run deploy
```

Після деплою впишіть адресу воркера в `src/config.js` сайту: `apiBase: 'https://stormclick-assistant.<account>.workers.dev'`.

Як отримати `TELEGRAM_CHAT_ID`: створіть бота через @BotFather, напишіть йому будь-що, потім відкрийте
`https://api.telegram.org/bot<TOKEN>/getUpdates` і скопіюйте `chat.id`.
