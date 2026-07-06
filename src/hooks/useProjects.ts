import { useState, useEffect, useCallback, useRef } from 'react';
import { Project, Engineer, Milestone, ProjectDoc, MilestoneStatus, EngineerTask, TaskStatus, TaskComment, DailyLog } from '../types';
import { initialProjects } from '../data';

const STORAGE_KEY = 'tavron-projects-data-v4';

// Use a mock supabase client if we want, but local storage is enough for the prototype
const supabase = null as any;

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastAction, setLastAction] = useState<{ label: string; previousState: Project[] } | null>(null);
  
  const undoTimeoutRef = useRef<number>();

  useEffect(() => {
    async function loadData() {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('projects').select('*');
          if (!error && data && data.length > 0) {
            setProjects(data.map((d: any) => d.data));
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Supabase load error", e);
        }
      }
      
      // Fallback to local storage or initial data
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData) {
        setProjects(JSON.parse(localData));
      } else {
        setProjects(initialProjects);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const saveToSupabase = async (project: Project) => {
    if (supabase) {
      await supabase.from('projects').upsert({ id: project.id, data: project });
    }
  };

  const deleteFromSupabase = async (projectId: string) => {
    if (supabase) {
      await supabase.from('projects').delete().eq('id', projectId);
    }
  };

  const commit = useCallback((newProjects: Project[], actionLabel: string | null = null, modifiedProject?: Project | null, deletedProjectId?: string | null) => {
    if (actionLabel) {
      setLastAction({ label: actionLabel, previousState: projects });
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = window.setTimeout(() => setLastAction(null), 7000);
    }
    
    setProjects(newProjects);
    
    // Save locally always as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
    
    // Save to Supabase
    if (modifiedProject) {
      saveToSupabase(modifiedProject);
    }
    if (deletedProjectId) {
      deleteFromSupabase(deletedProjectId);
    }
  }, [projects]);

  const undo = useCallback(() => {
    if (lastAction) {
      setProjects(lastAction.previousState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lastAction.previousState));
      
      // Sync whole state to supabase if undoing
      if (supabase) {
        lastAction.previousState.forEach(p => saveToSupabase(p));
      }
      
      setLastAction(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  }, [lastAction]);

  const addProject = useCallback((project: Project) => {
    commit([project, ...projects], 'Created project', project);
  }, [projects, commit]);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    let modified: Project | null = null;
    const next = projects.map(p => {
      if (p.id === projectId) {
        modified = { ...p, ...updates, updatedAt: new Date().toISOString() };
        return modified;
      }
      return p;
    });
    commit(next, updates.status === 'COMPLETED' ? 'Completed project' : updates.status === 'ACTIVE' ? 'Reopened project' : null, modified);
  }, [projects, commit]);

  const deleteProject = useCallback((projectId: string) => {
    commit(projects.filter(p => p.id !== projectId), 'Deleted project', null, projectId);
  }, [projects, commit]);

  const addEngineerToProject = useCallback((projectId: string, engineer: Engineer) => {
    let modified: Project | null = null;
    const next = projects.map(p => {
      if (p.id === projectId) {
        if (p.engineers.find(e => e.id === engineer.id)) return p;
        modified = { ...p, engineers: [...p.engineers, engineer], updatedAt: new Date().toISOString() };
        return modified;
      }
      return p;
    });
    commit(next, 'Assigned engineer', modified);
  }, [projects, commit]);

  const removeEngineerFromProject = useCallback((projectId: string, engineerId: string) => {
    let modified: Project | null = null;
    const next = projects.map(p => {
      if (p.id === projectId) {
        modified = { ...p, engineers: p.engineers.filter(e => e.id !== engineerId), updatedAt: new Date().toISOString() };
        return modified;
      }
      return p;
    });
    commit(next, 'Removed engineer', modified);
  }, [projects, commit]);

  const addMilestone = useCallback((projectId: string, milestone: Milestone) => {
    let modified: Project | null = null;
    const next = projects.map(p => {
      if (p.id === projectId) {
        modified = { ...p, milestones: [...p.milestones, milestone], updatedAt: new Date().toISOString() };
        return modified;
      }
      return p;
    });
    commit(next, 'Added milestone', modified);
  }, [projects, commit]);

  const updateMilestoneStatus = useCallback((projectId: string, milestoneId: string, status: MilestoneStatus, imageUrl?: string) => {
    let modified: Project | null = null;
    const next = projects.map(p => {
      if (p.id === projectId) {
        const newMilestones = p.milestones.map(m => m.id === milestoneId ? { ...m, status, ...(imageUrl ? { imageUrl } : {}) } : m);
        modified = { ...p, milestones: newMilestones, updatedAt: new Date().toISOString() };
        return modified;
      }
      return p;
    });
    commit(next, status === 'COMPLETED' ? 'Completed milestone' : 'Reopened milestone', modified);
  }, [projects, commit]);

  const deleteMilestone = useCallback((projectId: string, milestoneId: string) => {
    let modified: Project | null = null;
    const next = projects.map(p => {
      if (p.id === projectId) {
        modified = { ...p, milestones: p.milestones.filter(m => m.id !== milestoneId), updatedAt: new Date().toISOString() };
        return modified;
      }
      return p;
    });
    commit(next, 'Deleted milestone', modified);
  }, [projects, commit]);

  const addDocument = useCallback((projectId: string, doc: ProjectDoc) => {
    let modified: Project | null = null;
    const next = projects.map(p => {
      if (p.id === projectId) {
        modified = { ...p, docs: [...p.docs, doc], updatedAt: new Date().toISOString() };
        return modified;
      }
      return p;
    });
    commit(next, 'Attached document', modified);
  }, [projects, commit]);

  const deleteDocument = useCallback((projectId: string, docId: string) => {
    let modified: Project | null = null;
    const next = projects.map(p => {
      if (p.id === projectId) {
        modified = { ...p, docs: p.docs.filter(d => d.id !== docId), updatedAt: new Date().toISOString() };
        return modified;
      }
      return p;
    });
    commit(next, 'Removed document', modified);
  }, [projects, commit]);

  const addTask = useCallback((projectId: string, task: EngineerTask) => {
    let modified: Project | null = null;
    const next = projects.map(p => {
      if (p.id === projectId) {
        modified = { ...p, tasks: [...(p.tasks || []), task], updatedAt: new Date().toISOString() };
        return modified;
      }
      return p;
    });
    commit(next, 'Created task', modified);
  }, [projects, commit]);

  const updateTaskStatus = useCallback((projectId: string, taskId: string, status: TaskStatus) => {
    let modified: Project | null = null;
    const next = projects.map(p => {
      if (p.id === projectId) {
        const newTasks = p.tasks.map(t => t.id === taskId ? { ...t, status } : t);
        modified = { ...p, tasks: newTasks, updatedAt: new Date().toISOString() };
        return modified;
      }
      return p;
    });
    commit(next, 'Updated task status', modified);
  }, [projects, commit]);

  const deleteTask = useCallback((projectId: string, taskId: string) => {
    let modified: Project | null = null;
    const next = projects.map(p => {
      if (p.id === projectId) {
        modified = { ...p, tasks: p.tasks.filter(t => t.id !== taskId), updatedAt: new Date().toISOString() };
        return modified;
      }
      return p;
    });
    commit(next, 'Deleted task', modified);
  }, [projects, commit]);

  const addTaskComment = useCallback((projectId: string, taskId: string, comment: TaskComment) => {
    let modified: Project | null = null;
    const next = projects.map(p => {
      if (p.id === projectId) {
        const newTasks = p.tasks.map(t => {
          if (t.id === taskId) {
            return { ...t, comments: [...(t.comments || []), comment] };
          }
          return t;
        });
        modified = { ...p, tasks: newTasks, updatedAt: new Date().toISOString() };
        return modified;
      }
      return p;
    });
    commit(next, null, modified);
  }, [projects, commit]);

  const addDailyLog = useCallback((projectId: string, log: DailyLog) => {
    let modified: Project | null = null;
    const next = projects.map(p => {
      if (p.id === projectId) {
        modified = { ...p, dailyLogs: [log, ...(p.dailyLogs || [])], updatedAt: new Date().toISOString() };
        return modified;
      }
      return p;
    });
    commit(next, 'Submitted daily log', modified);
  }, [projects, commit]);

  return {
    projects,
    loading,
    lastAction,
    undo,
    addProject,
    updateProject,
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
    addDailyLog
  };
}
