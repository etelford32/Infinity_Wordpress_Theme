/**
 * Service Worker for Infinity Theme
 * Handles caching, offline support, and background sync
 */

const CACHE_VERSION = 'infinity-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// API routes to cache with network-first strategy
const API_ROUTES = [
  '/wp-json/infinity/v1/',
  '/graphql',
];

// Image extensions to cache
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];

// Max items in caches
const MAX_DYNAMIC_ITEMS = 50;
const MAX_IMAGE_ITEMS = 100;
const MAX_API_ITEMS = 30;

// Cache expiration times (in seconds)
const STATIC_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const DYNAMIC_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const IMAGE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const API_MAX_AGE = 60 * 5; // 5 minutes

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Failed to cache static assets:', err);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('infinity-') && name !== CACHE_VERSION)
            .filter((name) => !name.startsWith(CACHE_VERSION))
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - handle requests with appropriate caching strategy
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Determine caching strategy based on request type
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE, API_MAX_AGE));
  } else if (isImageRequest(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, IMAGE_MAX_AGE));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, STATIC_MAX_AGE));
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE, DYNAMIC_MAX_AGE));
  }
});

/**
 * Check if request is an API call
 */
function isApiRequest(url) {
  return API_ROUTES.some((route) => url.pathname.includes(route));
}

/**
 * Check if request is for an image
 */
function isImageRequest(url) {
  return IMAGE_EXTENSIONS.some((ext) => url.pathname.toLowerCase().endsWith(ext));
}

/**
 * Check if request is for a static asset (JS, CSS, fonts)
 */
function isStaticAsset(url) {
  const pathname = url.pathname.toLowerCase();
  return (
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname.includes('/chunks/') ||
    pathname.includes('/assets/')
  );
}

/**
 * Cache-first strategy
 * Best for: Static assets, images
 */
async function cacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Check if cache is still valid
    const cachedTime = cachedResponse.headers.get('sw-cached-time');
    if (cachedTime) {
      const age = (Date.now() - parseInt(cachedTime, 10)) / 1000;
      if (age < maxAge) {
        return cachedResponse;
      }
    } else {
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clone and add timestamp header
      const responseToCache = await addTimestampHeader(networkResponse.clone());
      cache.put(request, responseToCache);

      // Limit cache size
      limitCacheSize(cacheName, cacheName === IMAGE_CACHE ? MAX_IMAGE_ITEMS : MAX_DYNAMIC_ITEMS);
    }

    return networkResponse;
  } catch (error) {
    // Return cached response even if expired, or offline fallback
    if (cachedResponse) {
      return cachedResponse;
    }

    return getOfflineFallback(request);
  }
}

/**
 * Network-first strategy
 * Best for: API calls, dynamic data
 */
async function networkFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const responseToCache = await addTimestampHeader(networkResponse.clone());
      cache.put(request, responseToCache);
      limitCacheSize(cacheName, MAX_API_ITEMS);
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Check if cache is still valid
      const cachedTime = cachedResponse.headers.get('sw-cached-time');
      if (cachedTime) {
        const age = (Date.now() - parseInt(cachedTime, 10)) / 1000;
        if (age < maxAge * 2) {
          // Allow double maxAge for offline
          return cachedResponse;
        }
      }
      return cachedResponse;
    }

    // Return error response for API
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No cached data available' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Stale-while-revalidate strategy
 * Best for: HTML pages, frequently updated content
 */
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch in background
  const fetchPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const responseToCache = await addTimestampHeader(networkResponse.clone());
        cache.put(request, responseToCache);
        limitCacheSize(cacheName, MAX_DYNAMIC_ITEMS);
      }
      return networkResponse;
    })
    .catch(() => null);

  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Otherwise wait for network
  const networkResponse = await fetchPromise;

  if (networkResponse) {
    return networkResponse;
  }

  return getOfflineFallback(request);
}

/**
 * Add timestamp header to response for cache validation
 */
async function addTimestampHeader(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-time', Date.now().toString());

  return new Response(await response.blob(), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Limit cache size by removing oldest entries
 */
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    // Remove oldest entries
    const toDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}

/**
 * Get offline fallback response
 */
async function getOfflineFallback(request) {
  const url = new URL(request.url);

  // For navigation requests, return offline page
  if (request.mode === 'navigate') {
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
  }

  // For images, return placeholder
  if (isImageRequest(url)) {
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect fill="#1e2330" width="200" height="200"/>
        <text fill="#666" x="50%" y="50%" text-anchor="middle" dy=".3em">Offline</text>
      </svg>`,
      {
        headers: { 'Content-Type': 'image/svg+xml' },
      }
    );
  }

  // Default offline response
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
  });
}

/**
 * Handle background sync for failed requests
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-failed-requests') {
    event.waitUntil(syncFailedRequests());
  }
});

/**
 * Sync failed requests when back online
 */
async function syncFailedRequests() {
  // Implementation would retrieve and retry failed requests
  // stored in IndexedDB
  console.log('[SW] Syncing failed requests...');
}

/**
 * Handle push notifications (if needed)
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title || 'Infinity', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: data.url,
    })
  );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data) {
    event.waitUntil(clients.openWindow(event.notification.data));
  }
});

/**
 * Handle messages from main thread
 */
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => Promise.all(names.map((name) => caches.delete(name))))
    );
  }

  if (event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || [];
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => cache.addAll(urls))
    );
  }
});

console.log('[SW] Service worker loaded');
