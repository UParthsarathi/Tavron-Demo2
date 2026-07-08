import { supabase } from '@/lib/supabase';
import type { EngineerTask, TaskComment, TaskStatus } from '@/types';
import {
  collectTaskImagePaths,
  mapComments,
  type CommentedTaskRow,
} from './projects';
import { createSignedUrls, uploadAttachment } from './storage';

const TASK_SELECT = `
  id, title, status, assignee_id, project_id, created_at,
  project:projects ( name ),
  task_comments ( id, content, image_path, created_at, author:profiles ( id, name, role ) )
` as const;

type TaskRow = CommentedTaskRow & { project: { name: string } | null };

async function mapTasks(rows: TaskRow[]): Promise<EngineerTask[]> {
  const signed = await createSignedUrls(collectTaskImagePaths(rows));
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    engineerId: t.assignee_id,
    projectId: t.project_id,
    projectName: t.project?.name,
    createdAt: t.created_at,
    comments: mapComments(t.task_comments, signed),
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

const COMMENT_SELECT = `
  id, task_id, content, image_path, created_at,
  author:profiles ( id, name, role )
` as const;

type CommentRow = CommentedTaskRow['task_comments'][number] & { task_id: string };

async function mapSingleComment(row: CommentRow): Promise<TaskComment> {
  const signed = await createSignedUrls(row.image_path ? [row.image_path] : []);
  return mapComments([row], signed)[0];
}

/** Inserts a comment and returns it fully mapped (author + signed image). */
export async function addTaskComment(input: {
  taskId: string;
  authorId: string;
  content: string;
  imageFile?: File | null;
}): Promise<TaskComment> {
  const imagePath = input.imageFile
    ? await uploadAttachment('comment-images', input.imageFile)
    : null;
  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: input.taskId,
      author_id: input.authorId,
      content: input.content,
      image_path: imagePath,
    })
    .select(COMMENT_SELECT)
    .single();
  if (error) throw new Error(`Failed to send message: ${error.message}`);
  return mapSingleComment(data as unknown as CommentRow);
}

/**
 * One comment by id, for patching realtime events into state. The read runs
 * under the caller's RLS, so it doubles as the authorization check.
 * Null when the comment isn't visible (or was already deleted).
 */
export async function fetchTaskComment(
  commentId: string
): Promise<{ taskId: string; comment: TaskComment } | null> {
  const { data, error } = await supabase
    .from('task_comments')
    .select(COMMENT_SELECT)
    .eq('id', commentId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as CommentRow;
  return { taskId: row.task_id, comment: await mapSingleComment(row) };
}
