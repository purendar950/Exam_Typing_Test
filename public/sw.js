// Exam Typing - Service Worker
const CACHE_NAME = 'up-typing-cache-v4';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './fonts/KrutiDev010.ttf'
];

// Install: pre-cache static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Pre-cache partial warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

function putInCache(request, response) {
  if (response && response.status === 200 && response.type === 'basic') {
    const clone = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
  }
  return response;
}

// Network first: always show the newest deploy, use the cache only when offline.
function networkFirst(request, fallbackUrl) {
  return fetch(request)
    .then((response) => putInCache(request, response))
    .catch(() =>
      caches.match(request).then((cached) => cached || (fallbackUrl ? caches.match(fallbackUrl) : undefined))
    )
    .then((response) => response || Response.error());
}

// Cache first: only for build files whose name contains a content hash, so a
// cached copy can never be out of date.
function cacheFirst(request) {
  return caches.match(request).then(
    (cached) => cached || fetch(request).then((response) => putInCache(request, response))
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Leave Firebase, Google and every other third-party request to the browser
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, './index.html'));
    return;
  }

  if (url.pathname.includes('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
