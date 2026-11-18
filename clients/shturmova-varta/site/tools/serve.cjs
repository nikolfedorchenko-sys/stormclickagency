#!/usr/bin/env node
// Мінімальний локальний сервер для перевірки сайту (без залежностей). Як на хостингу:
// / -> index.html, відсутня адреса -> 404.html зі статусом 404.
// Запуск із будь-якої теки:  node tools/serve.cjs [порт]   (за замовчуванням 8080)
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PORT = +process.argv[2] || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, path.normalize(p));
  const send = (code, file) => {
    res.writeHead(code, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  };
  if (!f.startsWith(ROOT)) { res.writeHead(400); return res.end(); }
  fs.stat(f, (err, st) => (err || !st.isFile()) ? send(404, path.join(ROOT, '404.html')) : send(200, f));
}).listen(PORT, '127.0.0.1', () => console.log(`http://localhost:${PORT}`));
