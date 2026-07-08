import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search, Send, ArrowLeft, MessageSquare, Hash, Image as ImageIcon, X,
  ChevronDown, ChevronRight, ListTodo, Target, Plus, Reply, Clock, AlertCircle, Loader2,
} from 'lucide-react';
import { cn, formatTimeAgo } from '@/lib/utils';
import { InboxItem, MessageQuote, Profile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { profiles as profilesApi } from '@/lib/api';
import type { UseConversationsReturn } from '@/hooks/useConversations';

/** Something a view wants opened in Messages (resolved against the inbox). */
export type ChatTarget =
  | { kind: 'task'; id: string }
  | { kind: 'milestone'; id: string }
  | { kind: 'project'; id: string }
  // Directly by conversation id — what a push notification deep-links to.
  | { kind: 'conversation'; id: string };

export interface MessagesViewProps {
  chat: UseConversationsReturn;
  initialTarget?: ChatTarget | null;
}

const typeIcon = (item: InboxItem) => {
  switch (item.type) {
    case 'PROJECT': return <Hash className="w-4 h-4" />;
    case 'MILESTONE': return <Target className="w-4 h-4" />;
    case 'DM': return <span className="font-semibold uppercase text-sm">{item.title.charAt(0)}</span>;
    default: return <ListTodo className="w-4 h-4" />;
  }
};

const contextLine = (item: InboxItem) => {
  switch (item.type) {
    case 'PROJECT': return `Project chat: ${item.projectName ?? ''}`;
    case 'MILESTONE': return `Milestone • ${item.projectName ?? ''}`;
    case 'DM': return 'Direct message';
    default: return item.projectName ? `Task • ${item.projectName}` : 'Standalone task';
  }
};

function previewText(item: InboxItem, myId?: string): string {
  if (!item.lastMessage) return 'No messages yet';
  const who = item.lastMessage.authorId === myId ? 'You' : item.lastMessage.authorName.split(' ')[0];
  const body = item.lastMessage.content || (item.lastMessage.hasImage ? '📷 Photo' : '');
  return `${who}: ${body}`;
}

const byActivity = (a: InboxItem, b: InboxItem) =>
  (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? '');

/**
 * The team's communication inbox. Conversations are grouped by project
 * (General channel pinned first), with DMs and archived (completed-task)
 * threads in their own sections. Task/milestone threads appear only once
 * they have messages — empty ones are reachable from their task/milestone.
 */
export function MessagesView({ chat, initialTarget = null }: MessagesViewProps) {
  const { profile } = useAuth();
  const {
    inbox, inboxLoading, activeId, messages, messagesLoading,
    openConversation, sendMessage, startDm,
  } = chat;

  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [replyTarget, setReplyTarget] = useState<MessageQuote | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ __archived: true });
  const [dmPickerOpen, setDmPickerOpen] = useState(false);
  const [team, setTeam] = useState<Profile[] | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const lastChatRef = useRef<string | null>(null);
  const resolvedTargetRef = useRef<string | null>(null);

  // Resolve an externally requested target (e.g. a task's Discuss button)
  // once the inbox knows about it. One refresh retry covers brand-new rows.
  useEffect(() => {
    if (!initialTarget) return;
    const key = `${initialTarget.kind}:${initialTarget.id}`;
    if (resolvedTargetRef.current === key) return;
    const item = inbox.find((i) =>
      initialTarget.kind === 'task' ? i.taskId === initialTarget.id :
      initialTarget.kind === 'milestone' ? i.milestoneId === initialTarget.id :
      initialTarget.kind === 'conversation' ? i.conversationId === initialTarget.id :
      i.type === 'PROJECT' && i.projectId === initialTarget.id
    );
    if (item) {
      resolvedTargetRef.current = key;
      void openConversation(item.conversationId);
    } else if (!inboxLoading && resolvedTargetRef.current !== `retry:${key}`) {
      resolvedTargetRef.current = `retry:${key}`;
      void chat.refreshInbox();
      resolvedTargetRef.current = `retry:${key}`;
    }
  }, [initialTarget, inbox, inboxLoading, openConversation, chat]);

  const activeItem = inbox.find((i) => i.conversationId === activeId) ?? null;

  // Sidebar structure -------------------------------------------------------
  const query = searchQuery.trim().toLowerCase();
  const searching = query.length > 0;

  const sections = useMemo(() => {
    if (searching) return null;
    const isArchived = (i: InboxItem) => i.taskStatus === 'DONE';
    const hasMessages = (i: InboxItem) => i.lastMessageAt !== null;

    const projectIds = [...new Set(inbox.filter((i) => i.projectId).map((i) => i.projectId as string))];
    const projects = projectIds
      .map((pid) => {
        const all = inbox.filter((i) => i.projectId === pid);
        const general = all.find((i) => i.type === 'PROJECT') ?? null;
        const threads = all
          .filter((i) => i.type !== 'PROJECT' && hasMessages(i) && !isArchived(i))
          .sort(byActivity);
        return {
          id: pid,
          name: all[0]?.projectName ?? 'Project',
          general,
          threads,
          unread: all.filter((i) => !isArchived(i)).reduce((s, i) => s + i.unreadCount, 0),
          latest: all.reduce<string>((m, i) => ((i.lastMessageAt ?? '') > m ? i.lastMessageAt! : m), ''),
        };
      })
      .sort((a, b) => b.latest.localeCompare(a.latest) || a.name.localeCompare(b.name));

    const standalone = inbox
      .filter((i) => i.type === 'TASK' && !i.projectId && hasMessages(i) && !isArchived(i))
      .sort(byActivity);
    const dms = inbox.filter((i) => i.type === 'DM').sort(byActivity);
    const archived = inbox.filter((i) => isArchived(i) && hasMessages(i)).sort(byActivity);
    return { projects, standalone, dms, archived };
  }, [inbox, searching]);

  const searchResults = useMemo(() => {
    if (!searching) return [];
    return inbox
      .filter((i) =>
        i.title.toLowerCase().includes(query) ||
        (i.projectName ?? '').toLowerCase().includes(query))
      .sort(byActivity);
  }, [inbox, searching, query]);

  // Scroll management -------------------------------------------------------
  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    if (lastChatRef.current !== activeId) {
      lastChatRef.current = activeId;
      stickToBottomRef.current = true;
      el.scrollTop = el.scrollHeight;
    } else if (stickToBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [activeId, messages.length, messagesLoading]);

  const handleMessagesScroll = () => {
    const el = messagesRef.current;
    if (el) stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
  };

  const jumpToMessage = (id: string) => {
    const el = messagesRef.current?.querySelector(`[data-message-id="${id}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Actions -----------------------------------------------------------------
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !attachedImage) || !activeId) return;
    stickToBottomRef.current = true;
    void sendMessage(activeId, {
      content: messageText.trim(),
      imageFile: attachedImage,
      quote: replyTarget,
    });
    setMessageText('');
    setAttachedImage(null);
    setReplyTarget(null);
  };

  const openDmPicker = () => {
    setDmPickerOpen(true);
    if (!team) void profilesApi.fetchTeam().then(setTeam).catch(() => setTeam([]));
  };

  const handleStartDm = async (otherId: string) => {
    setDmPickerOpen(false);
    const conversationId = await startDm(otherId);
    if (conversationId) void openConversation(conversationId);
  };

  const toggle = (key: string) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  // Rendering ---------------------------------------------------------------
  const inboxRow = (item: InboxItem, indent = false) => (
    <button
      key={item.conversationId}
      onClick={() => void openConversation(item.conversationId)}
      className={cn(
        "w-full py-2.5 pr-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left",
        indent ? "pl-4" : "pl-3",
        activeId === item.conversationId ? "bg-gray-100 dark:bg-gray-800/80" : ""
      )}
    >
      <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 flex-shrink-0">
        {typeIcon(item)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-2">
          <h3 className={cn(
            "text-sm truncate",
            item.unreadCount > 0 ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-gray-300"
          )}>
            {item.title}
          </h3>
          {item.lastMessageAt && (
            <span className="text-[10px] text-gray-400 flex-shrink-0">{formatTimeAgo(item.lastMessageAt)}</span>
          )}
        </div>
        <p className={cn(
          "text-xs truncate",
          item.unreadCount > 0 ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-500 dark:text-gray-400"
        )}>
          {previewText(item, profile?.id)}
        </p>
      </div>
      {item.unreadCount > 0 && (
        <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
          {item.unreadCount > 99 ? '99+' : item.unreadCount}
        </span>
      )}
    </button>
  );

  const sectionHeader = (key: string, label: string, unread: number, action?: React.ReactNode) => (
    <div className="flex items-center justify-between pr-2">
      <button
        onClick={() => toggle(key)}
        className="flex-1 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {collapsed[key] ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        <span className="truncate">{label}</span>
        {collapsed[key] && unread > 0 && (
          <span className="min-w-[1.1rem] h-4 px-1 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[9px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {action}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] sm:h-[calc(100vh-140px)] bg-transparent">
      {/* Sidebar — the inbox */}
      <div className={cn(
        "w-full sm:w-80 md:w-96 border-r border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-[#0f0f11]/50 backdrop-blur-xl flex flex-col transition-transform duration-300",
        activeId ? "hidden sm:flex" : "flex"
      )}>
        <div className="p-4 border-b border-gray-200/60 dark:border-gray-800/60">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Messages</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-gray-100 dark:bg-gray-800/50 border-none rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
          {inboxLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : searching ? (
            searchResults.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8 px-4">No conversations match.</p>
            ) : (
              searchResults.map((i) => inboxRow(i))
            )
          ) : sections && (
            <>
              {sections.projects.map((p) => (
                <div key={p.id} className="border-b border-gray-100 dark:border-gray-800/50">
                  {sectionHeader(p.id, p.name, p.unread)}
                  {!collapsed[p.id] && (
                    <>
                      {p.general && inboxRow(p.general, true)}
                      {p.threads.map((i) => inboxRow(i, true))}
                    </>
                  )}
                </div>
              ))}

              {sections.standalone.length > 0 && (
                <div className="border-b border-gray-100 dark:border-gray-800/50">
                  {sectionHeader('__standalone', 'Delegated tasks',
                    sections.standalone.reduce((s, i) => s + i.unreadCount, 0))}
                  {!collapsed['__standalone'] && sections.standalone.map((i) => inboxRow(i, true))}
                </div>
              )}

              <div className="border-b border-gray-100 dark:border-gray-800/50">
                {sectionHeader('__dms', 'Direct messages',
                  sections.dms.reduce((s, i) => s + i.unreadCount, 0),
                  <button
                    onClick={openDmPicker}
                    title="New chat"
                    className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                {!collapsed['__dms'] && (
                  sections.dms.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500 px-4 pb-3">No chats yet — use + to message a teammate.</p>
                  ) : (
                    sections.dms.map((i) => inboxRow(i, true))
                  )
                )}
              </div>

              {sections.archived.length > 0 && (
                <div>
                  {sectionHeader('__archived', 'Archived (completed tasks)', 0)}
                  {!collapsed['__archived'] && sections.archived.map((i) => inboxRow(i, true))}
                </div>
              )}

              {sections.projects.length === 0 && sections.standalone.length === 0 && sections.dms.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8 px-4">
                  Conversations appear here — project chats, task discussions, and direct messages.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat pane */}
      <div className={cn(
        "flex-1 flex flex-col bg-white/30 dark:bg-[#0f0f11]/30 backdrop-blur-md relative",
        !activeId ? "hidden sm:flex items-center justify-center" : "flex"
      )}>
        {!activeId ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Your Messages</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Select a conversation to start messaging</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-16 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/80 dark:bg-[#0f0f11]/80 backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => void openConversation(null)}
                  className="sm:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 flex-shrink-0">
                  {activeItem ? typeIcon(activeItem) : <Hash className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {activeItem?.type === 'PROJECT' ? `${activeItem.projectName} — General` : activeItem?.title ?? ''}
                  </h3>
                  <p className="text-xs font-medium truncate text-gray-500 dark:text-gray-400">
                    {activeItem ? contextLine(activeItem) : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesRef} onScroll={handleMessagesScroll} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px]">
              {messagesLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : messages.length === 0 ? (
                <div className="text-center text-sm font-medium text-gray-500 my-8">No messages yet. Start the conversation.</div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.authorId === profile?.id;
                  return (
                    <div key={msg.id} data-message-id={msg.id} className={cn("flex group", isMe ? "justify-end" : "justify-start")}>
                      {!isMe && (
                        <button
                          onClick={() => setReplyTarget({ id: msg.id, authorName: msg.authorName, content: msg.content, hasImage: !!msg.imageUrl })}
                          className="self-center mr-1 p-1.5 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all order-2"
                          title="Reply"
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                      )}
                      <div className={cn(
                        "max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative flex flex-col",
                        isMe
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-tr-none order-1"
                          : "bg-white dark:bg-[#18181b] text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 rounded-tl-none order-1",
                        msg.pending ? "opacity-70" : ""
                      )}>
                        <span className="text-[10px] uppercase font-bold tracking-wider mb-1 opacity-70">
                          {msg.authorName}
                        </span>
                        {msg.quote && (
                          <button
                            onClick={() => jumpToMessage(msg.quote!.id)}
                            className={cn(
                              "text-left mb-2 px-2.5 py-1.5 rounded-lg border-l-2 text-xs",
                              isMe
                                ? "bg-white/10 dark:bg-gray-900/10 border-white/40 dark:border-gray-900/40"
                                : "bg-gray-50 dark:bg-gray-800/60 border-gray-300 dark:border-gray-600"
                            )}
                          >
                            <span className="font-semibold block opacity-80">{msg.quote.authorName}</span>
                            <span className="opacity-70 line-clamp-2">
                              {msg.quote.content || (msg.quote.hasImage ? '📷 Photo' : '')}
                            </span>
                          </button>
                        )}
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="attachment" className="w-full h-auto max-w-xs object-cover rounded-lg mb-2" />
                        )}
                        {msg.content && <p className="text-[15px] leading-relaxed">{msg.content}</p>}
                        <span className={cn("text-[10px] mt-1.5 flex items-center gap-1 opacity-70", isMe ? "self-end" : "self-start")}>
                          {msg.failed ? (
                            <span className="flex items-center gap-1 text-red-500 dark:text-red-400 opacity-100 font-medium">
                              <AlertCircle className="w-3 h-3" /> Failed to send
                            </span>
                          ) : (
                            <>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {msg.pending && <Clock className="w-3 h-3" />}
                            </>
                          )}
                        </span>
                      </div>
                      {isMe && (
                        <button
                          onClick={() => setReplyTarget({ id: msg.id, authorName: msg.authorName, content: msg.content, hasImage: !!msg.imageUrl })}
                          className="self-center ml-1 p-1.5 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all order-0"
                          title="Reply"
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Composer */}
            <div className="p-4 bg-white dark:bg-[#0f0f11] border-t border-gray-200 dark:border-gray-800">
              {replyTarget && (
                <div className="mb-3 max-w-4xl mx-auto flex items-start gap-2 bg-gray-50 dark:bg-gray-900 border-l-2 border-gray-900 dark:border-white rounded-lg px-3 py-2">
                  <div className="flex-1 min-w-0 text-xs">
                    <span className="font-semibold text-gray-900 dark:text-white block">Replying to {replyTarget.authorName}</span>
                    <span className="text-gray-500 dark:text-gray-400 truncate block">
                      {replyTarget.content || (replyTarget.hasImage ? '📷 Photo' : '')}
                    </span>
                  </div>
                  <button onClick={() => setReplyTarget(null)} className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {attachedImage && (
                <div className="mb-3 relative inline-block">
                  <img src={URL.createObjectURL(attachedImage)} alt="Preview" className="h-20 w-auto rounded-lg object-cover shadow-sm border border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={() => setAttachedImage(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex flex-col gap-2 max-w-4xl mx-auto">
                <div className="flex items-center gap-2 relative">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
                    title="Attach Image"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setAttachedImage(f); }}
                  />
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={activeItem?.type === 'DM' ? `Message ${activeItem.title}...` : 'Type a message...'}
                    className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full pl-5 pr-14 py-3 sm:py-3.5 text-[15px] text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 dark:focus:ring-white/20 transition-all shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() && !attachedImage}
                    className="absolute right-1.5 p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>

      {/* New-DM picker */}
      {dmPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDmPickerOpen(false)}>
          <div
            className="w-full max-w-sm bg-white dark:bg-[#18181b] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">New chat</h3>
              <button onClick={() => setDmPickerOpen(false)} className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {team === null ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : (
                team.filter((t) => t.id !== profile?.id).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => void handleStartDm(t.id)}
                    className="w-full px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-semibold uppercase text-gray-600 dark:text-gray-300">
                      {t.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {t.role === 'MANAGER' ? 'Manager' : t.discipline ?? 'Engineer'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
