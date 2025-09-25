self.addEventListener('push', (e) => {
  const data = (e.data && e.data.json()) || {};
  e.waitUntil(self.registration.showNotification(data.title || 'Notification', {
    body: data.body || '',
    data: { url: data.url || '/' }
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification?.data && e.notification.data.url) || '/';
  e.waitUntil(clients.openWindow(url));
});
