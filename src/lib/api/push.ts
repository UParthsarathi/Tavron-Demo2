// Data access for Web Push: subscription rows + the send-push fan-out call.
// Browser-side PushManager plumbing lives in src/lib/push.ts.

import { supabase } from '@/lib/supabase';
import { getExistingSubscription, serializeSubscription } from '@/lib/push';

/**
 * Registers (or re-homes, on a shared device) this browser's subscription for
 * the signed-in user. Goes through an RPC rather than a plain insert — see
 * save_push_subscription in the push_subscriptions migration.
 */
export async function saveSubscription(sub: PushSubscription): Promise<void> {
  const { endpoint, p256dh, auth } = serializeSubscription(sub);
  const { error } = await supabase.rpc('save_push_subscription', {
    _endpoint: endpoint,
    _p256dh: p256dh,
    _auth: auth,
    _user_agent: navigator.userAgent.slice(0, 256),
  });
  if (error) throw new Error(`Failed to save push subscription: ${error.message}`);
}

export async function deleteSubscription(endpoint: string): Promise<void> {
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  if (error) console.error('Failed to delete push subscription:', error.message);
}

/**
 * Unsubscribes this device and forgets it server-side. Used by the account
 * toggle and on sign-out (a shared device must not keep getting the previous
 * user's messages). Must run while still authenticated.
 */
export async function removeCurrentDeviceSubscription(): Promise<void> {
  try {
    const sub = await getExistingSubscription();
    if (!sub) return;
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await deleteSubscription(endpoint);
  } catch (err) {
    console.error('Failed to remove push subscription:', err);
  }
}

/**
 * Asks send-push to notify the message's recipients. Fire-and-forget from the
 * sender's device right after the insert lands; a failed fan-out must never
 * fail the send itself.
 */
export async function fanoutMessage(messageId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('send-push', {
    body: { messageId },
  });
  if (error) console.warn('Push fan-out failed:', error.message ?? error);
}
