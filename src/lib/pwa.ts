// PWA installation and service worker utilities

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

export const showNotification = (title: string, options?: NotificationOptions) => {
  if ('serviceWorker' in navigator && 'Notification' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    });
  }
};

// Check if app is installed
export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone ||
         document.referrer.includes('android-app://');
};

// Prompt user to install PWA
export const promptInstall = () => {
  // This will be handled by browser's built-in install prompt
  // Can be enhanced with custom UI later
};