const CACHE = 'ccr-v2';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './js/utils.js',
  './js/audio.js',
  './js/config.js',
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

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }

      return fetch(event.request).then(response => {
        if (
          response &&
          response.status === 200 &&
          response.type === 'basic' &&
          new URL(event.request.url).origin === self.location.origin
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      });
    })
  );
});
