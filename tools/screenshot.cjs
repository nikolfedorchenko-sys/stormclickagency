#!/usr/bin/env node
// Скриншоти сторінки на трьох ширинах + технічні сигнали для візуального рев'ю.
//
// Використання:
//   node tools/screenshot.cjs <url або шлях до .html> [папка-результатів]
//
// Приклади:
//   node tools/screenshot.cjs http://localhost:5173 site/shots
//   node tools/screenshot.cjs clients/acme/design/mockup.html clients/acme/design/shots
//
// Потрібен Playwright. У хмарних сесіях Claude Code він уже встановлений.
// На своєму комп'ютері один раз: npm i -g playwright && npx playwright install chromium
// (скрипт сам знайде глобально встановлений пакет).
//
// Що робить:
//   - знімає перший екран, сторінку частинами по висоті екрана (part-01, part-02, …)
//     і всю сторінку цілком (лише для загальної композиції) на 360, 768 і 1440 px;
//   - збирає помилки консолі, помилки скриптів і ресурси, що не завантажились;
//   - перевіряє: вміст, ширший за екран; зображення без alt, без розмірів, биті;
//     дрібні зони натискання (< 44 px, лише на 360 і 768); текст < 14 px;
//     основний текст (p, li) < 16 px на мобільному; кількість h1, lang, шрифти;
//   - пише report.json і короткий підсумок у консоль.
//
// Примітка: кнопки й поля форми без `font: inherit` мають стандартний розмір
// браузера 13.33px – скрипт покаже їх у smallText; це справжній сигнал.
//
// Звіт – це сигнали для перевірки, а не вирок: хибне спрацювання треба
// пояснити, а не «виправляти».

const path = require('path');
const fs = require('fs');
function loadPlaywright() {
  try {
    return require('playwright');
  } catch (e) {
    // Node не шукає глобальні пакети сам – пробуємо глобальну теку npm.
    try {
      const globalRoot = require('child_process').execSync('npm root -g', { encoding: 'utf8' }).trim();
      return require(path.join(globalRoot, 'playwright'));
    } catch (e2) {
      console.error('Не знайдено Playwright. Встановіть: npm i -g playwright && npx playwright install chromium');
      process.exit(4);
    }
  }
}
const { chromium } = loadPlaywright();

const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 800, touch: true },
  { name: 'tablet-768', width: 768, height: 1024, touch: true },
  { name: 'desktop-1440', width: 1440, height: 900, touch: false },
];
const MAX_PARTS = 12;
const LIST_LIMIT = 15;

function toUrl(target) {
  if (/^https?:\/\//i.test(target) || target.startsWith('file://')) return target;
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) {
    console.error(`Файл не знайдено: ${abs}`);
    process.exit(2);
  }
  return 'file://' + abs;
}

async function open(page, url, warnings) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    return null;
  } catch (e) {
    if (/Timeout/i.test(e.message)) {
      // Аналітика й чати часто не дають мережі «затихнути» – це не помилка сторінки.
      warnings.push('networkidle не настав за 30 с; знімаю після події load');
      try {
        await page.waitForLoadState('load', { timeout: 15000 });
        return null;
      } catch (e2) {
        return e2.message;
      }
    }
    return e.message;
  }
}

async function autoScroll(page, warnings) {
  // Прокручуємо донизу, щоб підвантажились lazy-зображення та анімації появи.
  try {
    await page.evaluate(async () => {
      const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 300));
    });
  } catch (e) {
    warnings.push(`прокрутка не вдалася: ${e.message.slice(0, 150)}`);
  }
}

