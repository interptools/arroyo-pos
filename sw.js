const CACHE_NAME = 'arroyo-pos-v3';
const ASSETS = [
  '/arroyo-pos/',
  '/arroyo-pos/index.html',
  '/arroyo-pos/manifest.json',
  '/arroyo-pos/icon-192.png',
  '/arroyo-pos/icon-512.png'
];

// Install - cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate - delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch - cache first, then network
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if(event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if(cached) return cached;
      // Not in cache - fetch from network and cache it
      return fetch(event.request).then(response => {
        if(!response || response.status !== 200) return response;
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return response;
      }).catch(() => {
        // Network failed - return cached index.html as fallback
        return caches.match('/arroyo-pos/index.html');
      });
    })
  );
});
