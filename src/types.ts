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

export interface EngineerTask {
  id: string;
  title: string;
  engineerId: string;
  projectId: string | null; // null = standalone task ("Delegate Work")
  projectName?: string;
  status: TaskStatus;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Messaging. Every conversation is attached to something: a task, a milestone,
// a project as a whole ("General"), or a person (1:1 DM). One model for all
// four — see DECISIONS.md ("Messages inbox redesign").
// ---------------------------------------------------------------------------

export type ConversationType = 'TASK' | 'MILESTONE' | 'PROJECT' | 'DM';

/** The message being replied to, denormalized for rendering the quote block. */
export interface MessageQuote {
  id: string;
  authorName: string;
  content: string;
  hasImage: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
  imageUrl?: string; // signed URL, resolved by the api layer
  quote?: MessageQuote;
  pending?: boolean; // optimistic send awaiting server confirm
  failed?: boolean; // send failed; kept in the UI so the text isn't lost
}

/** One sidebar row: a conversation plus everything needed to render it. */
export interface InboxItem {
  conversationId: string;
  type: ConversationType;
  title: string; // task/milestone title, "General", or DM partner name
  projectId: string | null;
  projectName: string | null;
  taskId: string | null;
  taskStatus: TaskStatus | null;
  milestoneId: string | null;
  dmPartnerId: string | null;
  lastMessageAt: string | null; // null = no messages yet
  lastMessage: {
    authorId: string;
    authorName: string;
    content: string;
    hasImage: boolean;
  } | null;
  unreadCount: number;
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
  /** Site photo / GPS-tagged evidence attached to the entry. */
  imageUrl?: string | null;
  // Manager sign-off covers the author's whole day; every log row of that
  // engineer-day carries the same values. Editing the day clears it.
  verifiedByName?: string | null;
  verifiedAt?: string | null;
}
