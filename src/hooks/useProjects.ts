import { useCallback, useEffect, useRef, useState } from 'react';
import {
  dailyLogs as dailyLogsApi,
  documents as documentsApi,
  milestones as milestonesApi,
  profiles as profilesApi,
  projects as projectsApi,
  realtime as realtimeApi,
  tasks as tasksApi,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  DailyLog,
  Engineer,
  EngineerTask,
  MilestoneStatus,
  Project,
  ProjectStatus,
  TaskComment,
  TaskStatus,
} from '@/types';

/**
 * Upserts one comment into a task list. Removes any entry matching the new
 * comment's id or `replaceId` (the optimistic placeholder), then appends —
 * so it is safe regardless of whether the server confirm or the realtime
 * event lands first. Returns the input array untouched if the task isn't here.
 */
function upsertComment(
  tasks: EngineerTask[],
  taskId: string,
  comment: TaskComment,
  replaceId?: string
): EngineerTask[] {
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return tasks;
  const existing = tasks[idx].comments ?? [];
  const comments = existing
    .filter((c) => c.id !== comment.id && c.id !== replaceId)
    .concat(comment)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const next = [...tasks];
  next[idx] = { ...tasks[idx], comments };
  return next;
}

function dropComment(tasks: EngineerTask[], taskId: string, commentId: string): EngineerTask[] {
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return tasks;
  const next = [...tasks];
  next[idx] = { ...tasks[idx], comments: (tasks[idx].comments ?? []).filter((c) => c.id !== commentId) };
  return next;
}

function upsertInProjects(
  projects: Project[],
  taskId: string,
  comment: TaskComment,
  replaceId?: string
): Project[] {
  let changed = false;
  const next = projects.map((p) => {
    const tasks = upsertComment(p.tasks, taskId, comment, replaceId);
    if (tasks === p.tasks) return p;
    changed = true;
    return { ...p, tasks };
  });
  return changed ? next : projects;
}

export interface Notice {
  type: 'success' | 'error';
  label: string;
}

export type NewDocumentInput =
  | { title: string; type: 'LINK'; url: string }
  | { title: string; type: 'DOCUMENT'; file: File };

/**
 * The single state hub for backend data. Components call these functions and
 * never touch the Supabase client directly (see src/lib/api).
 *
 * Mutation model: await the API call, then refetch. Data volumes are tiny
 * (18 users), so refetching whole lists keeps the code simple and correct.
 */
