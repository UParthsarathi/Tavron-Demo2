const fs = require('fs');

const milestonesTab = `import React from 'react';
import { Project, Milestone } from '@/types';
import { Plus, Calendar, CircleCheck, Circle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectMilestonesTabProps {
  project: Project;
  readOnly?: boolean;
  showAllMilestones: boolean;
  onToggleShowAll: () => void;
  onAddMilestoneClick: () => void;
  onCompleteMilestoneClick: (milestoneId: string) => void;
  onDeleteMilestone: (projectId: string, milestoneId: string) => void;
}

export function ProjectMilestonesTab({
  project,
  readOnly,
  showAllMilestones,
  onToggleShowAll,
  onAddMilestoneClick,
  onCompleteMilestoneClick,
  onDeleteMilestone
}: ProjectMilestonesTabProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Project Timeline</h3>
          {project.milestones.length > 1 && (
            <button
              onClick={onToggleShowAll}
              className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {showAllMilestones ? 'Show Current Only' : 'View Full Timeline'}
            </button>
          )}
        </div>
        {!readOnly && (
          <button onClick={onAddMilestoneClick} className="flex items-center gap-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Milestone
          </button>
        )}
      </div>
      {project.milestones.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-3" />
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-300 mb-1">No milestones yet</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">Create milestones to track important project phases, deadlines, and deliverables.</p>
        </div>
      ) : (
        <div className="relative pl-3 md:pl-0 py-4">
          <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800 transform md:-translate-x-1/2" />
          
          <div className="space-y-8 relative">
            {(() => {
              const sorted = [...project.milestones].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
              const currentIdx = sorted.findIndex(m => m.status !== 'COMPLETED');
              const displayList = showAllMilestones 
                ? sorted 
                : (sorted.length > 0 ? [currentIdx !== -1 ? sorted[currentIdx] : sorted[sorted.length - 1]] : []);
                
              return displayList.map((m, originalIdx) => {
                const idx = showAllMilestones ? originalIdx : 0;
                const isEven = idx % 2 === 0;
                const dueDate = new Date(m.dueDate);
                dueDate.setHours(0,0,0,0);
                const today = new Date();
                today.setHours(0,0,0,0);
                const isPastDue = dueDate < today && m.status !== 'COMPLETED';
              
                return (
                  <div key={m.id} className={cn("relative flex items-center justify-between md:justify-normal w-full", isEven ? "md:flex-row-reverse" : "md:flex-row")}>
                    <div className="absolute left-[27px] md:left-1/2 w-8 h-8 rounded-full bg-white dark:bg-gray-950 border-4 border-gray-100 dark:border-gray-900 flex items-center justify-center transform -translate-x-1/2 z-10 shadow-sm">
                      {m.status === 'COMPLETED' ? (
                        <CircleCheck className="w-5 h-5 text-brand-green-text bg-white dark:bg-gray-900 rounded-full" />
                      ) : (
                        <Circle className={cn("w-4 h-4", isPastDue ? "text-amber-500 fill-amber-50 dark:fill-amber-900/30" : "text-gray-300 dark:text-gray-700 fill-gray-50 dark:fill-gray-800")} />
                      )}
                    </div>
                    
                    <div className="hidden md:block w-1/2" />
                    
                    <div className={cn("w-full md:w-1/2 pl-14 md:pl-0", isEven ? "md:pr-12" : "md:pl-12")}>
                      <div className={cn(
                        "p-5 rounded-2xl border transition-all duration-200",
                        m.status === 'COMPLETED' ? "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800" : 
                        isPastDue ? "bg-red-50/30 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 shadow-sm" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md"
                      )}>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                          <div>
                            <h4 className={cn("font-semibold text-base", m.status === 'COMPLETED' ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-gray-100")}>
                              {m.title}
                            </h4>
                            {m.imageUrl && (
                              <img src={m.imageUrl} alt="Milestone attachment" className="mt-3 w-full max-h-48 object-cover rounded-lg shadow-sm border border-gray-100 dark:border-gray-800" />
                            )}
                            <div className="flex items-center flex-wrap gap-2 mt-3">
                              <div className="flex items-center gap-1.5">
                                <Calendar className={cn("w-3.5 h-3.5", m.status === 'COMPLETED' ? "text-gray-400" : isPastDue ? "text-red-500" : "text-gray-500 dark:text-gray-400")} />
                                <span className={cn("text-xs font-medium", m.status === 'COMPLETED' ? "text-gray-400 dark:text-gray-500" : isPastDue ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400")}>
                                  {new Date(m.dueDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                              {isPastDue && (
                                 <span className="text-[10px] uppercase font-bold tracking-wider bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full ml-1">Overdue</span>
                              )}
                            </div>
                          </div>
                          
                          {!readOnly && (
                            <>
                              {m.status !== 'COMPLETED' ? (
                                <button 
                                  onClick={() => onCompleteMilestoneClick(m.id)}
                                  className="text-xs font-semibold bg-white dark:bg-gray-900 hover:bg-brand-green dark:hover:bg-brand-green/20 hover:text-brand-green-text text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand-green-text px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow-sm group"
                                >
                                  <span className="flex items-center gap-1.5"><CircleCheck className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" /> Complete</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => onDeleteMilestone(project.id, m.id)}
                                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                  title="Delete Milestone"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/components/projects/tabs/ProjectMilestonesTab.tsx', milestonesTab);