async function checks(page, isTouch) {
  return page.evaluate(({ isTouch, limit }) => {
    const doc = document.documentElement;
    const vw = doc.clientWidth;

    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none'
        && s.clip !== 'rect(0px, 0px, 0px, 0px)' && s.clipPath !== 'inset(50%)';
    };
    const describe = (el) => {
      const id = el.id ? `#${el.id}` : '';
      const cls = typeof el.className === 'string' && el.className.trim()
        ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
        : '';
      const text = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('src') || '')
        .trim().replace(/\s+/g, ' ').slice(0, 40);
      return `${el.tagName.toLowerCase()}${id}${cls}${text ? ` «${text}»` : ''}`;
    };
    const clippedByAncestor = (el) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (/(hidden|clip|auto|scroll)/.test(s.overflowX)) return true;
      }
      return false;
    };
    const list = (arr) => ({ count: arr.length, items: arr.slice(0, limit) });

    // Вміст, ширший за екран. Окремо – чи може користувач реально прокрутити вбік.
    const contentWiderPx = Math.max(0, doc.scrollWidth - vw);
    const htmlS = getComputedStyle(doc);
    const bodyS = getComputedStyle(document.body);
    const canScrollSideways = contentWiderPx > 0
      && !/(hidden|clip)/.test(htmlS.overflowX) && !/(hidden|clip)/.test(bodyS.overflowX);
    const wideElements = contentWiderPx > 0
      ? [...document.querySelectorAll('body *')]
          .filter((el) => visible(el) && el.getBoundingClientRect().right > vw + 1 && !clippedByAncestor(el))
          .map(describe)
      : [];

    const imgs = [...document.images];
    const imgNoAlt = imgs.filter((i) => !i.hasAttribute('alt')).map(describe);
    const imgNoSize = imgs.filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).map(describe);
    const imgBroken = imgs.filter((i) => i.complete && i.naturalWidth === 0).map(describe);

    // Зони натискання – лише для сенсорних екранів.
    let smallTapTargets = [];
    if (isTouch) {
      smallTapTargets = [...document.querySelectorAll('a, button, input, select, textarea, [role="button"]')]
        .filter(visible)
        .filter((el) => {
          // Посилання всередині тексту – норма, їх не рахуємо.
          if (el.tagName === 'A' && getComputedStyle(el).display === 'inline'
              && el.closest('p, li, td, dd, blockquote, figcaption')) return false;
          if (el.type === 'hidden') return false;
          return true;
        })
        .map((el) => {
          // Для поля всередині label реальна зона – весь label.
          const target = (el.tagName === 'INPUT' && el.closest('label')) || el;
          return { el, r: target.getBoundingClientRect() };
        })
        .filter(({ r }) => r.width < 44 || r.height < 44)
        .map(({ el, r }) => `${describe(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
    }

    // Дрібний текст: рахуємо лише елементи з власним текстом, щоб не дублювати батька і дитину.
    const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 2);
    const textEls = [...document.querySelectorAll('body *')].filter((el) => visible(el) && ownText(el));
    const smallText = textEls
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 14)
      .map((el) => `${describe(el)} ${getComputedStyle(el).fontSize}`);
    const bodyTextUnder16 = isTouch
      ? textEls
          .filter((el) => /^(P|LI)$/.test(el.tagName))
          .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
          .map((el) => `${describe(el)} ${getComputedStyle(el).fontSize}`)
      : [];

    const fonts = [...new Set(textEls.map((el) => getComputedStyle(el).fontFamily.split(',')[0].trim()))];

    return {
      title: document.title,
      lang: doc.getAttribute('lang'),
      h1Count: document.querySelectorAll('h1').length,
      contentWiderThanScreenPx: contentWiderPx,
      canScrollSideways,
      wideElements: list(wideElements),
      imgNoAlt: list(imgNoAlt),
      imgNoSize: list(imgNoSize),
      imgBroken: list(imgBroken),
      smallTapTargets: list(smallTapTargets),
      smallText: list(smallText),
      bodyTextUnder16: list(bodyTextUnder16),
      fontFamiliesUsed: fonts.slice(0, 8),
      pageHeightPx: doc.scrollHeight,
    };
  }, { isTouch, limit: LIST_LIMIT });
}

async function partScreenshots(page, vp, outDir) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const parts = Math.min(MAX_PARTS, Math.ceil(height / vp.height));
  const files = [];
  for (let i = 0; i < parts; i++) {
    const file = path.join(outDir, `${vp.name}-part-${String(i + 1).padStart(2, '0')}.png`);
    await page.screenshot({
      path: file,
      fullPage: true,
      clip: { x: 0, y: i * vp.height, width: vp.width, height: Math.min(vp.height, height - i * vp.height) },
    });
    files.push(file);
  }
  return { files, truncated: height > MAX_PARTS * vp.height };
}

(async () => {
  const target = process.argv[2];
  if (!target) {
    console.error('Вкажіть URL або шлях до HTML: node tools/screenshot.cjs <url|файл> [папка]');
    process.exit(2);
  }
  const url = toUrl(target);
  const outDir = path.resolve(process.argv[3] || 'shots');
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const report = { url, takenAt: new Date().toISOString(), viewports: {} };

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.touch && vp.width < 768,
      hasTouch: vp.touch,
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const failedRequests = [];
    const warnings = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e.message).slice(0, 200)}`));
    page.on('requestfailed', (r) => failedRequests.push(`${r.url().slice(0, 150)} – ${r.failure()?.errorText}`));
    page.on('response', (r) => { if (r.status() >= 400) failedRequests.push(`${r.url().slice(0, 150)} – HTTP ${r.status()}`); });

    const openError = await open(page, url, warnings);
    if (openError) {
      await browser.close();
      console.error(`Сторінка не відкрилась (${vp.name}): ${openError.split('\n')[0]}`);
      console.error('Перевірте, що сервер запущено і адреса правильна.');
      process.exit(3);
    }
    await autoScroll(page, warnings);
    await page.waitForTimeout(500);

    const first = path.join(outDir, `${vp.name}-first-screen.png`);
    const full = path.join(outDir, `${vp.name}-full.png`);
    await page.screenshot({ path: first });
    const parts = await partScreenshots(page, vp, outDir);
    await page.screenshot({ path: full, fullPage: true });
    if (parts.truncated) warnings.push(`сторінка довша за ${MAX_PARTS} екранів – частини зняті лише для початку; решту дивіться на ${path.basename(full)}`);

    report.viewports[vp.name] = {
      screenshots: { firstScreen: first, parts: parts.files, fullPage: full },
      warnings,
      consoleErrors,
      failedRequests,
      ...(await checks(page, vp.touch)),
    };
    await context.close();
  }
  await browser.close();

  const reportPath = path.join(outDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Сторінка: ${url}`);
  for (const [name, r] of Object.entries(report.viewports)) {
    const issues = [];
    if (r.canScrollSideways) issues.push(`горизонтальна прокрутка ${r.contentWiderThanScreenPx}px`);
    else if (r.contentWiderThanScreenPx > 0) issues.push(`вміст ширший за екран на ${r.contentWiderThanScreenPx}px (прокрутку приховано – перевірте, чи нічого не обрізано)`);
    if (r.consoleErrors.length) issues.push(`помилок консолі: ${r.consoleErrors.length}`);
    if (r.failedRequests.length) issues.push(`не завантажилось ресурсів: ${r.failedRequests.length}`);
    if (r.imgBroken.count) issues.push(`битих зображень: ${r.imgBroken.count}`);
    if (r.imgNoAlt.count) issues.push(`зображень без alt: ${r.imgNoAlt.count}`);
    if (r.smallTapTargets.count) issues.push(`дрібних зон натискання: ${r.smallTapTargets.count}`);
    if (r.smallText.count) issues.push(`елементів з текстом < 14px: ${r.smallText.count}`);
    if (r.bodyTextUnder16.count) issues.push(`абзаців і пунктів < 16px: ${r.bodyTextUnder16.count}`);
    if (r.warnings.length) issues.push(`попереджень: ${r.warnings.length}`);
    console.log(`- ${name}: ${issues.length ? issues.join('; ') : 'технічних сигналів немає'}`);
  }
  console.log(`Скриншоти й повний звіт: ${outDir}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
