import { supabase } from '@/lib/supabase';
import type { EngineerTask, TaskStatus } from '@/types';
import { type BareTaskRow } from './projects';

const TASK_SELECT = `
  id, title, status, assignee_id, project_id, created_at,
  project:projects ( name )
` as const;

type TaskRow = BareTaskRow & { project: { name: string } | null };

function mapTasks(rows: TaskRow[]): EngineerTask[] {
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    engineerId: t.assignee_id,
    projectId: t.project_id,
    projectName: t.project?.name,
    createdAt: t.created_at,
  }));
}

/**
 * Standalone tasks ("Delegate Work"): no project attached.
 * RLS scopes the result — managers get all, engineers get their own.
 */
export async function fetchStandaloneTasks(): Promise<EngineerTask[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .is('project_id', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to load tasks: ${error.message}`);
  return mapTasks((data ?? []) as unknown as TaskRow[]);
}

/** Every task assigned to one engineer, project or standalone (My Tasks view). */
export async function fetchTasksAssignedTo(profileId: string): Promise<EngineerTask[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('assignee_id', profileId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to load tasks: ${error.message}`);
  return mapTasks((data ?? []) as unknown as TaskRow[]);
}

export async function createTask(input: {
  projectId: string | null;
  assigneeId: string;
  title: string;
  createdBy: string;
}): Promise<void> {
  const { error } = await supabase.from('tasks').insert({
    project_id: input.projectId,
    assignee_id: input.assigneeId,
    title: input.title,
    created_by: input.createdBy,
  });
  if (error) throw new Error(`Failed to create task: ${error.message}`);
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  const { error } = await supabase.from('tasks').update({ status }).eq('id', taskId);
  if (error) throw new Error(`Failed to update task: ${error.message}`);
}

export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw new Error(`Failed to delete task: ${error.message}`);
}
