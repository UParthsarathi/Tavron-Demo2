import React, { useState, useEffect, useRef } from 'react';
import { Search, Send, ArrowLeft, MessageSquare, Hash, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EngineerTask, Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export interface MessagesViewProps {
  projects?: Project[];
  standaloneTasks?: EngineerTask[];
  initialChatId?: string | null;
  onAddTaskComment?: (taskId: string, data: { content: string; imageFile?: File | null }) => void;
}

interface TaskChat {
  id: string;
  name: string;
  role: string;
  task: EngineerTask;
}

/**
 * Task-scoped discussions (one thread per task, project or standalone).
 * There are deliberately no person-to-person DMs — see DECISIONS.md.
 */
export function MessagesView({ projects = [], standaloneTasks = [], initialChatId = null, onAddTaskComment }: MessagesViewProps) {
  const { profile } = useAuth();

  const [selectedChat, setSelectedChat] = useState<string | null>(initialChatId);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [attachedImage, setAttachedImage] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  // Follow new messages only while the reader is near the bottom, so an
  // incoming message never yanks someone reading history.
  const stickToBottomRef = useRef(true);
  const lastChatRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialChatId) {
      setSelectedChat(initialChatId);
    }
  }, [initialChatId]);

  // One chat per task: project tasks first, then standalone tasks.
  const projectChats: TaskChat[] = projects.flatMap(p =>
    p.tasks.map(t => {
      const assignedEngineer = p.engineers.find(e => e.id === t.engineerId);
      return {
        id: `task-${t.id}`,
        name: t.title,
        role: `Project: ${p.name}${assignedEngineer ? ` • Assigned to ${assignedEngineer.name}` : ''}`,
        task: t,
      };
    })
  );

  const standaloneChats: TaskChat[] = standaloneTasks.map(t => ({
    id: `task-${t.id}`,
    name: t.title,
    role: 'Standalone task',
    task: t,
  }));

  const allChats: TaskChat[] = [...projectChats, ...standaloneChats];

  const filteredChats = allChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeChat = allChats.find(c => c.id === selectedChat);
  const activeTaskComments = activeChat?.task.comments ?? [];

  useEffect(() => {
    const el = messagesRef.current;
    if (!el) return;
    if (lastChatRef.current !== selectedChat) {
      // Opening a chat: jump straight to the latest message.
      lastChatRef.current = selectedChat;
      stickToBottomRef.current = true;
      el.scrollTop = el.scrollHeight;
    } else if (stickToBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [selectedChat, activeTaskComments.length]);

  const handleMessagesScroll = () => {
    const el = messagesRef.current;
    if (el) stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAttachedImage(file);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !attachedImage) return;

    if (activeChat && onAddTaskComment) {
      // Sending always snaps the view to your own message.
      stickToBottomRef.current = true;
      onAddTaskComment(activeChat.task.id, {
        content: messageText.trim(),
        imageFile: attachedImage,
      });
      setMessageText('');
      setAttachedImage(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] sm:h-[calc(100vh-140px)] bg-transparent">
      {/* Sidebar - Discussions List */}
      <div className={cn(
        "w-full sm:w-80 md:w-96 border-r border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-[#0f0f11]/50 backdrop-blur-xl flex flex-col transition-transform duration-300",
        selectedChat ? "hidden sm:flex" : "flex"
      )}>
        <div className="p-4 border-b border-gray-200/60 dark:border-gray-800/60">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Messages</h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search discussions..."
              className="w-full bg-gray-100 dark:bg-gray-800/50 border-none rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8 px-4">
              Task discussions appear here once tasks are created.
            </p>
          )}
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={cn(
                "w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800/50 text-left relative",
                selectedChat === chat.id ? "bg-gray-50 dark:bg-gray-800/80" : ""
              )}
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold uppercase">
                  <Hash className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate pr-2">{chat.name}</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {chat.role}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-white/30 dark:bg-[#0f0f11]/30 backdrop-blur-md relative",
        !selectedChat ? "hidden sm:flex items-center justify-center" : "flex"
      )}>
        {!selectedChat ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Your Messages</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Select a discussion to start messaging</p>
          </div>
        ) : activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/80 dark:bg-[#0f0f11]/80 backdrop-blur-xl flex items-center justify-between px-4 sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="sm:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold uppercase flex-shrink-0">
                  <Hash className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{activeChat.name}</h3>
                  <p className={cn("text-xs font-medium truncate text-gray-500 dark:text-gray-400")}>
                    {activeChat.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div ref={messagesRef} onScroll={handleMessagesScroll} className="flex-1 overflow-y-auto p-4 space-y-6 bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px]">
              <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm mb-6">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Task Discussion Context</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This discussion is tied to the task <strong>{activeChat.name}</strong> ({activeChat.role}).
                </p>
              </div>

              {!activeTaskComments || activeTaskComments.length === 0 ? (
                <div className="text-center text-sm font-medium text-gray-500 my-8">No messages yet. Start the discussion.</div>
              ) : (
                activeTaskComments.map(msg => {
                  const isMe = msg.authorId === profile?.id;
                  return (
                    <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative group flex flex-col",
                        isMe
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-tr-none"
                          : "bg-white dark:bg-[#18181b] text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 rounded-tl-none"
                      )}>
                        <span className="text-[10px] uppercase font-bold tracking-wider mb-1 opacity-70">
                          {msg.authorName}
                        </span>
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="attachment" className="w-full h-auto max-w-xs object-cover rounded-lg mb-2" />
                        )}
                        {msg.content && <p className="text-[15px] leading-relaxed">{msg.content}</p>}
                        <span className={cn(
                          "text-[10px] mt-1.5 block opacity-70",
                          isMe ? "text-right" : "text-left"
                        )}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white dark:bg-[#0f0f11] border-t border-gray-200 dark:border-gray-800">
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
                    onChange={handleImageUpload}
                  />
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Discuss this task..."
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
        ) : null}
      </div>
    </div>
  );
}
