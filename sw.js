const CACHE = 'ccr-v14';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './js/utils.js',
  './js/audio.js',
  './js/config.js',
  './js/sprites.js',
  './js/renderer.js',
  './js/state.js',
  './js/character.js',
  './js/gates.js',
  './js/crates.js',
  './js/hazards.js',
  './js/level.js',
  './js/shop.js',
  './js/lobby.js',
  './js/main.js',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
  clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const isNavigation = event.request.mode === 'navigate' || event.request.destination === 'document';
  const isSameOrigin = new URL(event.request.url).origin === self.location.origin;

  if (isNavigation) {
    // Network-first for navigations (index.html, etc.)
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic' && isSameOrigin) {
          const responseToCache = response.clone();
          caches.open(CACHE).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        return caches.match('./index.html');
      })
    );
  } else if (isSameOrigin) {
    // Stale-while-revalidate for same-origin GETs
    event.respondWith(
      caches.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(fetchResponse => {
          if (
            fetchResponse &&
            fetchResponse.status === 200 &&
            fetchResponse.type === 'basic'
          ) {
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return fetchResponse;
        });
        return response || fetchPromise;
      })
    );
  } else {
    // Cache-first for cross-origin or other GETs
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request);
      })
    );
  }
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
