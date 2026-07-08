import { useState } from 'react';
import { Bell, Share, X } from 'lucide-react';
import type { UsePushNotificationsReturn } from '@/hooks/usePushNotifications';

const DISMISS_KEY = 'tavron-push-banner-dismissed';

/**
 * One-time nudge to turn on push notifications — the WhatsApp reflex loop
 * (notify → open → reply) doesn't exist without them. Two variants:
 * a permission prompt where push is available, and an Add-to-Home-Screen
 * hint on iOS Safari, where push only exists for installed apps.
 */
export function EnableNotificationsBanner({ push }: { push: UsePushNotificationsReturn }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  const promptable = push.supported && push.permission === 'default';
  if (dismissed || (!promptable && !push.needsInstall)) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* private mode */ }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-4">
      <div className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm">
        <div className="p-2 rounded-lg bg-brand-green text-brand-green-text shrink-0">
          {push.needsInstall ? <Share className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          {push.needsInstall ? (
            <>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Install Tavron to get message alerts</p>
              <p className="text-xs text-gray-500">
                Tap Share <Share className="w-3 h-3 inline -mt-0.5" /> then “Add to Home Screen”, and enable notifications from there.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Turn on notifications</p>
              <p className="text-xs text-gray-500">Know the moment your team replies — even with Tavron closed.</p>
            </>
          )}
        </div>
        {!push.needsInstall && (
          <button
            onClick={() => void push.enable()}
            disabled={push.busy}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Enable
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
