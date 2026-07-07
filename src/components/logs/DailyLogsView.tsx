import React, { useMemo, useState } from 'react';
import { NotebookPen, Pencil, Plus, Trash2, X, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { DailyLog, Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface DailyLogsViewProps {
  logs: DailyLog[];
  projects: Project[];
  onAddLog: (data: { content: string; projectId?: string | null }) => void;
  onUpdateLog: (logId: string, content: string) => void;
  onDeleteLog: (logId: string) => void;
}

/**
 * Per-engineer daily work log.
 * Engineers write and manage their own entries; managers see everyone's
 * (RLS enforces both — this component only shapes the UI).
 */
export function DailyLogsView({ logs, projects, onAddLog, onUpdateLog, onDeleteLog }: DailyLogsViewProps) {
  const { profile, role } = useAuth();
  const isManager = role === 'MANAGER';

  const [content, setContent] = useState('');
  const [projectId, setProjectId] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const authors = useMemo(() => {
    const seen = new Map<string, string>();
    logs.forEach((l) => seen.set(l.authorId, l.authorName));
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [logs]);

  const visibleLogs = authorFilter ? logs.filter((l) => l.authorId === authorFilter) : logs;

  // Group by date (logs arrive sorted newest-first from the api layer).
  const grouped = useMemo(() => {
    const groups: { date: string; entries: DailyLog[] }[] = [];
    for (const log of visibleLogs) {
      const last = groups[groups.length - 1];
      if (last && last.date === log.logDate) last.entries.push(log);
      else groups.push({ date: log.logDate, entries: [log] });
    }
    return groups;
  }, [visibleLogs]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddLog({ content: content.trim(), projectId: projectId || null });
    setContent('');
    setProjectId('');
  };

  const formatDate = (iso: string) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(iso); d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-8 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <NotebookPen className="w-6 h-6" />
            Daily Logs
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isManager ? "The team's daily work journal." : 'What did you work on today?'}
          </p>
        </div>
        {isManager && authors.length > 1 && (
          <select
            value={authorFilter}
            onChange={(e) => setAuthorFilter(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          >
            <option value="">All engineers</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
      </div>

      <form
        onSubmit={submit}
        className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm flex flex-col gap-3"
      >
        <textarea
          required
          rows={3}
          placeholder="e.g. Finished the pump alignment checks on Unit 2; waiting on the vendor drawing for the manifold."
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
          >
            <option value="">No project link (optional)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Log
          </button>
        </div>
      </form>

      {grouped.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <NotebookPen className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-3" />
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">No logs yet</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">Daily log entries will appear here, newest first.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.date}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                {formatDate(group.date)}
              </h3>
              <div className="space-y-3">
                {group.entries.map((log, idx) => {
                  const mine = log.authorId === profile?.id;
                  const editing = editingId === log.id;
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isManager && (
                            <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                              <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] font-bold uppercase">
                                {log.authorName.charAt(0)}
                              </span>
                              {log.authorName}
                            </span>
                          )}
                          {log.projectName && (
                            <span className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                              {log.projectName}
                            </span>
                          )}
                        </div>
                        {mine && !editing && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingId(log.id); setEditText(log.content); }}
                              className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteLog(log.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {editing ? (
                        <div className="mt-3 flex flex-col gap-2">
                          <textarea
                            rows={3}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                            <button
                              onClick={() => {
                                if (editText.trim()) {
                                  onUpdateLog(log.id, editText.trim());
                                  setEditingId(null);
                                }
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className={cn("text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap", (isManager || log.projectName) ? "mt-3" : "")}>
                          {log.content}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
