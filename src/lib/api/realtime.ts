// Realtime change signals, split into two lanes:
//  - subscribeToChanges: structural data (projects/tasks/milestones/...) for
//    useProjects' refetch-everything model. Chat tables are excluded here —
//    chat volume must never trigger full refetches.
//  - subscribeToChat: the messaging lane consumed by useConversations.
// Payload contents are mostly ignored; callers re-read through the normal
// RLS-enforced API.

import { supabase } from '@/lib/supabase';

const CHAT_TABLES = ['messages', 'conversations', 'conversation_reads'];

/** Structural changes only. Returns an unsubscribe function. */
export function subscribeToChanges(onChange: () => void): () => void {
  const channel = supabase
    .channel('schema-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      if (CHAT_TABLES.includes(payload.table)) return;
      onChange();
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/** The slice of a messages row the chat patch path needs from an event. */
export interface MessageEventRow {
  id: string;
  conversation_id: string;
}

export function subscribeToChat(handlers: {
  /** A message was inserted somewhere we can see (RLS filters delivery). */
  onMessageInsert: (row: MessageEventRow) => void;
  /**
   * Something that shapes the inbox changed: conversations created/removed,
   * read-state synced from another device, or a task/milestone/project
   * renamed / status-changed (titles and the Archived section depend on them).
   */
  onInboxChange: () => void;
}): () => void {
  const channel = supabase
    .channel('chat-changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => handlers.onMessageInsert(payload.new as MessageEventRow)
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () =>
      handlers.onInboxChange()
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_reads' }, () =>
      handlers.onInboxChange()
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks' }, () =>
      handlers.onInboxChange()
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'milestones' }, () =>
      handlers.onInboxChange()
    )
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projects' }, () =>
      handlers.onInboxChange()
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
