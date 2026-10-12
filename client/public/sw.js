const CACHE_NAME = 'oldamsterdam-ch-v9';
const STATIC_ASSETS = [
  '/favicon.svg',
  '/favicon.ico',
  '/favicon-96x96.png',
  '/apple-touch-icon.png',
  '/og-image.jpg',
  '/fonts/CronosPro-Semibold.otf',
  '/fonts/CronosW01-Regular.ttf',
  '/fonts/fa-regular-400.woff2',
  '/fonts/fa-solid-900.woff2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((url) => cache.add(url).catch(() => {}))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/@') ||
    url.pathname.includes('__vite') ||
    url.pathname === '/sw.js'
  ) {
    return;
  }

  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  if (url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          }
          return caches.match(request).then((cached) => cached || response);
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (url.pathname.match(/\.(woff|woff2|ttf|otf|eot|css|js)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }
});
