import React from 'react';
import { Project } from '@/types';
import { EngineerStatCards } from './EngineerStatCards';
import { EngineerActiveTasks } from './EngineerActiveTasks';
import { EngineerUpcomingMilestones } from './EngineerUpcomingMilestones';

interface EngineerDashboardProps {
  projects: Project[];
}

export function EngineerDashboard({ projects }: EngineerDashboardProps) {
  // Aggregate tasks
  const allTasks = projects.flatMap(p => 
    (p.tasks || []).map(t => ({ ...t, projectName: p.name, projectId: p.id }))
  );
  
  const todoTasks = allTasks.filter(t => t.status === 'TODO');
  const inProgressTasks = allTasks.filter(t => t.status === 'IN_PROGRESS');
  const pendingTasks = [...todoTasks, ...inProgressTasks];
  const completedTasks = allTasks.filter(t => t.status === 'DONE');
  
  // Aggregate projects
  const activeProjects = projects.filter(p => p.status === 'ACTIVE');
  
  // Aggregate milestones
  const upcomingMilestones = projects.flatMap(p => {
    return p.milestones
      .filter(m => m.status === 'PENDING' || m.status === 'IN_PROGRESS')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 2)
      .map(m => ({ ...m, projectName: p.name, projectId: p.id }));
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Dashboard</h2>
        <p className="text-gray-500 dark:text-gray-400">Overview of your projects and assigned work</p>
      </div>
      
      <EngineerStatCards 
        activeProjectsCount={activeProjects.length}
        todoTasksCount={todoTasks.length}
        inProgressTasksCount={inProgressTasks.length}
        completedTasksCount={completedTasks.length}
      />

      <div className="grid md:grid-cols-2 gap-8">
        <EngineerActiveTasks tasks={pendingTasks} />
        <EngineerUpcomingMilestones milestones={upcomingMilestones} />
      </div>
    </div>
  );
}
