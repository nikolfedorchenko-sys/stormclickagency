#!/usr/bin/env node
// Скриншоти сторінки на трьох ширинах + технічні перевірки для візуального рев'ю.
//
// Використання:
//   node tools/screenshot.cjs <url або шлях до .html> [папка-результатів]
//
// Приклади:
//   node tools/screenshot.cjs http://localhost:5173 shots/
//   node tools/screenshot.cjs clients/acme/landing/index.html
//
// Що робить:
//   - знімає перший екран і всю сторінку на 360, 768 і 1440 px;
//   - збирає помилки консолі, помилки скриптів і ресурси, що не завантажились;
//   - перевіряє горизонтальну прокрутку, зображення без alt, зображення без
//     розмірів, дрібні зони натискання (< 44 px) і текст, дрібніший за 14 px;
//   - пише report.json і короткий підсумок у консоль.

const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const VIEWPORTS = [
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

function toUrl(target) {
  if (/^https?:\/\//i.test(target) || target.startsWith('file://')) return target;
  const abs = path.resolve(target);
  if (!fs.existsSync(abs)) {
    console.error(`Файл не знайдено: ${abs}`);
    process.exit(2);
  }
  return 'file://' + abs;
}

async function autoScroll(page) {
  // Прокручуємо донизу, щоб підвантажились lazy-зображення та анімації появи.
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
}

async function checks(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
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

    const overflow = doc.scrollWidth - doc.clientWidth;
    const wideElements = overflow > 0
      ? [...document.querySelectorAll('body *')]
          .filter((el) => visible(el) && el.getBoundingClientRect().right > doc.clientWidth + 1)
          .slice(0, 5).map(describe)
      : [];

    const imgs = [...document.images];
    const imgNoAlt = imgs.filter((i) => !i.hasAttribute('alt')).map(describe).slice(0, 10);
    const imgNoSize = imgs
      .filter((i) => !i.getAttribute('width') || !i.getAttribute('height'))
      .map(describe).slice(0, 10);
    const imgBroken = imgs.filter((i) => i.complete && i.naturalWidth === 0).map(describe).slice(0, 10);

    const tapTargets = [...document.querySelectorAll('a, button, input, select, textarea, [role="button"]')]
      .filter(visible)
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width < 44 || r.height < 44;
      })
      .map((el) => {
        const r = el.getBoundingClientRect();
        return `${describe(el)} ${Math.round(r.width)}×${Math.round(r.height)}`;
      })
      .slice(0, 10);

    const smallText = [...document.querySelectorAll('p, li, span, a, label, td, small, button')]
      .filter((el) => visible(el) && el.innerText && el.innerText.trim().length > 2)
      .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 14)
      .map((el) => `${describe(el)} ${getComputedStyle(el).fontSize}`)
      .slice(0, 10);

    const fonts = [...new Set([...document.querySelectorAll('body *')]
      .filter(visible).map((el) => getComputedStyle(el).fontFamily.split(',')[0].trim()))];

    return {
      title: document.title,
      lang: doc.getAttribute('lang'),
      h1Count: document.querySelectorAll('h1').length,
      horizontalOverflowPx: overflow,
      wideElements,
      imgNoAlt,
      imgNoSize,
      imgBroken,
      smallTapTargets: tapTargets,
      smallText,
      fontFamiliesUsed: fonts.slice(0, 8),
      pageHeightPx: doc.scrollHeight,
    };
  });
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
      isMobile: vp.width < 768,
      hasTouch: vp.width < 768,
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const failedRequests = [];
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });
    page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${String(e.message).slice(0, 200)}`));
    page.on('requestfailed', (r) => failedRequests.push(`${r.url().slice(0, 150)} – ${r.failure()?.errorText}`));
    page.on('response', (r) => { if (r.status() >= 400) failedRequests.push(`${r.url().slice(0, 150)} – HTTP ${r.status()}`); });

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    } catch (e) {
      consoleErrors.push(`goto: ${e.message.slice(0, 200)}`);
    }
    await autoScroll(page);
    await page.waitForTimeout(500);

    const first = path.join(outDir, `${vp.name}-first-screen.png`);
    const full = path.join(outDir, `${vp.name}-full.png`);
    await page.screenshot({ path: first });
    await page.screenshot({ path: full, fullPage: true });

    report.viewports[vp.name] = {
      screenshots: { firstScreen: first, fullPage: full },
      consoleErrors,
      failedRequests,
      ...(await checks(page)),
    };
    await context.close();
  }
  await browser.close();

  const reportPath = path.join(outDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`Сторінка: ${url}`);
  for (const [name, r] of Object.entries(report.viewports)) {
    const issues = [];
    if (r.horizontalOverflowPx > 0) issues.push(`горизонтальна прокрутка ${r.horizontalOverflowPx}px`);
    if (r.consoleErrors.length) issues.push(`помилок консолі: ${r.consoleErrors.length}`);
    if (r.failedRequests.length) issues.push(`не завантажилось ресурсів: ${r.failedRequests.length}`);
    if (r.imgBroken.length) issues.push(`битих зображень: ${r.imgBroken.length}`);
    if (r.imgNoAlt.length) issues.push(`зображень без alt: ${r.imgNoAlt.length}`);
    const n = (a) => (a.length >= 10 ? `${a.length}+` : a.length);
    if (r.smallTapTargets.length) issues.push(`дрібних зон натискання: ${n(r.smallTapTargets)}`);
    if (r.smallText.length) issues.push(`елементів з текстом < 14px: ${n(r.smallText)}`);
    console.log(`- ${name}: ${issues.length ? issues.join('; ') : 'технічних проблем не знайдено'}`);
  }
  console.log(`Скриншоти й повний звіт: ${outDir}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
