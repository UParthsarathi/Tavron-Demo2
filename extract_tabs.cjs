const fs = require('fs');

const overviewTab = `import React from 'react';
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
`;
fs.writeFileSync('src/components/projects/tabs/ProjectOverviewTab.tsx', overviewTab);

const engineersTab = `import React from 'react';
import { Project } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

interface ProjectEngineersTabProps {
  project: Project;
  readOnly?: boolean;
  onAddEngineerClick: () => void;
  onRemoveEngineer: (projectId: string, engineerId: string) => void;
}

export function ProjectEngineersTab({ project, readOnly, onAddEngineerClick, onRemoveEngineer }: ProjectEngineersTabProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">Assigned Engineers</h3>
        {!readOnly && (
          <button onClick={onAddEngineerClick} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        )}
      </div>
      {project.engineers.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 italic">No engineers assigned yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {project.engineers.map(e => (
            <div key={e.id} className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 font-semibold uppercase">
                  {e.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{e.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{e.role}</p>
                </div>
              </div>
              {!readOnly && (
                <button 
                  onClick={() => onRemoveEngineer(project.id, e.id)}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove Engineer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/components/projects/tabs/ProjectEngineersTab.tsx', engineersTab);

