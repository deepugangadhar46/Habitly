// Enhanced Service Worker for Habitly PWA
const CACHE_NAME = 'habitly-v2';
const urlsToCache = [
  '/',
  '/src/main.tsx',
  '/src/index.css',
  '/favicon.ico',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
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