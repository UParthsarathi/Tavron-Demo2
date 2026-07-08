// Data access for the unified messaging model (conversations/messages/
// conversation_reads — see the conversations migration). Conversations for
// tasks, milestones and projects are created by DB triggers; DMs are created
// here on demand. All reads run under the caller's RLS.

import { supabase } from '@/lib/supabase';
import type { ChatMessage, ConversationType, InboxItem, TaskStatus, UserRole } from '@/types';
import { createSignedUrls, uploadAttachment } from './storage';

// `reply:reply_to(...)` embeds the quoted parent via the FK column; the
// table-name spelling (messages!reply_to) resolves to the child direction.
const MESSAGE_SELECT = `
  id, conversation_id, author_id, content, image_path, created_at,
  author:profiles ( id, name, role ),
  reply:reply_to ( id, content, image_path, author:profiles ( name ) )
` as const;

type MessageRow = {
  id: string;
  conversation_id: string;
  author_id: string;
  content: string;
  image_path: string | null;
  created_at: string;
  author: { id: string; name: string; role: UserRole } | null;
  reply: {
    id: string;
    content: string;
    image_path: string | null;
    author: { name: string } | null;
  } | null;
};

function mapMessage(row: MessageRow, signed: Map<string, string>): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    authorId: row.author?.id ?? row.author_id,
    authorName: row.author?.name ?? 'Unknown',
    authorRole: row.author?.role ?? 'ENGINEER',
    content: row.content,
    createdAt: row.created_at,
    imageUrl: row.image_path ? signed.get(row.image_path) : undefined,
    quote: row.reply
      ? {
          id: row.reply.id,
          authorName: row.reply.author?.name ?? 'Unknown',
          content: row.reply.content,
          hasImage: !!row.reply.image_path,
        }
      : undefined,
  };
}

type InboxRow = {
  conversation_id: string;
  type: ConversationType;
  project_id: string | null;
  project_name: string | null;
  task_id: string | null;
  task_title: string | null;
  task_status: TaskStatus | null;
  milestone_id: string | null;
  milestone_title: string | null;
  dm_partner_id: string | null;
  dm_partner_name: string | null;
  last_message_at: string | null;
  last_author_id: string | null;
  last_author_name: string | null;
  last_content: string | null;
  last_has_image: boolean | null;
  unread_count: number;
};

function inboxTitle(row: InboxRow): string {
  switch (row.type) {
    case 'TASK': return row.task_title ?? 'Task';
    case 'MILESTONE': return row.milestone_title ?? 'Milestone';
    case 'PROJECT': return 'General';
    case 'DM': return row.dm_partner_name ?? 'Direct message';
  }
}

/** Every conversation visible to the caller, with preview + unread count. */
export async function fetchInbox(): Promise<InboxItem[]> {
  const { data, error } = await supabase.rpc('fetch_inbox');
  if (error) throw new Error(`Failed to load messages: ${error.message}`);
  return ((data ?? []) as InboxRow[]).map((r) => ({
    conversationId: r.conversation_id,
    type: r.type,
    title: inboxTitle(r),
    projectId: r.project_id,
    projectName: r.project_name,
    taskId: r.task_id,
    taskStatus: r.task_status,
    milestoneId: r.milestone_id,
    dmPartnerId: r.dm_partner_id,
    lastMessageAt: r.last_message_at,
    lastMessage: r.last_author_id
      ? {
          authorId: r.last_author_id,
          authorName: r.last_author_name ?? 'Unknown',
          content: r.last_content ?? '',
          hasImage: !!r.last_has_image,
        }
      : null,
    unreadCount: Number(r.unread_count) || 0,
  }));
}

/** The most recent messages of one conversation, oldest first. */
export async function fetchMessages(conversationId: string, limit = 200): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load messages: ${error.message}`);
  const rows = ((data ?? []) as unknown as MessageRow[]).reverse();
  const signed = await createSignedUrls(rows.map((r) => r.image_path).filter((p): p is string => !!p));
  return rows.map((r) => mapMessage(r, signed));
}

/** One message by id (realtime patch path). Null when not visible to us. */
export async function fetchMessage(messageId: string): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('id', messageId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as MessageRow;
  const signed = await createSignedUrls(row.image_path ? [row.image_path] : []);
  return mapMessage(row, signed);
}

/** Inserts a message and returns it fully mapped (author + signed image). */
export async function sendMessage(input: {
  conversationId: string;
  authorId: string;
  content: string;
  imageFile?: File | null;
  replyToId?: string | null;
}): Promise<ChatMessage> {
  const imagePath = input.imageFile
    ? await uploadAttachment('comment-images', input.imageFile)
    : null;
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: input.conversationId,
      author_id: input.authorId,
      content: input.content,
      image_path: imagePath,
      reply_to: input.replyToId ?? null,
    })
    .select(MESSAGE_SELECT)
    .single();
  if (error) throw new Error(`Failed to send message: ${error.message}`);
  const row = data as unknown as MessageRow;
  const signed = await createSignedUrls(row.image_path ? [row.image_path] : []);
  return mapMessage(row, signed);
}

/** Marks a conversation read up to now (drives the unread badges). */
export async function markRead(conversationId: string, profileId: string): Promise<void> {
  const { error } = await supabase.from('conversation_reads').upsert(
    { conversation_id: conversationId, profile_id: profileId, last_read_at: new Date().toISOString() },
    { onConflict: 'conversation_id,profile_id' }
  );
  if (error) console.error('Failed to mark conversation read:', error.message);
}

/** Finds or creates the 1:1 DM between two people; returns its conversation id. */
export async function startDm(myId: string, otherId: string): Promise<string> {
  const [a, b] = [myId, otherId].sort();
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('type', 'DM')
    .eq('dm_a', a)
    .eq('dm_b', b)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ type: 'DM', dm_a: a, dm_b: b })
    .select('id')
    .single();
  if (!error) return data.id;

  // Unique violation = the other person created it in parallel; re-read.
  const { data: raced, error: raceErr } = await supabase
    .from('conversations')
    .select('id')
    .eq('type', 'DM')
    .eq('dm_a', a)
    .eq('dm_b', b)
    .single();
  if (raceErr) throw new Error(`Failed to start chat: ${error.message}`);
  return raced.id;
}
