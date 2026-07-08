import { useCallback, useEffect, useRef, useState } from 'react';
import { conversations as conversationsApi, realtime as realtimeApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatMessage, InboxItem, MessageQuote } from '@/types';

export interface SendMessageInput {
  content: string;
  imageFile?: File | null;
  quote?: MessageQuote | null;
}

/**
 * The state hub for messaging, instantiated once per layout (so the header
 * badge and MessagesView share it). Owns the inbox, the open conversation's
 * messages, optimistic sends, and the chat realtime lane. Deliberately
 * separate from useProjects: chat volume must never trigger the structural
 * refetch-everything path.
 */
export function useConversations() {
  const { profile } = useAuth();
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  // The realtime handler runs outside React's render cycle; refs keep it
  // pointed at the current conversation without resubscribing on every open.
  const activeIdRef = useRef<string | null>(null);

  const refreshInbox = useCallback(async () => {
    if (!profile) return;
    setInbox(await conversationsApi.fetchInbox());
  }, [profile]);

  useEffect(() => {
    let cancelled = false;
    setInboxLoading(true);
    refreshInbox()
      .catch(() => { /* surfaced as an empty inbox; realtime retriggers */ })
      .finally(() => { if (!cancelled) setInboxLoading(false); });
    return () => { cancelled = true; };
  }, [refreshInbox]);

  /** Updates one inbox row's preview after a message lands in it. */
  const bumpInboxPreview = useCallback((msg: ChatMessage, incrementUnread: boolean) => {
    setInbox((prev) =>
      prev.map((i) =>
        i.conversationId === msg.conversationId
          ? {
              ...i,
              lastMessageAt: msg.createdAt,
              lastMessage: {
                authorId: msg.authorId,
                authorName: msg.authorName,
                content: msg.content,
                hasImage: !!msg.imageUrl,
              },
              unreadCount: incrementUnread ? i.unreadCount + 1 : i.unreadCount,
            }
          : i
      )
    );
  }, []);

  const openConversation = useCallback(async (conversationId: string | null) => {
    setActiveId(conversationId);
    activeIdRef.current = conversationId;
    if (!conversationId || !profile) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    try {
      const msgs = await conversationsApi.fetchMessages(conversationId);
      // Guard against a stale response after the user switched chats again.
      if (activeIdRef.current !== conversationId) return;
      setMessages(msgs);
      void conversationsApi.markRead(conversationId, profile.id);
      setInbox((prev) =>
        prev.map((i) => (i.conversationId === conversationId ? { ...i, unreadCount: 0 } : i))
      );
    } finally {
      setMessagesLoading(false);
    }
  }, [profile]);

  // Optimistic send: renders at tap time, the confirmed row replaces it;
  // failures stay in the list flagged `failed` so the text isn't lost.
  const sendMessage = useCallback(
    async (conversationId: string, data: SendMessageInput): Promise<void> => {
      if (!profile) return;
      const tempId = `pending-${crypto.randomUUID()}`;
      const previewUrl = data.imageFile ? URL.createObjectURL(data.imageFile) : undefined;
      const optimistic: ChatMessage = {
        id: tempId,
        conversationId,
        authorId: profile.id,
        authorName: profile.name,
        authorRole: profile.role,
        content: data.content,
        createdAt: new Date().toISOString(),
        imageUrl: previewUrl,
        quote: data.quote ?? undefined,
        pending: true,
      };
      if (activeIdRef.current === conversationId) {
        setMessages((prev) => [...prev, optimistic]);
      }
      bumpInboxPreview(optimistic, false);
      try {
        const saved = await conversationsApi.sendMessage({
          conversationId,
          authorId: profile.id,
          content: data.content,
          imageFile: data.imageFile,
          replyToId: data.quote?.id ?? null,
        });
        setMessages((prev) =>
          prev.filter((m) => m.id !== saved.id).map((m) => (m.id === tempId ? saved : m))
        );
        bumpInboxPreview(saved, false);
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, pending: false, failed: true } : m))
        );
      } finally {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      }
    },
    [profile, bumpInboxPreview]
  );

  const startDm = useCallback(
    async (otherProfileId: string): Promise<string | null> => {
      if (!profile) return null;
      const conversationId = await conversationsApi.startDm(profile.id, otherProfileId);
      await refreshInbox();
      return conversationId;
    },
    [profile, refreshInbox]
  );

  // Chat realtime lane. Incoming messages patch state directly (single-row
  // fetch under our own RLS); inbox-shaping events refresh the inbox RPC.
  useEffect(() => {
    if (!profile) return;
    let timer: number | null = null;
    const unsubscribe = realtimeApi.subscribeToChat({
      onMessageInsert: (row) => {
        void conversationsApi.fetchMessage(row.id).then((msg) => {
          if (!msg) return; // not visible to us
          if (activeIdRef.current === msg.conversationId) {
            setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
            bumpInboxPreview(msg, false);
            if (msg.authorId !== profile.id) {
              void conversationsApi.markRead(msg.conversationId, profile.id);
            }
          } else {
            setInbox((prev) => {
              if (!prev.some((i) => i.conversationId === msg.conversationId)) {
                // First message of a conversation we haven't loaded (e.g. a
                // brand-new DM to us) — pull the full inbox.
                void refreshInbox();
                return prev;
              }
              return prev.map((i) =>
                i.conversationId === msg.conversationId
                  ? {
                      ...i,
                      lastMessageAt: msg.createdAt,
                      lastMessage: {
                        authorId: msg.authorId,
                        authorName: msg.authorName,
                        content: msg.content,
                        hasImage: !!msg.imageUrl,
                      },
                      unreadCount:
                        msg.authorId === profile.id ? i.unreadCount : i.unreadCount + 1,
                    }
                  : i
              );
            });
          }
        });
      },
      onInboxChange: () => {
        if (timer) clearTimeout(timer);
        timer = window.setTimeout(() => {
          void refreshInbox();
        }, 1000);
      },
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [profile, refreshInbox, bumpInboxPreview]);

  const unreadTotal = inbox.reduce((sum, i) => sum + i.unreadCount, 0);

  return {
    inbox,
    inboxLoading,
    activeId,
    messages,
    messagesLoading,
    unreadTotal,
    openConversation,
    sendMessage,
    startDm,
    refreshInbox,
  };
}

export type UseConversationsReturn = ReturnType<typeof useConversations>;
