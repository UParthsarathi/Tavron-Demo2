export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';

export interface Engineer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // ISO date string
  status: MilestoneStatus;
  imageUrl?: string;
}

export interface ProjectDoc {
  id: string;
  title: string;
  url: string; // the link or simulated file path
  type: 'LINK' | 'DOCUMENT';
  dateAdded: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface TaskComment {
  id: string;
  authorRole: 'MANAGER' | 'ENGINEER';
  authorName: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
}

export interface EngineerTask {
  id: string;
  title: string;
  engineerId: string;
  status: TaskStatus;
  comments?: TaskComment[];
  createdAt: string;
}


export interface DailyLog {
  id: string;
  projectId: string;
  engineerId: string;
  engineerName: string;
  tasksCompleted: string;
  blockers?: string;
  photoUrl: string;
  location?: { lat: number; lng: number };
  createdAt: string;
}

export interface Project {
  dailyLogs?: DailyLog[];
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
