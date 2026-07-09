// Frontend-only stand-in for src/lib/api — same module names, same function
// signatures, no network. src/lib/api/index.ts on this branch re-exports
// these instead of the Supabase-backed modules; components and hooks don't
// know the difference. A small artificial latency keeps loading states and
// optimistic sends visible.

import type {
  ChatMessage,
  DailyLog,
  Engineer,
  EngineerTask,
  InboxItem,
  MilestoneStatus,
  Profile,
  Project,
  ProjectStatus,
  TaskStatus,
} from '@/types';
import * as db from './data';

const err = (message: string) => new Error(message);

// ---------------------------------------------------------------------------
// storage
// ---------------------------------------------------------------------------

export const storage = {
  /** In the demo, the "storage path" IS a local object URL. */
  async uploadAttachment(_prefix: string, file: File): Promise<string> {
    await db.sleep(120);
    return URL.createObjectURL(file);
  },

  async createSignedUrls(paths: string[]): Promise<Map<string, string>> {
    return new Map(paths.filter(Boolean).map((p) => [p, p]));
  },
};

// ---------------------------------------------------------------------------
// profiles
// ---------------------------------------------------------------------------

const toEngineer = (p: Profile): Engineer => ({
  id: p.id,
  name: p.name,
  email: p.email,
  avatar: p.avatarUrl ?? undefined,
  role: p.discipline ?? 'Engineer',
});

export const profiles = {
  async fetchEngineers(): Promise<Engineer[]> {
    await db.sleep();
    return db.profiles
      .filter((p) => p.role === 'ENGINEER')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(toEngineer);
  },

  async fetchTeam(): Promise<Profile[]> {
    await db.sleep();
    return [...db.profiles].sort((a, b) => a.name.localeCompare(b.name));
  },

  async fetchMyProfile(userId: string): Promise<Profile | null> {
    return db.profiles.find((p) => p.id === userId) ?? null;
  },

  async inviteEngineer(_input: { email: string; name?: string; discipline: string }): Promise<void> {
    await db.sleep();
    throw err('Invitations are disabled in this demo');
  },
};

// ---------------------------------------------------------------------------
// projects
// ---------------------------------------------------------------------------

function mapProject(row: db.ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    engineers: row.memberIds
      .map((id) => db.profiles.find((p) => p.id === id))
      .filter((p): p is Profile => !!p)
      .map(toEngineer),
    milestones: db.milestones
      .filter((m) => m.projectId === row.id)
      .map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        dueDate: m.dueDate,
        status: m.status,
        imageUrl: m.imageUrl,
      }))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    tasks: db.tasks
      .filter((t) => t.projectId === row.id)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        engineerId: t.engineerId,
        projectId: t.projectId,
        projectName: row.name,
        createdAt: t.createdAt,
      }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    docs: db.docs
      .filter((d) => d.projectId === row.id)
      .map((d) => ({ id: d.id, title: d.title, type: d.type, url: d.url, dateAdded: d.dateAdded }))
      .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded)),
  };
}

export const projects = {
  async fetchProjects(): Promise<Project[]> {
    await db.sleep();
    return db
      .visibleProjects()
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(mapProject);
  },

  async createProject(name: string, _createdBy: string): Promise<string> {
    await db.sleep();
    const now = new Date().toISOString();
    const id = db.newId('p');
    db.projects.unshift({ id, name, status: 'ACTIVE', memberIds: [], createdAt: now, updatedAt: now });
    return id;
  },

  async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
    await db.sleep();
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) throw err('Project not found');
    p.status = status;
    p.updatedAt = new Date().toISOString();
  },

  async deleteProject(projectId: string): Promise<void> {
    await db.sleep();
    const taskIds = db.tasks.filter((t) => t.projectId === projectId).map((t) => t.id);
    const milestoneIds = db.milestones.filter((m) => m.projectId === projectId).map((m) => m.id);
    const deadConvs = new Set<string>([
      db.convForProject(projectId),
      ...taskIds.map(db.convForTask),
      ...milestoneIds.map(db.convForMilestone),
    ]);
    remove(db.projects, (p) => p.id === projectId);
    remove(db.tasks, (t) => t.projectId === projectId);
    remove(db.milestones, (m) => m.projectId === projectId);
    remove(db.docs, (d) => d.projectId === projectId);
    remove(db.messages, (m) => deadConvs.has(m.conversationId));
  },

  async addProjectMember(projectId: string, profileId: string): Promise<void> {
    await db.sleep();
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) throw err('Project not found');
    if (!p.memberIds.includes(profileId)) p.memberIds.push(profileId);
    p.updatedAt = new Date().toISOString();
  },

  async removeProjectMember(projectId: string, profileId: string): Promise<void> {
    await db.sleep();
    const p = db.projects.find((x) => x.id === projectId);
    if (!p) throw err('Project not found');
    p.memberIds = p.memberIds.filter((id) => id !== profileId);
    p.updatedAt = new Date().toISOString();
  },
};

