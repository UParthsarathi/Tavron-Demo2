import { useCallback, useEffect, useRef, useState } from 'react';
import { push as pushApi } from '@/lib/api';
import {
  getExistingSubscription,
  iosNeedsInstall,
  isPushSupported,
  notificationPermission,
  subscribePush,
} from '@/lib/push';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Owns this device's push story for the signed-in user: permission state,
 * the subscribe/unsubscribe actions behind the banner and the account
 * toggle, and notification deep links (a tapped notification lands in the
 * right conversation whether the app was closed — `?c=` URL — or already
 * open — a message from the service worker).
 *
 * Instantiated once per layout, like useConversations.
 */
export function usePushNotifications(options?: {
  onOpenConversation?: (conversationId: string) => void;
}) {
  const { profile } = useAuth();
  const [permission, setPermission] = useState(notificationPermission);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  // The deep-link callback changes identity every layout render; a ref keeps
  // the listeners below subscribed exactly once.
  const openConversationRef = useRef(options?.onOpenConversation);
  openConversationRef.current = options?.onOpenConversation;

  // A push notification arrived while the app was closed: the service worker
  // opened us with ?c=<conversationId>.
  useEffect(() => {
    if (!profile) return;
    const params = new URLSearchParams(window.location.search);
    const conversationId = params.get('c');
    if (!conversationId) return;
    window.history.replaceState({}, '', window.location.pathname);
    openConversationRef.current?.(conversationId);
  }, [profile]);

  // ...and while the app was open: the service worker focused us instead.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'open-conversation' && event.data.conversationId) {
        openConversationRef.current?.(event.data.conversationId);
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, []);

  // Keep the server in sync on every signed-in load: re-home the endpoint to
  // this account (shared devices) and quietly repair a dropped subscription —
  // subscribing needs no gesture once permission is granted.
  useEffect(() => {
    if (!profile || !isPushSupported() || notificationPermission() !== 'granted') return;
    let cancelled = false;
    (async () => {
      try {
        const sub = (await getExistingSubscription()) ?? (await subscribePush());
        await pushApi.saveSubscription(sub);
        if (!cancelled) setSubscribed(true);
      } catch (err) {
        console.error('Push subscription sync failed:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [profile]);

  /** User-gesture path (banner / account toggle): prompt, subscribe, save. */
  const enable = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported()) return false;
    setBusy(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return false;
      await pushApi.saveSubscription((await getExistingSubscription()) ?? (await subscribePush()));
      setSubscribed(true);
      return true;
    } catch (err) {
      console.error('Enabling push failed:', err);
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async (): Promise<void> => {
    setBusy(true);
    try {
      await pushApi.removeCurrentDeviceSubscription();
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    /** Push can work in this browser (on iOS: only once installed). */
    supported: isPushSupported(),
    /** iOS Safari tab: needs Add to Home Screen before push exists at all. */
    needsInstall: iosNeedsInstall(),
    permission,
    subscribed,
    busy,
    enable,
    disable,
  };
}

export type UsePushNotificationsReturn = ReturnType<typeof usePushNotifications>;
