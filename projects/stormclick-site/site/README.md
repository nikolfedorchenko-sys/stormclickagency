# StormClick

Сайт digital-агенції StormClick. Бриф – у [`docs/brief.md`](docs/brief.md).

## Стек

- [Vite](https://vite.dev) – збірка і dev-сервер
- [GSAP ScrollTrigger](https://gsap.com) + [Lenis](https://lenis.darkroom.engineering) – анімації на скролі і плавний скрол
- Шрифти Unbounded (заголовки) і Manrope (текст), вбудовані в збірку

## Структура

- `index.html` – розмітка
- `src/main.js` – запуск: анімації, скрол, мови
- `src/assistant.js` – ШІ-асистент (віджет), `src/quiz.js` – квіз-заявка
- `src/i18n.js` – тексти українською та англійською
- `src/config.js` – контакти (Telegram, WhatsApp, email)
- `src/styles/main.css` – стилі

## ШІ-асистент і заявки

Чат на сайті працює через Cloudflare Worker у папці `worker/` (Claude, ключ лишається на сервері).
Поки в `src/config.js` не вказано `apiBase`, асистент працює в демо-режимі зі сценарними відповідями,
а квіз відкриває Telegram із текстом заявки. Інструкція з деплою сайту і воркера – [`docs/deploy.md`](docs/deploy.md).

## Команди

```
npm install
npm run dev       # локальна розробка
npm run build     # збірка в dist/
npm run preview   # перегляд зібраної версії
```

## Мова

Перемикач UA/EN у шапці. Мову можна задати посиланням: `?lang=en` або `?lang=uk`.

