// Offline-Unterstützung: App-Dateien werden beim ersten Besuch gespeichert.
// Bei einer neuen Version die Nummer erhöhen, damit Handys die neue Fassung laden.
const VERSION = 'rba-v3';
const APP = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-64.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(APP)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Schriften von Google: einmal laden, dann aus dem Speicher
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(VERSION + '-fonts').then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      try { const res = await fetch(req); c.put(req, res.clone()); return res; } catch (_) { return hit || Response.error(); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // Mit Internet immer die neueste Fassung laden, ohne Internet die gespeicherte
  e.respondWith(caches.open(VERSION).then(async c => {
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok) c.put(req, res.clone());
      return res;
    } catch (_) {
      const hit = await c.match(req, { ignoreSearch: true });
      return hit || (req.mode === 'navigate' ? c.match('./index.html') : Response.error());
    }
  }));
});
