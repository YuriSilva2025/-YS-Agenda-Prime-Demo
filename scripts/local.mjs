import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('out');
const port = Number(process.env.PORT || 3000);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { res.writeHead(400); res.end(); return; }

    let file = resolve(root, '.' + pathname);
    if (!file.startsWith(root + sep) && file !== root) {
      res.writeHead(403); res.end(); return;
    }

    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, {
        'Content-Type': types[extname(file)] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('Página não encontrada');
    }
  } catch {
    res.writeHead(500);
    res.end('Erro local');
  }
}).listen(port, '127.0.0.1', () => console.log(`Agenda Prime Demo: http://127.0.0.1:${port}`));
