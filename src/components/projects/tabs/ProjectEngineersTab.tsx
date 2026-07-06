import React from 'react';
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
