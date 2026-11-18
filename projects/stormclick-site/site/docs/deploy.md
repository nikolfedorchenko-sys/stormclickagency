# Деплой

## Сайт: Cloudflare Pages (через GitHub)

Один раз підключаємо репозиторій, далі кожен push у production-гілку деплоїться сам.

> Сайт лежить не в корені репозиторію, а в теці `projects/stormclick-site/site`.
> Тому в Cloudflare Pages обов'язково вказати **Root directory** – інакше збірка не знайде `package.json`.

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → вкладка **Pages** → **Connect to Git**.
2. Авторизувати GitHub і вибрати репозиторій `nikolfedorchenko-sys/stormclickagency`.
3. Налаштування збірки:
   - Production branch: `main`
   - Framework preset: **Vite**
   - Root directory (advanced): `projects/stormclick-site/site`
   - Build command: `npm run build`
   - Build output directory: `dist` (відносно Root directory, тобто `projects/stormclick-site/site/dist`)
   - Node: береться з файлу `.node-version` (22) у тій самій теці
4. **Save and Deploy**. Через 1–2 хвилини сайт доступний на `<project>.pages.dev`.
5. **Custom domains** → додати `stormclick.agency` (і `www`). Якщо домен уже в Cloudflare, DNS-запис створиться сам.

Гілки, крім production, отримують preview-посилання виду `<branch>.<project>.pages.dev` – зручно дивитися зміни до злиття в `main`.

## ШІ-асистент і заявки: Cloudflare Worker

Виконується з папки `projects/stormclick-site/site/worker/` на своєму комп'ютері (потрібен Node 20+):

```
cd projects/stormclick-site/site/worker
npm install
npx wrangler login            # відкриє браузер, один раз
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler deploy
```

Після деплою wrangler покаже адресу виду `https://stormclick-assistant.<account>.workers.dev`.
Її треба вписати в `projects/stormclick-site/site/src/config.js` → `apiBase`, а домен сайту має бути в `ALLOWED_ORIGINS`
у `worker/wrangler.toml`. Після цього push у `main` – і асистент на сайті стає живим.

Як отримати `TELEGRAM_CHAT_ID`: написати боту будь-що, відкрити
`https://api.telegram.org/bot<TOKEN>/getUpdates` і взяти `chat.id`.
