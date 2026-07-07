import { supabase } from '@/lib/supabase';
import type { Milestone, Project, ProjectDoc, ProjectStatus, TaskComment } from '@/types';
import { mapProfileToEngineer } from './profiles';
import { createSignedUrls } from './storage';

// One nested query loads everything the UI renders for a project.
// RLS scopes the result automatically: managers see all projects,
// engineers only the ones they're members of.
const PROJECT_SELECT = `
  id, name, status, created_at, updated_at,
  project_members ( profile:profiles ( id, name, email, discipline, avatar_url ) ),
  milestones ( id, title, description, due_date, status, proof_image_path, created_at ),
  tasks ( id, title, status, assignee_id, project_id, created_at,
    task_comments ( id, content, image_path, created_at, author:profiles ( id, name, role ) ) ),
  documents ( id, title, doc_type, url, file_path, created_at )
` as const;

type ProjectRow = {
  id: string;
  name: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  project_members: {
    profile: { id: string; name: string; email: string; discipline: string | null; avatar_url: string | null } | null;
  }[];
  milestones: {
    id: string; title: string; description: string | null; due_date: string;
    status: Milestone['status']; proof_image_path: string | null; created_at: string;
  }[];
  tasks: CommentedTaskRow[];
  documents: {
    id: string; title: string; doc_type: 'LINK' | 'DOCUMENT';
    url: string | null; file_path: string | null; created_at: string;
  }[];
};

export type CommentedTaskRow = {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignee_id: string;
  project_id: string | null;
  created_at: string;
  task_comments: {
    id: string; content: string; image_path: string | null; created_at: string;
    author: { id: string; name: string; role: 'MANAGER' | 'ENGINEER' } | null;
  }[];
};

export function mapComments(
  rows: CommentedTaskRow['task_comments'],
  signed: Map<string, string>
): TaskComment[] {
  return rows
    .map((c) => ({
      id: c.id,
      authorId: c.author?.id ?? '',
      authorName: c.author?.name ?? 'Unknown',
      authorRole: (c.author?.role ?? 'ENGINEER') as TaskComment['authorRole'],
      content: c.content,
      createdAt: c.created_at,
      imageUrl: c.image_path ? signed.get(c.image_path) : undefined,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Collects every storage path referenced by these rows (for one batch signing call). */
export function collectTaskImagePaths(tasks: CommentedTaskRow[]): string[] {
  return tasks.flatMap((t) => t.task_comments.map((c) => c.image_path).filter((p): p is string => !!p));
}

function mapProject(row: ProjectRow, signed: Map<string, string>): Project {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    engineers: row.project_members
      .map((m) => m.profile)
      .filter((p): p is NonNullable<typeof p> => !!p)
      .map(mapProfileToEngineer),
    milestones: row.milestones
      .map((m): Milestone => ({
        id: m.id,
        title: m.title,
        description: m.description ?? undefined,
        dueDate: m.due_date,
        status: m.status,
        imageUrl: m.proof_image_path ? signed.get(m.proof_image_path) : undefined,
      }))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    tasks: row.tasks
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        engineerId: t.assignee_id,
        projectId: t.project_id,
        projectName: row.name,
        createdAt: t.created_at,
        comments: mapComments(t.task_comments, signed),
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    docs: row.documents
      .map((d): ProjectDoc => ({
        id: d.id,
        title: d.title,
        type: d.doc_type,
        url: (d.doc_type === 'LINK' ? d.url : d.file_path ? signed.get(d.file_path) : undefined) ?? '#',
        dateAdded: d.created_at,
      }))
      .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)),
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`Failed to load projects: ${error.message}`);

  const rows = (data ?? []) as unknown as ProjectRow[];

  // Resolve every referenced storage path in a single batch.
  const paths = rows.flatMap((r) => [
    ...r.milestones.map((m) => m.proof_image_path).filter((p): p is string => !!p),
    ...collectTaskImagePaths(r.tasks),
    ...r.documents.map((d) => d.file_path).filter((p): p is string => !!p),
  ]);
  const signed = await createSignedUrls(paths);

  return rows.map((r) => mapProject(r, signed));
}

export async function createProject(name: string, createdBy: string): Promise<string> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name, created_by: createdBy })
    .select('id')
    .single();
  if (error) throw new Error(`Failed to create project: ${error.message}`);
  return data.id;
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
  const { error } = await supabase.from('projects').update({ status }).eq('id', projectId);
  if (error) throw new Error(`Failed to update project: ${error.message}`);
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) throw new Error(`Failed to delete project: ${error.message}`);
}

export async function addProjectMember(projectId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from('project_members')
    .insert({ project_id: projectId, profile_id: profileId });
  if (error && error.code !== '23505' /* already a member */) {
    throw new Error(`Failed to assign engineer: ${error.message}`);
  }
}

export async function removeProjectMember(projectId: string, profileId: string): Promise<void> {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('profile_id', profileId);
  if (error) throw new Error(`Failed to remove engineer: ${error.message}`);
}
