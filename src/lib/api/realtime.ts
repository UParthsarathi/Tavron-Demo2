// Realtime change signals. Two lanes:
//  - task_comments INSERTs get their own handler so chat can patch the single
//    new message into state instantly instead of refetching everything.
//  - Every other change is a "something changed" signal; the caller refetches
//    through the normal RLS-enforced API. Payloads are ignored on this lane.

import { supabase } from '@/lib/supabase';

/** The slice of a task_comments row the chat patch path needs from an event. */
export interface TaskCommentEventRow {
  id: string;
  task_id: string;
}

export function subscribeToChanges(handlers: {
  /** A chat message was inserted (RLS already filtered delivery). */
  onCommentInsert: (row: TaskCommentEventRow) => void;
  /** Any other change in any published table. */
  onOtherChange: () => void;
}): () => void {
  const channel = supabase
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'task_comments' },
      (payload) => handlers.onCommentInsert(payload.new as TaskCommentEventRow)
    )
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      // Comment inserts are handled above; a full refetch per chat message
      // would defeat the fast path.
      if (payload.table === 'task_comments' && payload.eventType === 'INSERT') return;
      handlers.onOtherChange();
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
