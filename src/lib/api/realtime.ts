// Realtime "something changed" signal for the whole public schema.
// We deliberately ignore event payloads: on any change from another client,
// the caller refetches through the normal RLS-enforced API. Patching state
// from payloads isn't worth the complexity at this data volume (18 users).

import { supabase } from '@/lib/supabase';

/**
 * Calls `onChange` whenever a row changes in any table published for
 * realtime (see the realtime_publication migration). RLS decides which
 * events each user receives. Returns an unsubscribe function.
 */
export function subscribeToChanges(onChange: () => void): () => void {
  const channel = supabase
    .channel('schema-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, onChange)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
