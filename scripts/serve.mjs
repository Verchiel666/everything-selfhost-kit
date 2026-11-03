// 零依赖静态服务器（ESM, node 24）
// 用法: node serve.mjs <root> [port] [host]
// 特性: 带扩展名的 404 + 跨应用回退（有些应用硬编码了根路径资源，如 /photo-engine.wasm）
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 8080);
const host = process.argv[4] || '0.0.0.0';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.wasm': 'application/wasm', '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf',
};

const apps = (await readdir(root, { withFileTypes: true }))
  .filter((d) => d.isDirectory()).map((d) => d.name);

function send(res, file, size) {
  res.writeHead(200, {
    'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'content-length': size,
    'cache-control': file.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  createReadStream(file).pipe(res);
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const rel = decodeURIComponent(url.pathname);
    let p = path.join(root, rel);
    if (!p.startsWith(root)) { res.writeHead(403).end('forbidden'); return; }
    let st = await stat(p).catch(() => null);
    if (st?.isDirectory()) { p = path.join(p, 'index.html'); st = await stat(p).catch(() => null); }
    if (st?.isFile()) return send(res, p, st.size);

    // 跨应用回退：/photo-engine.wasm 这类根路径资源
    if (path.extname(rel)) {
      for (const app of apps) {
        const q = path.join(root, app, rel);
        const s2 = await stat(q).catch(() => null);
        if (s2?.isFile()) { console.log('fallback', rel, '->', app); return send(res, q, s2.size); }
      }
      console.log('404', rel);
      res.writeHead(404).end('not found'); return;
    }
    // SPA 回退
    const fallback = path.join(root, 'index.html');
    const fs2 = await stat(fallback).catch(() => null);
    if (!fs2) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': MIME['.html'], 'cache-control': 'no-cache' });
    createReadStream(fallback).pipe(res);
  } catch (e) {
    res.writeHead(500).end('error: ' + e.message);
  }
}).listen(port, host, () => console.log(`serving ${root} at http://${host}:${port}/ (apps: ${apps.length})`));
