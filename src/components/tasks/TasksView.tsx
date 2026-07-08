import React, { useState } from 'react';
import { Briefcase, MessageCircle, Plus, SquareCheck, ListTodo, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatTimeAgo } from '@/lib/utils';
import { Engineer, EngineerTask, Project, TaskStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface TasksViewProps {
  projects: Project[];
  standaloneTasks: EngineerTask[];
  engineers: Engineer[];
  onAddTask: (projectId: string | null, data: { title: string; engineerId: string }) => void;
  onUpdateTaskStatus: (projectId: string | null, taskId: string, status: TaskStatus) => void;
  onDeleteTask: (projectId: string | null, taskId: string) => void;
  onDiscussTask: (taskId: string) => void;
}

/**
 * Dual-purpose view:
 *  - MANAGER ("Delegate Work"): create standalone tasks (no project) and manage them.
 *  - ENGINEER ("My Tasks"): every task assigned to me — project or standalone —
 *    with the status dropdown I'm allowed to change.
 */
export function TasksView({
  projects,
  standaloneTasks,
  engineers,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onDiscussTask,
}: TasksViewProps) {
  const { profile, role } = useAuth();
  const isManager = role === 'MANAGER';

  const [title, setTitle] = useState('');
  const [engineerId, setEngineerId] = useState('');

  const myProjectTasks = !isManager && profile
    ? projects.flatMap((p) => p.tasks.filter((t) => t.engineerId === profile.id))
    : [];
  const tasks = isManager
    ? standaloneTasks
    : [...standaloneTasks, ...myProjectTasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !engineerId) return;
    onAddTask(null, { title: title.trim(), engineerId });
    setTitle('');
    setEngineerId('');
  };

  const engineerName = (id: string) =>
    engineers.find((e) => e.id === id)?.name ?? 'Unknown';

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-8 py-4 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          {isManager ? <Briefcase className="w-6 h-6" /> : <SquareCheck className="w-6 h-6" />}
          {isManager ? 'Delegate Work' : 'My Tasks'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {isManager
            ? 'Assign independent tasks to engineers outside of specific projects.'
            : 'Everything assigned to you — project tasks and standalone work.'}
        </p>
      </div>

      {isManager && (
        <form
          onSubmit={submit}
          className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            required
            placeholder="e.g. Prepare the site inspection checklist"
            className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            required
            className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            value={engineerId}
            onChange={(e) => setEngineerId(e.target.value)}
          >
            <option value="" disabled>Assign to…</option>
            {engineers.map((e) => (
              <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
            ))}
          </select>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Assign Task
          </button>
        </form>
      )}

      {tasks.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <ListTodo className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-3" />
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">No tasks yet</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            {isManager
              ? 'Standalone tasks you delegate will show up here.'
              : 'Tasks assigned to you will show up here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="pt-0.5">
                  {t.status === 'DONE' ? (
                    <SquareCheck className="w-5 h-5 text-brand-green-text" />
                  ) : (
                    <ListTodo className={cn("w-5 h-5", t.status === 'IN_PROGRESS' ? "text-amber-500" : "text-gray-300 dark:text-gray-600")} />
                  )}
                </div>
                <div>
                  <h4 className={cn("font-medium", t.status === 'DONE' ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white")}>
                    {t.title}
                  </h4>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    <span className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                      {t.projectId ? `Project: ${t.projectName ?? '—'}` : 'Standalone'}
                    </span>
                    {isManager && (
                      <span className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                        {engineerName(t.engineerId)}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">• Created {formatTimeAgo(t.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 md:pl-0 pl-9">
                <button
                  onClick={() => onDiscussTask(t.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Discuss
                </button>
                <select
                  value={t.status}
                  onChange={(e) => onUpdateTaskStatus(t.projectId, t.id, e.target.value as TaskStatus)}
                  className="text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
                {isManager && (
                  <button
                    onClick={() => onDeleteTask(t.projectId, t.id)}
                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
