# StormClick

Сайт-візитівка digital-агенції StormClick. Статичний HTML/CSS/JS без збірки – швидкий для платного трафіку.

## Структура

- `index.html` – сторінка
- `assets/css/style.css` – стилі (кольори у змінних `:root`)
- `assets/js/i18n.js` – тексти українською та англійською
- `assets/js/config.js` – контакти (Telegram, WhatsApp, email) і адреса для заявок
- `assets/js/main.js` – перемикач мов, меню, форма

## Мова

Перемикач UA/EN у шапці. Мову можна задати посиланням: `?lang=en` або `?lang=uk` (зручно для окремих рекламних кампаній).

## Заявки

Якщо `formEndpoint` у `config.js` порожній, форма відкриває Telegram з текстом заявки (і копіює його в буфер).
Для збору заявок вкажіть URL сервісу, що приймає JSON POST (Formspree, Cloudflare Worker з пересиланням у Telegram-бота тощо).

## Локальний запуск

```
python3 -m http.server 8000
```
