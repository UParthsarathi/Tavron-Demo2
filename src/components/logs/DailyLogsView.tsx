import React, { useMemo, useRef, useState } from 'react';
import { BadgeCheck, ImagePlus, NotebookPen, Pencil, Plus, Trash2, UserX, X, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { DailyLog, Engineer, Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface DailyLogsViewProps {
  logs: DailyLog[];
  projects: Project[];
  onAddLog: (data: { content: string; projectId?: string | null; imageFile?: File | null }) => void;
  onUpdateLog: (logId: string, content: string) => void;
  onDeleteLog: (logId: string) => void;
  /** Manager review controls; omitted on the engineer side. */
  engineers?: Engineer[];
  onVerifyDay?: (authorId: string, logDate: string) => void;
  onUnverifyDay?: (authorId: string, logDate: string) => void;
}

function localToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Per-engineer daily work log.
 * Engineers write and manage their own entries. Managers don't write at all —
 * their side is a review feed: entries clustered per engineer per day, one
 * "Verify" sign-off per cluster, plus who hasn't logged today. Any change to
 * a verified day clears its verification (the api layer enforces it).
 */
export function DailyLogsView({
  logs,
  projects,
  onAddLog,
  onUpdateLog,
  onDeleteLog,
  engineers = [],
  onVerifyDay,
  onUnverifyDay,
}: DailyLogsViewProps) {
  const { profile, role } = useAuth();
  const isManager = role === 'MANAGER';

  const [content, setContent] = useState('');
  const [projectId, setProjectId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [authorFilter, setAuthorFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authors = useMemo(() => {
    const seen = new Map<string, string>();
    logs.forEach((l) => seen.set(l.authorId, l.authorName));
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [logs]);

  const visibleLogs = authorFilter ? logs.filter((l) => l.authorId === authorFilter) : logs;

  // Group by date, and within a date cluster per engineer (one cluster = one
  // verifiable unit). Logs arrive sorted newest-first from the api layer.
  const grouped = useMemo(() => {
    const days: { date: string; clusters: { authorId: string; authorName: string; entries: DailyLog[] }[] }[] = [];
    for (const log of visibleLogs) {
      let day = days[days.length - 1];
      if (!day || day.date !== log.logDate) {
        day = { date: log.logDate, clusters: [] };
        days.push(day);
      }
      let cluster = day.clusters.find((c) => c.authorId === log.authorId);
      if (!cluster) {
        cluster = { authorId: log.authorId, authorName: log.authorName, entries: [] };
        day.clusters.push(cluster);
      }
      cluster.entries.push(log);
    }
    return days;
  }, [visibleLogs]);

  // Manager: today's review picture (always from ALL logs, not the filter).
  const today = localToday();
  const review = useMemo(() => {
    if (!isManager) return null;
    const todays = logs.filter((l) => l.logDate === today);
    const loggedIds = new Set(todays.map((l) => l.authorId));
    const verifiedIds = new Set(todays.filter((l) => l.verifiedByName).map((l) => l.authorId));
    const missing = engineers.filter((e) => !loggedIds.has(e.id));
    return {
      logged: loggedIds.size,
      verified: verifiedIds.size,
      pending: loggedIds.size - verifiedIds.size,
      missing,
    };
  }, [isManager, logs, engineers, today]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddLog({ content: content.trim(), projectId: projectId || null, imageFile });
    setContent('');
    setProjectId('');
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatDate = (iso: string) => {
    const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
    const d = new Date(iso); d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((todayD.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderEntry = (log: DailyLog) => {
    const mine = log.authorId === profile?.id;
    const editing = editingId === log.id;
    return (
      <div key={log.id} className="group/entry">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {log.projectName && (
              <span className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                {log.projectName}
              </span>
            )}
          </div>
          {mine && !editing && (
            <div className="flex items-center gap-1 opacity-0 group-hover/entry:opacity-100 transition-opacity">
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
          <div className="mt-2 flex flex-col gap-2">
            <textarea
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white resize-none"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            {log.verifiedByName && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Saving changes will clear this day’s verification — {log.verifiedByName} will need to re-verify.
              </p>
            )}
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
          <>
            <p className={cn('text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap', log.projectName ? 'mt-2' : 'mt-0.5')}>
              {log.content}
            </p>
            {log.imageUrl && (
              <img
                src={log.imageUrl}
                alt="Site photo"
                className="mt-3 max-h-56 w-auto rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm"
              />
            )}
          </>
        )}
      </div>
    );
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
            {isManager ? 'Review and verify the team’s daily work.' : 'What did you work on today?'}
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

      {/* Manager: today's review summary + who hasn't logged */}
      {isManager && review && (
        <div className="mb-6 sm:mb-8 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Logged today', value: review.logged },
              { label: 'Verified', value: review.verified },
              { label: 'Pending review', value: review.pending },
            ].map((s) => (
              <div
                key={s.label}
                className="p-3.5 rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm"
              >
                <p className="text-xl font-semibold font-mono text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          {review.missing.length > 0 && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20">
              <UserX className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                <span className="font-semibold">Not logged today ({review.missing.length}):</span>{' '}
                {review.missing.slice(0, 8).map((e) => e.name).join(', ')}
                {review.missing.length > 8 && ` +${review.missing.length - 8} more`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Engineers write; managers only review */}
      {!isManager && (
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
          {imageFile && (
            <div className="flex items-center gap-2">
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Attached photo"
                className="h-16 w-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <button
                type="button"
                onClick={() => { setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title="Attach a site photo"
              >
                <ImagePlus className="w-4 h-4" /> Photo
              </button>
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Log
            </button>
          </div>
        </form>
      )}

      {grouped.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <NotebookPen className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-3" />
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">No logs yet</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">Daily log entries will appear here, newest first.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((day) => (
            <section key={day.date}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                {formatDate(day.date)}
              </h3>
              <div className="space-y-3">
                {day.clusters.map((cluster, idx) => {
                  const verifiedBy = cluster.entries[0].verifiedByName;
                  return (
                    <motion.div
                      key={`${day.date}-${cluster.authorId}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={cn(
                        'bg-white dark:bg-gray-900 rounded-xl border p-4 sm:p-5',
                        verifiedBy
                          ? 'border-emerald-200/70 dark:border-emerald-900/40'
                          : 'border-gray-200 dark:border-gray-800'
                      )}
                    >
                      {/* Cluster header: who + verification state/action */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {(isManager || cluster.authorId !== profile?.id) && (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[9px] font-bold uppercase shrink-0">
                                {cluster.authorName.charAt(0)}
                              </span>
                              <span className="truncate">{cluster.authorName}</span>
                            </span>
                          )}
                        </div>
                        {verifiedBy ? (
                          <span className="flex items-center gap-1.5 shrink-0">
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">
                              <BadgeCheck className="w-3.5 h-3.5" />
                              Verified · {verifiedBy.split(' ')[0]}
                            </span>
                            {isManager && onUnverifyDay && (
                              <button
                                onClick={() => onUnverifyDay(cluster.authorId, day.date)}
                                title="Remove verification"
                                className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </span>
                        ) : (
                          isManager && onVerifyDay && (
                            <button
                              onClick={() => onVerifyDay(cluster.authorId, day.date)}
                              className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                            >
                              <BadgeCheck className="w-3.5 h-3.5" /> Verify
                            </button>
                          )
                        )}
                      </div>

                      <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-800 [&>*+*]:pt-4">
                        {cluster.entries.map(renderEntry)}
                      </div>
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
