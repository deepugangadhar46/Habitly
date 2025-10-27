// Enhanced Service Worker for Habitly PWA - Full Offline Support
const CACHE_NAME = 'habitly-v3';
const RUNTIME_CACHE = 'habitly-runtime-v3';

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache critical assets
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png'
      ]).catch(err => {
        console.log('Cache addAll error:', err);
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Cache-first strategy for assets, Network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Cache-first strategy for all same-origin requests
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response before caching
        const responseToCache = response.clone();

        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Return offline page or cached index for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Handle background sync for offline habit tracking
self.addEventListener('sync', (event) => {
  if (event.tag === 'habit-sync') {
    event.waitUntil(syncHabits());
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const { action, data } = event;
  
  if (action === 'complete' && data?.habitId) {
    // Handle habit completion
    event.waitUntil(
      clients.openWindow('/?complete=' + data.habitId)
    );
  } else if (action === 'snooze') {
    // Reschedule notification for 1 hour later
    setTimeout(() => {
      self.registration.showNotification(event.notification.title, {
        ...event.notification,
        timestamp: Date.now() + 3600000 // 1 hour
      });
    }, 3600000);
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: data.tag || 'general',
        data: data.data || {}
      })
    );
  }
});

async function syncHabits() {
  try {
    // Sync offline habit completions when back online
    console.log('Background sync triggered - syncing habits');
    
    // This would typically sync with a backend server
    // For now, we'll just log the sync attempt
    
    return Promise.resolve();
  } catch (error) {
    console.error('Habit sync failed:', error);
    throw error;
  }
}