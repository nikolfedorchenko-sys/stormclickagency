#!/usr/bin/env node
// Збирає теку dist/ – рівно те, що викладається на Cloudflare Pages (без tools/, integrations/, shots*/, img/src/, README.md).
// Заодно додає до посилань на css/ і js/ ?v=<хеш вмісту>: у _headers ці файли кешуються на рік (immutable),
// тож після кожної зміни CSS/JS адреса міняється сама, і відвідувачі не застрягнуть зі старою версією.
// Запуск із теки site/:  node tools/build-dist.cjs   →   dist/   (потім: npx wrangler pages deploy dist --project-name <назва>)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist');
const FILES = ['index.html', 'wizard.html', 'privacy.html', '404.html', 'favicon.ico', 'site.webmanifest', 'robots.txt', 'sitemap.xml', '_headers'];
const DIRS = ['css', 'js', 'fonts', 'icons', 'img'];
const SKIP = new Set([path.join(ROOT, 'img', 'src')]);

fs.rmSync(OUT, { recursive: true, force: true });
function copy(src, dst) {
  if (SKIP.has(src)) return;
  const st = fs.statSync(src);
  if (st.isDirectory()) { fs.mkdirSync(dst, { recursive: true }); for (const f of fs.readdirSync(src)) copy(path.join(src, f), path.join(dst, f)); }
  else fs.copyFileSync(src, dst);
}
fs.mkdirSync(OUT, { recursive: true });
for (const f of FILES) copy(path.join(ROOT, f), path.join(OUT, f));
for (const d of DIRS) copy(path.join(ROOT, d), path.join(OUT, d));

const hash = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex').slice(0, 10);
for (const page of FILES.filter(f => f.endsWith('.html'))) {
  const p = path.join(OUT, page);
  const t = fs.readFileSync(p, 'utf8').replace(/((?:href|src)="\/?)((?:css|js)\/[\w.-]+\.(?:css|js))"/g, (m, pre, f) => `${pre}${f}?v=${hash(f)}"`);
  fs.writeFileSync(p, t);
}
// у dist/ CSS і JS вже з ?v=<хеш> – можна кешувати на рік
const hp = path.join(OUT, '_headers');
const h = fs.readFileSync(hp, 'utf8').replace(/(\/(?:css|js)\/\*\n\s+Cache-Control: )public, max-age=3600/g, '$1public, max-age=31536000, immutable');
if (!/\/js\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/.test(h)) throw new Error('_headers: не знайшов правило для /js/* – перевірте файл');
fs.writeFileSync(hp, h);
let n = 0; (function count(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? count(p) : n++; } })(OUT);
console.log(`dist/ готово: ${n} файлів. Перевірте: grep -r "shturmova-varta.example" dist/ – після set-domain.py має бути порожньо.`);
