const CACHE_NAME = 'calculo-flash-v4';

// Rutas RELATIVAS (funciona en GitHub Pages /Calculo-Flash/)
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './firebase-config.js',
  './ads-premium.js'
];

// Instalación: cachea assets locales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(LOCAL_ASSETS).catch(() => Promise.resolve()))
      .then(() => self.skipWaiting())
  );
});

// Activación: limpia caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Firestore/APIs dinámicas: siempre red (nunca cachear datos)
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('ipapi.co')) {
    return; // dejar pasar directo a la red
  }

  // SDKs y fuentes externas: network con fallback a cache
  if (url.hostname.includes('gstatic.com') ||
      url.hostname.includes('googleapis.com')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Assets propios: cache-first con fallback a network
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(res => {
            if (res && res.status === 200 && res.type !== 'error') {
              const clone = res.clone();
              caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
            }
            return res;
          })
          .catch(() => {
            // Fallback offline: servir index.html para navegación
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});
