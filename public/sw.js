// Tavron service worker: Web Push only.
//
// Deliberately no fetch handler / offline cache — the app is useless without
// the network, and a cache would add stale-bundle failure modes for zero
// benefit. This file exists so the browser can wake us for push events and
// so the app is installable.
//
// Payload shape comes from the send-push edge function:
//   { title, body, tag, conversationId, url }

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }
  event.waitUntil(showPush(payload));
});

async function showPush(payload) {
  // When the app is focused, realtime already renders the message and the
  // unread badges — a system notification would just be noise.
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const appFocused = clientList.some((c) => c.visibilityState === 'visible' && c.focused);
  if (appFocused) return;

  await self.registration.showNotification(payload.title || 'Tavron', {
    body: payload.body || '',
    tag: payload.tag, // one stacked notification per conversation
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    data: { conversationId: payload.conversationId, url: payload.url || '/' },
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { conversationId, url } = event.notification.data || {};
  event.waitUntil(openConversation(conversationId, url || '/'));
});

async function openConversation(conversationId, url) {
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  if (clientList.length > 0) {
    const client = clientList[0];
    try {
      await client.focus();
    } catch {
      // Focus can be refused; the message below still switches the view.
    }
    if (conversationId) {
      client.postMessage({ type: 'open-conversation', conversationId });
    }
    return;
  }
  await self.clients.openWindow(url);
}
