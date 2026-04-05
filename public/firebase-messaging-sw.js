// ──────────────────────────────────────────────────────────────
// firebase-messaging-sw.js
// Service Worker de background do Firebase Cloud Messaging.
// Deve ficar na raiz pública para ser registrado automaticamente
// pelo Firebase Messaging SDK.
// ──────────────────────────────────────────────────────────────

// Importa Firebase via CDN (compat — necessário em Service Workers)
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyBYn2UrACDV9lhhVHfLr3_wDeug_MTUnpg',
  authDomain:        'gestor-de-push.firebaseapp.com',
  projectId:         'gestor-de-push',
  storageBucket:     'gestor-de-push.firebasestorage.app',
  messagingSenderId: '557564729663',
  appId:             '1:557564729663:web:8e82c0424a45208a559b8a',
});

const messaging = firebase.messaging();

// ── Notificações em background (browser fechado / tab em segundo plano) ──
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Mensagem em background:', payload);

  const notification = payload.notification ?? {};
  const data         = payload.data ?? {};

  const title   = notification.title || data.title || 'Terreiras App';
  const options  = {
    body:             notification.body  || data.body  || 'Você tem uma nova notificação.',
    icon:             notification.icon  || '/favicon.svg',
    badge:            '/favicon.svg',
    tag:              data.tag           || 'terreiras-push',
    data:             { url: data.url   || '/' },
    vibrate:          [200, 100, 200],
    requireInteraction: false,
  };

  self.registration.showNotification(title, options);
});

// ── Clique na notificação → abre / foca o app ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
