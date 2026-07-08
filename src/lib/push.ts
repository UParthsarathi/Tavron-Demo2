// Browser-side Web Push plumbing: service worker registration, capability
// detection, and PushManager subscribe/unsubscribe. No Supabase here — the
// DB side lives in src/lib/api/push.ts, and usePushNotifications composes
// the two.

// The VAPID *public* key (applicationServerKey). Not a secret — it only
// identifies our server to the push service. The private half lives in
// Supabase Vault; rotating the pair means updating both and re-subscribing.
export const APPLICATION_SERVER_KEY =
  'BF-3JkfwYyWKSJeOSdw9VZ2b2weH9dwxjXaHhC0FrFK32U83tcGcbOGxnmrIz7fEhE6wFJbysxlVzvfL98to_08';

/** Called once at boot (main.tsx). Safe on browsers without service workers. */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  });
}

/** True when this browser can subscribe to push right now. */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function isIos(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent)
    // iPadOS masquerades as macOS Safari but has a touch screen.
    || (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1);
}

/** Installed to the home screen / running as an app window. */
export function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as { standalone?: boolean }).standalone === true;
}

/**
 * iOS only exposes PushManager to *installed* PWAs (16.4+), so Safari-in-tab
 * users need an "Add to Home Screen" nudge instead of a permission prompt.
 */
export function iosNeedsInstall(): boolean {
  return isIos() && !isStandalone() && !isPushSupported();
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return 'Notification' in window ? Notification.permission : 'unsupported';
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/** Subscribes this browser. Assumes Notification.permission === 'granted'. */
export async function subscribePush(): Promise<PushSubscription> {
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(APPLICATION_SERVER_KEY),
  });
}

/** The {endpoint, p256dh, auth} triple the backend stores. */
export function serializeSubscription(sub: PushSubscription): {
  endpoint: string;
  p256dh: string;
  auth: string;
} {
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Push subscription is missing its keys');
  }
  return { endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth };
}

/** Mirrors the inbox unread total onto the installed app's icon. */
export function setAppBadge(count: number): void {
  const nav = navigator as Navigator & {
    setAppBadge?: (n?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };
  if (count > 0) {
    void nav.setAppBadge?.(count).catch(() => {});
  } else {
    void nav.clearAppBadge?.().catch(() => {});
  }
}
