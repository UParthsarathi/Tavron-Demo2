// UI-facing domain types. These are what components consume.
// The mapping from database rows (src/types/database.ts, generated) to these
// shapes lives in src/lib/api/ — components never touch raw DB rows.

export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';

export type UserRole = 'MANAGER' | 'ENGINEER';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  discipline: string | null;
  avatarUrl: string | null;
}

export interface Engineer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string; // discipline, e.g. "Mechanical Engineer"
}

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO date string
  status: MilestoneStatus;
  imageUrl?: string; // signed URL for the proof image, resolved by the api layer
}

export interface ProjectDoc {
  id: string;
  title: string;
  url: string; // external link, or signed URL for uploaded files
  type: 'LINK' | 'DOCUMENT';
  dateAdded: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface TaskComment {
  id: string;
  authorId: string;
  authorRole: 'MANAGER' | 'ENGINEER';
  authorName: string;
  content: string;
  createdAt: string;
  imageUrl?: string; // signed URL, resolved by the api layer
}

export interface EngineerTask {
  id: string;
  title: string;
  engineerId: string;
  projectId: string | null; // null = standalone task ("Delegate Work")
  projectName?: string;
  status: TaskStatus;
  comments?: TaskComment[];
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  engineers: Engineer[];
  milestones: Milestone[];
  docs: ProjectDoc[];
  tasks: EngineerTask[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyLog {
  id: string;
  authorId: string;
  authorName: string;
  logDate: string; // ISO date (yyyy-mm-dd)
  content: string;
  projectId: string | null;
  projectName: string | null;
  taskId: string | null;
  createdAt: string;
}
