const CACHE_NAME = 'eddieb-fit-v1.2.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-maskable.svg'
];

// Install Event: Pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching partial failure, proceeding:', err);
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event: Clean up outdated caches and take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event: Stale-While-Revalidate for assets, Network-First with Offline fallback for navigation
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, chrome-extension, or cross-origin API calls (like Firestore / Gemini backend)
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;
  if (url.pathname.startsWith('/api/') || url.hostname.includes('firestore') || url.hostname.includes('googleapis')) {
    return;
  }

  // Handle SPA Navigation requests (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Clone and cache the updated HTML
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback to cached index.html or root
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          const fallbackShell = await caches.match('/index.html') || await caches.match('/');
          if (fallbackShell) return fallbackShell;
          return new Response('Offline - EDDIEB FIT MISSION is cached and ready for local workouts.', {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // Handle Static Assets (JS, CSS, Images, Fonts, Icons) -> Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If network fails and we have no cached item, return null/fallback
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Support Skip Waiting trigger
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
