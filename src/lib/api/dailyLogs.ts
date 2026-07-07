import { supabase } from '@/lib/supabase';
import type { DailyLog } from '@/types';

const LOG_SELECT = `
  id, author_id, log_date, content, project_id, task_id, created_at,
  author:profiles ( name ),
  project:projects ( name )
` as const;

type LogRow = {
  id: string;
  author_id: string;
  log_date: string;
  content: string;
  project_id: string | null;
  task_id: string | null;
  created_at: string;
  author: { name: string } | null;
  project: { name: string } | null;
};

function mapLog(row: LogRow): DailyLog {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author?.name ?? 'Unknown',
    logDate: row.log_date,
    content: row.content,
    projectId: row.project_id,
    projectName: row.project?.name ?? null,
    taskId: row.task_id,
    createdAt: row.created_at,
  };
}

/** RLS scopes the result: managers see everyone's logs, engineers their own. */
export async function fetchDailyLogs(): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select(LOG_SELECT)
    .order('log_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to load daily logs: ${error.message}`);
  return ((data ?? []) as unknown as LogRow[]).map(mapLog);
}

export async function createDailyLog(input: {
  authorId: string;
  content: string;
  logDate?: string; // ISO date; defaults to today (DB default)
  projectId?: string | null;
}): Promise<void> {
  const { error } = await supabase.from('daily_logs').insert({
    author_id: input.authorId,
    content: input.content,
    ...(input.logDate ? { log_date: input.logDate } : {}),
    project_id: input.projectId ?? null,
  });
  if (error) throw new Error(`Failed to save log: ${error.message}`);
}

export async function updateDailyLog(logId: string, content: string): Promise<void> {
  const { error } = await supabase.from('daily_logs').update({ content }).eq('id', logId);
  if (error) throw new Error(`Failed to update log: ${error.message}`);
}

export async function deleteDailyLog(logId: string): Promise<void> {
  const { error } = await supabase.from('daily_logs').delete().eq('id', logId);
  if (error) throw new Error(`Failed to delete log: ${error.message}`);
}
