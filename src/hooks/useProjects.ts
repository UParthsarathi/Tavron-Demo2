import { useState, useCallback, useRef } from 'react';
import { Project, Engineer, Milestone, ProjectDoc, MilestoneStatus, EngineerTask, TaskStatus, TaskComment } from '../types';
import { initialProjects } from '../data';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [lastAction, setLastAction] = useState<{ label: string, previousState: Project[] } | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);

  const commit = useCallback((newProjects: Project[], actionLabel: string | null = null) => {
    if (actionLabel) {
      setLastAction({ label: actionLabel, previousState: projects });
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = window.setTimeout(() => setLastAction(null), 7000);
    }
    setProjects(newProjects);
  }, [projects]);

  const undo = useCallback(() => {
    if (lastAction) {
      setProjects(lastAction.previousState);
      setLastAction(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  }, [lastAction]);

  const addProject = useCallback((project: Project) => {
    commit([project, ...projects], 'Created project');
  }, [projects, commit]);

  const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
    commit(projects.map(p => {
      if (p.id === projectId) {
        return { ...p, ...updates, updatedAt: new Date().toISOString() };
      }
      return p;
    }), updates.status === 'COMPLETED' ? 'Completed project' : updates.status === 'ACTIVE' ? 'Reopened project' : null); // null doesn't trigger toast for generic updates unless desired
  }, [projects, commit]);

  const deleteProject = useCallback((projectId: string) => {
    commit(projects.filter(p => p.id !== projectId), 'Deleted project');
  }, [projects, commit]);

  const addEngineerToProject = useCallback((projectId: string, engineer: Engineer) => {
    commit(projects.map(p => {
      if (p.id === projectId) {
        // Prevent duplicates
        if (p.engineers.find(e => e.id === engineer.id)) return p;
        return { ...p, engineers: [...p.engineers, engineer], updatedAt: new Date().toISOString() };
      }
      return p;
    }), 'Assigned engineer');
  }, [projects, commit]);

  const removeEngineerFromProject = useCallback((projectId: string, engineerId: string) => {
    commit(projects.map(p => {
      if (p.id === projectId) {
        return { ...p, engineers: p.engineers.filter(e => e.id !== engineerId), updatedAt: new Date().toISOString() };
      }
      return p;
    }), 'Removed engineer');
  }, [projects, commit]);

  const addMilestone = useCallback((projectId: string, milestone: Milestone) => {
    commit(projects.map(p => {
      if (p.id === projectId) {
        return { ...p, milestones: [...p.milestones, milestone], updatedAt: new Date().toISOString() };
      }
      return p;
    }), 'Added milestone');
  }, [projects, commit]);

  const updateMilestoneStatus = useCallback((projectId: string, milestoneId: string, status: MilestoneStatus, imageUrl?: string) => {
    commit(projects.map(p => {
      if (p.id === projectId) {
        const newMilestones = p.milestones.map(m => m.id === milestoneId ? { ...m, status, ...(imageUrl ? { imageUrl } : {}) } : m);
        return { ...p, milestones: newMilestones, updatedAt: new Date().toISOString() };
      }
      return p;
    }), status === 'COMPLETED' ? 'Completed milestone' : 'Reopened milestone');
  }, [projects, commit]);

  const deleteMilestone = useCallback((projectId: string, milestoneId: string) => {
    commit(projects.map(p => {
      if (p.id === projectId) {
        return { ...p, milestones: p.milestones.filter(m => m.id !== milestoneId), updatedAt: new Date().toISOString() };
      }
      return p;
    }), 'Deleted milestone');
  }, [projects, commit]);

  const addDocument = useCallback((projectId: string, doc: ProjectDoc) => {
    commit(projects.map(p => {
      if (p.id === projectId) {
        return { ...p, docs: [...p.docs, doc], updatedAt: new Date().toISOString() };
      }
      return p;
    }), 'Attached document');
  }, [projects, commit]);

  const deleteDocument = useCallback((projectId: string, docId: string) => {
    commit(projects.map(p => {
      if (p.id === projectId) {
        return { ...p, docs: p.docs.filter(d => d.id !== docId), updatedAt: new Date().toISOString() };
      }
      return p;
    }), 'Removed document');
  }, [projects, commit]);

  const addTask = useCallback((projectId: string, task: EngineerTask) => {
    commit(projects.map(p => {
      if (p.id === projectId) {
        return { ...p, tasks: [...(p.tasks || []), task], updatedAt: new Date().toISOString() };
      }
      return p;
    }), 'Created task');
  }, [projects, commit]);

  const updateTaskStatus = useCallback((projectId: string, taskId: string, status: TaskStatus) => {
    commit(projects.map(p => {
      if (p.id === projectId) {
        const newTasks = p.tasks.map(t => t.id === taskId ? { ...t, status } : t);
        return { ...p, tasks: newTasks, updatedAt: new Date().toISOString() };
      }
      return p;
    }), 'Updated task status');
  }, [projects, commit]);

  const deleteTask = useCallback((projectId: string, taskId: string) => {
    commit(projects.map(p => {
      if (p.id === projectId) {
        return { ...p, tasks: p.tasks.filter(t => t.id !== taskId), updatedAt: new Date().toISOString() };
      }
      return p;
    }), 'Deleted task');
  }, [projects, commit]);

  const addTaskComment = useCallback((projectId: string, taskId: string, comment: TaskComment) => {
    commit(projects.map(p => {
      if (p.id === projectId) {
        const newTasks = p.tasks.map(t => {
          if (t.id === taskId) {
            return { ...t, comments: [...(t.comments || []), comment] };
          }
          return t;
        });
        return { ...p, tasks: newTasks, updatedAt: new Date().toISOString() };
      }
      return p;
    }), null);
  }, [projects, commit]);

  return {
    projects,
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
    addTaskComment
  };
}
