#!/usr/bin/env node
// Мінімальний локальний сервер для перевірки сайту (без залежностей). Поводиться як Cloudflare Pages:
//   /            -> index.html
//   /wizard      -> wizard.html (адреси без .html)
//   /wizard.html -> 308 на /wizard, /index.html -> 308 на /, /wizard/ -> 308 на /wizard (параметри зберігаються)
//   відсутня адреса -> 404.html зі статусом 404
//   заголовки з _headers (шляхові правила; правила з доменом, напр. *.pages.dev, локально пропускаються)
//   _headers, _redirects, tools/, integrations/, shots*/, img/src/, README.md не віддаються (на хостинг їх не викладаємо)
// Запуск із будь-якої теки:  node tools/serve.cjs [порт]   (за замовчуванням 8080)
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = +process.argv[2] || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const HIDDEN = /^\/(_headers|_redirects|README\.md|tools\/|integrations\/|shots[^/]*\/|img\/src\/)/;

// _headers: блоки «шлях» + рядки з відступом «Назва: значення»; * – будь-які символи
function loadHeaders() {
  let src = ''; try { src = fs.readFileSync(path.join(ROOT, '_headers'), 'utf8'); } catch (e) { return []; }
  const rules = []; let cur = null;
  for (const line of src.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) { cur = { pat: line.trim(), h: [] }; rules.push(cur); continue; }
    const m = line.trim().match(/^([^:]+):\s*(.*)$/); if (cur && m) cur.h.push([m[1], m[2]]);
  }
  return rules.filter(r => r.pat.startsWith('/')).map(r => ({ re: new RegExp('^' + r.pat.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'), h: r.h }));
}
function headersFor(p) {
  const out = {};
  for (const r of loadHeaders()) if (r.re.test(p)) for (const [k, v] of r.h) out[k] = out[k] ? out[k] + ', ' + v : v;
  return out;
}

http.createServer((req, res) => {
  let u, p;
  try { u = new URL(req.url, 'http://x'); p = decodeURIComponent(u.pathname); }
  catch (e) { res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Bad request'); } // напр. «/%E0%A4%A»
  if (p.includes('\0')) { res.writeHead(400); return res.end(); }
  const redirect = to => { res.writeHead(308, { Location: to + u.search }); res.end(); };
  // як Pages: .html прибираємо, index – це корінь, зайвий / в кінці – прибираємо
  if (/\/index(\.html)?$/.test(p)) return redirect(u.pathname.replace(/index(\.html)?$/, ''));
  if (p.endsWith('.html') && p !== '/404.html') return redirect(u.pathname.slice(0, -5));
  if (p.length > 1 && p.endsWith('/')) return redirect(u.pathname.slice(0, -1));
  const send = (code, file) => {
    // Cache-Control з _headers локально не застосовуємо: під час розробки браузер не повинен тримати старий CSS
    res.writeHead(code, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', ...headersFor(p), 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  };
  const notFound = () => send(404, path.join(ROOT, '404.html'));
  if (HIDDEN.test(p)) return notFound();
  let f = path.join(ROOT, path.normalize(p === '/' ? '/index.html' : p));
  if (!f.startsWith(ROOT)) { res.writeHead(400); return res.end(); }
  if (!path.extname(f) && fs.existsSync(f + '.html')) f += '.html';
  fs.stat(f, (err, st) => (err || !st.isFile()) ? notFound() : send(200, f));
}).listen(PORT, '127.0.0.1', () => console.log(`http://localhost:${PORT}`));
