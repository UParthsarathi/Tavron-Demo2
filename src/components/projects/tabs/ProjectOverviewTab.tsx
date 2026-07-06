import React from 'react';
import { Project } from '@/types';
import { CircleCheck, Users, ListTodo, Calendar, FileText } from 'lucide-react';

interface ProjectOverviewTabProps {
  project: Project;
}

export function ProjectOverviewTab({ project }: ProjectOverviewTabProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {project.status === 'COMPLETED' && (
        <div className="bg-brand-green/50 dark:bg-brand-green/10 border border-brand-green dark:border-brand-green/20 overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-2">
            <CircleCheck className="w-6 h-6 text-brand-green-text" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Project Completed</h3>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            This project was completed on {new Date(project.updatedAt).toLocaleDateString()}.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm col-span-1">
          <div className="flex items-center gap-2 sm:gap-3 text-gray-500 dark:text-gray-400 mb-2 sm:mb-4">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-sm sm:text-base font-medium">Team Size</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">{project.engineers.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm col-span-1">
          <div className="flex items-center gap-2 sm:gap-3 text-gray-500 dark:text-gray-400 mb-2 sm:mb-4">
            <ListTodo className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-sm sm:text-base font-medium">Open Tasks</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
            {project.tasks ? project.tasks.filter(t => t.status !== 'DONE').length : 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm col-span-1">
          <div className="flex items-center gap-2 sm:gap-3 text-gray-500 dark:text-gray-400 mb-2 sm:mb-4">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-sm sm:text-base font-medium">Pending Milestones</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
            {project.milestones.filter(m => m.status !== 'COMPLETED').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm col-span-1">
          <div className="flex items-center gap-2 sm:gap-3 text-gray-500 dark:text-gray-400 mb-2 sm:mb-4">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-sm sm:text-base font-medium">Attached Docs</h3>
          </div>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">{project.docs.length}</p>
        </div>
      </div>
    </div>
  );
}