function remove<T>(arr: T[], predicate: (item: T) => boolean): void {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) arr.splice(i, 1);
  }
}

// ---------------------------------------------------------------------------
// milestones
// ---------------------------------------------------------------------------

export const milestones = {
  async addMilestone(input: {
    projectId: string;
    title: string;
    dueDate: string;
    imageFile?: File | null;
  }): Promise<void> {
    await db.sleep();
    db.milestones.push({
      id: db.newId('m'),
      projectId: input.projectId,
      title: input.title,
      dueDate: input.dueDate.slice(0, 10),
      status: 'PENDING',
      imageUrl: input.imageFile ? URL.createObjectURL(input.imageFile) : undefined,
    });
    db.touchProject(input.projectId);
  },

  async updateMilestoneStatus(
    milestoneId: string,
    status: MilestoneStatus,
    proofImageFile?: File | null
  ): Promise<void> {
    await db.sleep();
    const m = db.milestones.find((x) => x.id === milestoneId);
    if (!m) throw err('Milestone not found');
    m.status = status;
    if (proofImageFile) m.imageUrl = URL.createObjectURL(proofImageFile);
    db.touchProject(m.projectId);
  },

  async deleteMilestone(milestoneId: string): Promise<void> {
    await db.sleep();
    const m = db.milestones.find((x) => x.id === milestoneId);
    remove(db.milestones, (x) => x.id === milestoneId);
    remove(db.messages, (x) => x.conversationId === db.convForMilestone(milestoneId));
    db.touchProject(m?.projectId);
  },
};

// ---------------------------------------------------------------------------
// tasks
// ---------------------------------------------------------------------------

function mapTask(t: db.TaskRow): EngineerTask {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    engineerId: t.engineerId,
    projectId: t.projectId,
    projectName: t.projectId ? db.projects.find((p) => p.id === t.projectId)?.name : undefined,
    createdAt: t.createdAt,
  };
}

