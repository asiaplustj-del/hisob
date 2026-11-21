// Hisob — офлайн-кэш. Страница приложения: сначала сеть (сразу свежая версия), без сети — из кэша.
const CACHE = 'hisob-v7';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const isApp = url => { const p = new URL(url).pathname; return /\/hisob\/?$/.test(p) || p.endsWith('/hisob/index.html') || p === '/' || p.endsWith('/index.html'); };
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    if (!isApp(req.url)) return;                       // другие страницы (тест и т.п.) не трогаем
    e.respondWith(fetch(req, { cache: 'no-store' }).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put('./index.html', res.clone()));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