export function useProjects() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [standaloneTasks, setStandaloneTasks] = useState<EngineerTask[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeTimeoutRef = useRef<number | null>(null);

  const showNotice = useCallback((n: Notice) => {
    setNotice(n);
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current);
    noticeTimeoutRef.current = window.setTimeout(() => setNotice(null), 5000);
  }, []);

  // Optimistic comments not yet confirmed by the server. refetch() re-applies
  // them so a background refresh can't make an in-flight message vanish.
  const pendingCommentsRef = useRef(new Map<string, { taskId: string; comment: TaskComment }>());

  const refetch = useCallback(async () => {
    const [projectList, engineerList, standaloneList, logList] = await Promise.all([
      projectsApi.fetchProjects(),
      profilesApi.fetchEngineers(),
      tasksApi.fetchStandaloneTasks(),
      dailyLogsApi.fetchDailyLogs(),
    ]);
    let nextProjects = projectList;
    let nextStandalone = standaloneList;
    for (const { taskId, comment } of pendingCommentsRef.current.values()) {
      nextProjects = upsertInProjects(nextProjects, taskId, comment);
      nextStandalone = upsertComment(nextStandalone, taskId, comment);
    }
    setProjects(nextProjects);
    setEngineers(engineerList);
    setStandaloneTasks(nextStandalone);
    setLogs(logList);
  }, []);

  /** Upserts a comment into whichever list holds its task (project or standalone). */
  const applyComment = useCallback((taskId: string, comment: TaskComment, replaceId?: string) => {
    setProjects((prev) => upsertInProjects(prev, taskId, comment, replaceId));
    setStandaloneTasks((prev) => upsertComment(prev, taskId, comment, replaceId));
  }, []);

  const removeComment = useCallback((taskId: string, commentId: string) => {
    setProjects((prev) => {
      let changed = false;
      const next = prev.map((p) => {
        const tasks = dropComment(p.tasks, taskId, commentId);
        if (tasks === p.tasks) return p;
        changed = true;
        return { ...p, tasks };
      });
      return changed ? next : prev;
    });
    setStandaloneTasks((prev) => dropComment(prev, taskId, commentId));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    refetch()
      .catch((e: Error) => { if (!cancelled) showNotice({ type: 'error', label: e.message }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refetch, showNotice]);

  // Incoming chat message: fetch that one row (author join + signed image,
  // under our own RLS) and patch it in — no full refetch. ~200ms vs ~1s.
  const handleCommentInsert = useCallback((row: { id: string; task_id: string }) => {
    void tasksApi.fetchTaskComment(row.id).then((res) => {
      if (res) applyComment(res.taskId, res.comment);
    });
  }, [applyComment]);

  // Realtime: chat messages take the patch lane above; everything else
  // triggers a debounced full refetch. The debounce is 1s because every
  // comment also bumps its project's updated_at (touch trigger), and a chat
  // burst shouldn't turn into a refetch storm.
  useEffect(() => {
    if (!profile) return;
    let timer: number | null = null;
    const unsubscribe = realtimeApi.subscribeToChanges({
      onCommentInsert: handleCommentInsert,
      onOtherChange: () => {
        if (timer) clearTimeout(timer);
        timer = window.setTimeout(() => {
          refetch().catch(() => { /* transient failure; next event retries */ });
        }, 1000);
      },
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [profile, refetch, handleCommentInsert]);

  /** Wraps a mutation: run, refetch, toast — errors become error toasts. */
  const run = useCallback(
    async (label: string | null, fn: () => Promise<void>): Promise<boolean> => {
      try {
        await fn();
        await refetch();
        if (label) showNotice({ type: 'success', label });
        return true;
      } catch (e) {
        showNotice({ type: 'error', label: e instanceof Error ? e.message : 'Something went wrong' });
        return false;
      }
    },
    [refetch, showNotice]
  );

  // ---- projects ------------------------------------------------------------
  const addProject = useCallback(async (name: string): Promise<string | null> => {
    if (!profile) return null;
    try {
      const id = await projectsApi.createProject(name, profile.id);
      await refetch();
      showNotice({ type: 'success', label: 'Created project' });
      return id;
    } catch (e) {
      showNotice({ type: 'error', label: e instanceof Error ? e.message : 'Failed to create project' });
      return null;
    }
  }, [profile, refetch, showNotice]);

  const updateProjectStatus = useCallback((projectId: string, status: ProjectStatus) =>
    run(
      status === 'COMPLETED' ? 'Completed project' : status === 'ACTIVE' ? 'Reopened project' : 'Updated project',
      () => projectsApi.updateProjectStatus(projectId, status)
    ), [run]);

  const deleteProject = useCallback((projectId: string) =>
    run('Deleted project', () => projectsApi.deleteProject(projectId)), [run]);

  const addEngineerToProject = useCallback((projectId: string, engineer: Engineer) =>
    run('Assigned engineer', () => projectsApi.addProjectMember(projectId, engineer.id)), [run]);

  const removeEngineerFromProject = useCallback((projectId: string, engineerId: string) =>
    run('Removed engineer', () => projectsApi.removeProjectMember(projectId, engineerId)), [run]);

  // ---- milestones ----------------------------------------------------------
  const addMilestone = useCallback(
    (projectId: string, data: { title: string; dueDate: string; imageFile?: File | null }) =>
      run('Added milestone', () => milestonesApi.addMilestone({ projectId, ...data })), [run]);

  const updateMilestoneStatus = useCallback(
    (_projectId: string, milestoneId: string, status: MilestoneStatus, proofImageFile?: File | null) =>
      run(
        status === 'COMPLETED' ? 'Completed milestone' : 'Reopened milestone',
        () => milestonesApi.updateMilestoneStatus(milestoneId, status, proofImageFile)
      ), [run]);

  const deleteMilestone = useCallback((_projectId: string, milestoneId: string) =>
    run('Deleted milestone', () => milestonesApi.deleteMilestone(milestoneId)), [run]);

  // ---- documents -----------------------------------------------------------
  const addDocument = useCallback(
    (projectId: string, input: NewDocumentInput) =>
      run('Attached document', () => {
        if (!profile) return Promise.reject(new Error('Not signed in'));
        return input.type === 'LINK'
          ? documentsApi.addLinkDocument({ projectId, title: input.title, url: input.url, createdBy: profile.id })
          : documentsApi.uploadDocument({ projectId, title: input.title, file: input.file, createdBy: profile.id });
      }), [run, profile]);

  const deleteDocument = useCallback((_projectId: string, docId: string) =>
    run('Removed document', () => documentsApi.deleteDocument(docId)), [run]);

  // ---- tasks ---------------------------------------------------------------
  const addTask = useCallback(
    (projectId: string | null, data: { title: string; engineerId: string }) =>
      run('Created task', () => {
        if (!profile) return Promise.reject(new Error('Not signed in'));
        return tasksApi.createTask({
          projectId,
          assigneeId: data.engineerId,
          title: data.title,
          createdBy: profile.id,
        });
      }), [run, profile]);

  const updateTaskStatus = useCallback(
    (_projectId: string | null, taskId: string, status: TaskStatus) =>
      run('Updated task status', () => tasksApi.updateTaskStatus(taskId, status)), [run]);

  const deleteTask = useCallback((_projectId: string | null, taskId: string) =>
    run('Deleted task', () => tasksApi.deleteTask(taskId)), [run]);

  // Optimistic send: the message renders instantly, then the confirmed row
  // (real id, signed image URL) replaces it. On failure it is removed with an
  // error toast. No full refetch on the send path.
  const addTaskComment = useCallback(
    async (taskId: string, data: { content: string; imageFile?: File | null }): Promise<boolean> => {
      if (!profile) return false;
      const tempId = `pending-${crypto.randomUUID()}`;
      const previewUrl = data.imageFile ? URL.createObjectURL(data.imageFile) : undefined;
      const optimistic: TaskComment = {
        id: tempId,
        authorId: profile.id,
        authorName: profile.name,
        authorRole: profile.role,
        content: data.content,
        createdAt: new Date().toISOString(),
        imageUrl: previewUrl,
      };
      pendingCommentsRef.current.set(tempId, { taskId, comment: optimistic });
      applyComment(taskId, optimistic);
      try {
        const saved = await tasksApi.addTaskComment({ taskId, authorId: profile.id, ...data });
        applyComment(taskId, saved, tempId);
        return true;
      } catch (e) {
        removeComment(taskId, tempId);
        showNotice({ type: 'error', label: e instanceof Error ? e.message : 'Failed to send message' });
        return false;
      } finally {
        pendingCommentsRef.current.delete(tempId);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      }
    },
    [profile, applyComment, removeComment, showNotice]
  );

  // ---- daily logs ----------------------------------------------------------
  const addDailyLog = useCallback(
    (data: { content: string; projectId?: string | null }) =>
      run('Saved log', () => {
        if (!profile) return Promise.reject(new Error('Not signed in'));
        return dailyLogsApi.createDailyLog({ authorId: profile.id, ...data });
      }), [run, profile]);

  const updateDailyLog = useCallback((logId: string, content: string) =>
    run('Updated log', () => dailyLogsApi.updateDailyLog(logId, content)), [run]);

  const deleteDailyLog = useCallback((logId: string) =>
    run('Deleted log', () => dailyLogsApi.deleteDailyLog(logId)), [run]);

  return {
    projects,
    engineers,
    standaloneTasks,
    logs,
    loading,
    notice,
    refetch,
    addProject,
    updateProjectStatus,
    deleteProject,
    addEngineerToProject,
    removeEngineerFromProject,
    addMilestone,
    updateMilestoneStatus,
    deleteMilestone,
    addDocument,
    deleteDocument,
    addTask,
    updateTaskStatus,
    deleteTask,
    addTaskComment,
    addDailyLog,
    updateDailyLog,
    deleteDailyLog,
  };
}