export const tasks = {
  async fetchStandaloneTasks(): Promise<EngineerTask[]> {
    await db.sleep();
    const me = db.getCurrentDemoUser();
    return db.tasks
      .filter((t) => t.projectId === null)
      .filter((t) => db.viewerIsManager() || t.engineerId === me?.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(mapTask);
  },

  async fetchTasksAssignedTo(profileId: string): Promise<EngineerTask[]> {
    await db.sleep();
    return db.tasks
      .filter((t) => t.engineerId === profileId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(mapTask);
  },

  async createTask(input: {
    projectId: string | null;
    assigneeId: string;
    title: string;
    createdBy: string;
  }): Promise<void> {
    await db.sleep();
    db.tasks.push({
      id: db.newId('t'),
      projectId: input.projectId,
      title: input.title,
      status: 'TODO',
      engineerId: input.assigneeId,
      createdAt: new Date().toISOString(),
    });
    db.touchProject(input.projectId);
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    await db.sleep();
    const t = db.tasks.find((x) => x.id === taskId);
    if (!t) throw err('Task not found');
    t.status = status;
    db.touchProject(t.projectId);
  },

  async deleteTask(taskId: string): Promise<void> {
    await db.sleep();
    const t = db.tasks.find((x) => x.id === taskId);
    remove(db.tasks, (x) => x.id === taskId);
    remove(db.messages, (x) => x.conversationId === db.convForTask(taskId));
    db.touchProject(t?.projectId);
  },
};

// ---------------------------------------------------------------------------
// documents
// ---------------------------------------------------------------------------

export const documents = {
  async addLinkDocument(input: {
    projectId: string;
    title: string;
    url: string;
    createdBy: string;
  }): Promise<void> {
    await db.sleep();
    db.docs.push({
      id: db.newId('d'),
      projectId: input.projectId,
      title: input.title,
      type: 'LINK',
      url: input.url,
      dateAdded: new Date().toISOString(),
    });
    db.touchProject(input.projectId);
  },

  async uploadDocument(input: {
    projectId: string;
    title: string;
    file: File;
    createdBy: string;
  }): Promise<void> {
    await db.sleep(250);
    db.docs.push({
      id: db.newId('d'),
      projectId: input.projectId,
      title: input.title,
      type: 'DOCUMENT',
      url: URL.createObjectURL(input.file),
      dateAdded: new Date().toISOString(),
    });
    db.touchProject(input.projectId);
  },

  async deleteDocument(documentId: string): Promise<void> {
    await db.sleep();
    const d = db.docs.find((x) => x.id === documentId);
    remove(db.docs, (x) => x.id === documentId);
    db.touchProject(d?.projectId);
  },
};

// ---------------------------------------------------------------------------
// dailyLogs
// ---------------------------------------------------------------------------

export const dailyLogs = {
  async fetchDailyLogs(): Promise<DailyLog[]> {
    await db.sleep();
    const me = db.getCurrentDemoUser();
    return db.logs
      .filter((l) => db.viewerIsManager() || l.authorId === me?.id)
      .slice()
      .sort((a, b) => b.logDate.localeCompare(a.logDate) || b.createdAt.localeCompare(a.createdAt));
  },

  async createDailyLog(input: {
    authorId: string;
    content: string;
    logDate?: string;
    projectId?: string | null;
  }): Promise<void> {
    await db.sleep();
    const author = db.profiles.find((p) => p.id === input.authorId);
    const project = input.projectId ? db.projects.find((p) => p.id === input.projectId) : null;
    db.logs.push({
      id: db.newId('log'),
      authorId: input.authorId,
      authorName: author?.name ?? 'Unknown',
      logDate: input.logDate ?? db.dateOnly(0),
      content: input.content,
      projectId: input.projectId ?? null,
      projectName: project?.name ?? null,
      taskId: null,
      createdAt: new Date().toISOString(),
    });
  },

  async updateDailyLog(logId: string, content: string): Promise<void> {
    await db.sleep();
    const l = db.logs.find((x) => x.id === logId);
    if (!l) throw err('Log not found');
    l.content = content;
  },

  async deleteDailyLog(logId: string): Promise<void> {
    await db.sleep();
    remove(db.logs, (x) => x.id === logId);
  },
};

// ---------------------------------------------------------------------------
// realtime — a single-client demo has no other clients to hear from
// ---------------------------------------------------------------------------

export const realtime = {
  subscribeToChanges(_onChange: () => void): () => void {
    return () => {};
  },

  subscribeToChat(_handlers: {
    onMessageInsert: (row: { id: string; conversation_id: string }) => void;
    onInboxChange: () => void;
  }): () => void {
    return () => {};
  },
};

// ---------------------------------------------------------------------------
// conversations
// ---------------------------------------------------------------------------

function mapMessage(m: db.MessageRow): ChatMessage {
  const author = db.profiles.find((p) => p.id === m.authorId);
  const quoted = m.replyToId ? db.messages.find((x) => x.id === m.replyToId) : undefined;
  const quotedAuthor = quoted ? db.profiles.find((p) => p.id === quoted.authorId) : undefined;
  return {
    id: m.id,
    conversationId: m.conversationId,
    authorId: m.authorId,
    authorName: author?.name ?? 'Unknown',
    authorRole: author?.role ?? 'ENGINEER',
    content: m.content,
    createdAt: m.createdAt,
    imageUrl: m.imageUrl,
    quote: quoted
      ? {
          id: quoted.id,
          authorName: quotedAuthor?.name ?? 'Unknown',
          content: quoted.content,
          hasImage: !!quoted.imageUrl,
        }
      : undefined,
  };
}

function unreadCount(conversationId: string, viewerId: string): number {
  const lastRead = db.reads[`${conversationId}|${viewerId}`] ?? '1970-01-01T00:00:00Z';
  return db.messages.filter(
    (m) => m.conversationId === conversationId && m.authorId !== viewerId && m.createdAt > lastRead
  ).length;
}

function lastMessageOf(conversationId: string) {
  let last: db.MessageRow | null = null;
  for (const m of db.messages) {
    if (m.conversationId !== conversationId) continue;
    if (!last || m.createdAt > last.createdAt) last = m;
  }
  return last;
}

function inboxItem(
  base: Omit<InboxItem, 'lastMessageAt' | 'lastMessage' | 'unreadCount'>,
  viewerId: string
): InboxItem {
  const last = lastMessageOf(base.conversationId);
  const author = last ? db.profiles.find((p) => p.id === last.authorId) : null;
  return {
    ...base,
    lastMessageAt: last?.createdAt ?? null,
    lastMessage: last
      ? {
          authorId: last.authorId,
          authorName: author?.name ?? 'Unknown',
          content: last.content,
          hasImage: !!last.imageUrl,
        }
      : null,
    unreadCount: unreadCount(base.conversationId, viewerId),
  };
}

export const conversations = {
  async fetchInbox(): Promise<InboxItem[]> {
    await db.sleep();
    const me = db.getCurrentDemoUser();
    if (!me) return [];
    const items: InboxItem[] = [];
    const visible = db.visibleProjects();

    for (const p of visible) {
      items.push(
        inboxItem(
          {
            conversationId: db.convForProject(p.id),
            type: 'PROJECT',
            title: 'General',
            projectId: p.id,
            projectName: p.name,
            taskId: null,
            taskStatus: null,
            milestoneId: null,
            dmPartnerId: null,
          },
          me.id
        )
      );
      for (const m of db.milestones.filter((m) => m.projectId === p.id)) {
        items.push(
          inboxItem(
            {
              conversationId: db.convForMilestone(m.id),
              type: 'MILESTONE',
              title: m.title,
              projectId: p.id,
              projectName: p.name,
              taskId: null,
              taskStatus: null,
              milestoneId: m.id,
              dmPartnerId: null,
            },
            me.id
          )
        );
      }
    }

    const visibleIds = new Set(visible.map((p) => p.id));
    for (const t of db.tasks) {
      const visibleTask = t.projectId
        ? visibleIds.has(t.projectId)
        : db.viewerIsManager() || t.engineerId === me.id;
      if (!visibleTask) continue;
      items.push(
        inboxItem(
          {
            conversationId: db.convForTask(t.id),
            type: 'TASK',
            title: t.title,
            projectId: t.projectId,
            projectName: t.projectId ? db.projects.find((p) => p.id === t.projectId)?.name ?? null : null,
            taskId: t.id,
            taskStatus: t.status,
            milestoneId: null,
            dmPartnerId: null,
          },
          me.id
        )
      );
    }

    for (const dm of db.dms) {
      if (dm.a !== me.id && dm.b !== me.id) continue;
      const partnerId = dm.a === me.id ? dm.b : dm.a;
      const partner = db.profiles.find((p) => p.id === partnerId);
      items.push(
        inboxItem(
          {
            conversationId: dm.id,
            type: 'DM',
            title: partner?.name ?? 'Direct message',
            projectId: null,
            projectName: null,
            taskId: null,
            taskStatus: null,
            milestoneId: null,
            dmPartnerId: partnerId,
          },
          me.id
        )
      );
    }

    return items;
  },

  async fetchMessages(conversationId: string, limit = 200): Promise<ChatMessage[]> {
    await db.sleep();
    return db.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(-limit)
      .map(mapMessage);
  },

  async fetchMessage(messageId: string): Promise<ChatMessage | null> {
    const m = db.messages.find((x) => x.id === messageId);
    return m ? mapMessage(m) : null;
  },

  async sendMessage(input: {
    conversationId: string;
    authorId: string;
    content: string;
    imageFile?: File | null;
    replyToId?: string | null;
  }): Promise<ChatMessage> {
    await db.sleep(200);
    const row: db.MessageRow = {
      id: db.newId('msg'),
      conversationId: input.conversationId,
      authorId: input.authorId,
      content: input.content,
      imageUrl: input.imageFile ? URL.createObjectURL(input.imageFile) : undefined,
      replyToId: input.replyToId ?? undefined,
      createdAt: new Date().toISOString(),
    };
    db.messages.push(row);
    return mapMessage(row);
  },

  async markRead(conversationId: string, profileId: string): Promise<void> {
    db.reads[`${conversationId}|${profileId}`] = new Date().toISOString();
  },

  async startDm(myId: string, otherId: string): Promise<string> {
    await db.sleep();
    const [a, b] = [myId, otherId].sort();
    const existing = db.dms.find((d) => d.a === a && d.b === b);
    if (existing) return existing.id;
    const id = db.newId('conv-dm');
    db.dms.push({ id, a, b });
    return id;
  },
};

// ---------------------------------------------------------------------------
// push — nothing to deliver to in a frontend-only demo
// ---------------------------------------------------------------------------

export const push = {
  async saveSubscription(_sub: PushSubscription): Promise<void> {},
  async deleteSubscription(_endpoint: string): Promise<void> {},
  async removeCurrentDeviceSubscription(): Promise<void> {},
  async fanoutMessage(_messageId: string): Promise<void> {},
};
