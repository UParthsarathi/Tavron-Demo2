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
  TaskStatus,
} from '@/types';

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

  const refetch = useCallback(async () => {
    const [projectList, engineerList, standaloneList, logList] = await Promise.all([
      projectsApi.fetchProjects(),
      profilesApi.fetchEngineers(),
      tasksApi.fetchStandaloneTasks(),
      dailyLogsApi.fetchDailyLogs(),
    ]);
    setProjects(projectList);
    setEngineers(engineerList);
    setStandaloneTasks(standaloneList);
    setLogs(logList);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    refetch()
      .catch((e: Error) => { if (!cancelled) showNotice({ type: 'error', label: e.message }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [refetch, showNotice]);

  // Realtime: structural changes made by other clients trigger a refetch.
  // Chat traffic never lands here (see realtime.ts); useConversations owns it.
  useEffect(() => {
    if (!profile) return;
    let timer: number | null = null;
    const unsubscribe = realtimeApi.subscribeToChanges(() => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(() => {
        refetch().catch(() => { /* transient failure; next event retries */ });
      }, 300);
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [profile, refetch]);

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
    addDailyLog,
    updateDailyLog,
    deleteDailyLog,
  };
}
