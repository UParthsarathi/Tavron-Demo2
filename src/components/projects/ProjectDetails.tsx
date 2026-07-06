import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, UploadCloud, Trash2, Undo2, FileText } from 'lucide-react';
import { Project, Engineer, Milestone, ProjectDoc, MilestoneStatus, EngineerTask, TaskStatus, TaskComment } from '@/types';
import { formatTimeAgo, generateId, cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { CompleteProjectModal } from './CompleteProjectModal';
import { ProjectDocumentsModal } from './ProjectDocumentsModal';
import { motion } from 'motion/react';

// Sub-components
import { ProjectOverviewTab } from './tabs/ProjectOverviewTab';
import { ProjectEngineersTab } from './tabs/ProjectEngineersTab';
import { ProjectTasksTab } from './tabs/ProjectTasksTab';
import { ProjectMilestonesTab } from './tabs/ProjectMilestonesTab';
import { ProjectLogsTab } from './tabs/ProjectLogsTab';

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onDeleteProject: () => void;
  onAddEngineer: (projectId: string, eng: Engineer) => void;
  onRemoveEngineer: (projectId: string, engId: string) => void;
  onAddMilestone: (projectId: string, milestone: Milestone) => void;
  onUpdateMilestoneStatus: (projectId: string, milestoneId: string, status: MilestoneStatus, imageUrl?: string) => void;
  onDeleteMilestone: (projectId: string, milestoneId: string) => void;
  onAddDoc: (projectId: string, doc: ProjectDoc) => void;
  onDeleteDoc: (projectId: string, docId: string) => void;
  onAddTask: (projectId: string, task: EngineerTask) => void;
  onUpdateTaskStatus: (projectId: string, taskId: string, status: TaskStatus) => void;
  onDeleteTask: (projectId: string, taskId: string) => void;
  onAddTaskComment: (projectId: string, taskId: string, comment: TaskComment) => void;
  onDiscussTask?: (task: EngineerTask) => void;
  readOnly?: boolean;
}

export function ProjectDetails({ 
  project, 
  onBack, 
  onUpdateProject, 
  onDeleteProject,
  onAddEngineer, 
  onRemoveEngineer,
  onAddMilestone, 
  onUpdateMilestoneStatus,
  onDeleteMilestone,
  onAddDoc, 
  onDeleteDoc,
  onAddTask,
  onUpdateTaskStatus,
  onDeleteTask,
  onAddTaskComment,
  onDiscussTask,
  readOnly = false
}: ProjectDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'engineers' | 'tasks' | 'milestones' | 'logs'>('overview');
  const [activeLogTab, setActiveLogTab] = useState<'all' | string>('all');
  
  // Modals state
  const [isEngModalOpen, setEngModalOpen] = useState(false);
  const [isMilestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [isViewDocsModalOpen, setViewDocsModalOpen] = useState(false);
  const [isCompleteModalOpen, setCompleteModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  
  const [showAllMilestones, setShowAllMilestones] = useState(false);
  
  // Milestone Form
  const [mTitle, setMTitle] = useState('');
  const [mDate, setMDate] = useState('');
  const [mImage, setMImage] = useState<File | null>(null);

  // Task Form
  const [tTitle, setTTitle] = useState('');
  const [tEngineerId, setTEngineerId] = useState('');

  const submitMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle || !mDate) return;
    
    let imageUrl = '';
    if (mImage) {
      imageUrl = URL.createObjectURL(mImage);
    }
    
    onAddMilestone(project.id, {
      id: generateId(),
      title: mTitle,
      dueDate: new Date(mDate).toISOString(),
      status: 'PENDING',
      imageUrl
    });
    setMTitle(''); setMDate(''); setMImage(null);
    setMilestoneModalOpen(false);
  };

  const submitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle || !tEngineerId) return;
    
    onAddTask(project.id, {
      id: generateId(),
      title: tTitle,
      engineerId: tEngineerId,
      status: 'TODO',
      createdAt: new Date().toISOString()
    });
    setTTitle(''); setTEngineerId('');
    setTaskModalOpen(false);
  };

  const [backendEngineers, setBackendEngineers] = useState<Engineer[]>([]);
  useEffect(() => {
    fetch('/api/engineers')
      .then(res => res.json())
      .then(data => setBackendEngineers(data))
      .catch(err => console.error("Failed to fetch engineers", err));
  }, []);

  // Filter available engineers to not show ones already in project
  const availableEngineers = backendEngineers.filter(me => !project.engineers.find(e => e.id === me.id));

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-8 py-4 sm:py-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          {!readOnly && project.status === 'ACTIVE' ? (
            <button 
              onClick={() => setCompleteModalOpen(true)}
              className="text-xs sm:text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1.5 rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
            >
              Complete
            </button>
          ) : !readOnly && project.status !== 'ACTIVE' ? (
             <button 
              onClick={() => onUpdateProject(project.id, { status: 'ACTIVE', updatedAt: new Date().toISOString() })}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Undo2 className="w-4 h-4" /> Re-open
            </button>
          ) : null}
          
          {!readOnly && (
            <button
              onClick={() => {
                 if (confirm('Are you sure you want to delete this project?')) {
                   onDeleteProject();
                 }
              }}
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              title="Delete Project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">{project.name}</h2>
            <span className={cn(
              "px-2.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full",
              project.status === 'ACTIVE' ? "bg-brand-green text-brand-green-text" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            )}>
              {project.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Last updated {formatTimeAgo(project.updatedAt)}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setViewDocsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-sm font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" /> Docs
          </button>
          
          <button 
            onClick={() => setActiveTab('logs')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-sm font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
          >
            <UploadCloud className="w-4 h-4" /> Daily Logs
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6 sm:mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'engineers', label: 'Engineers' },
          { id: 'tasks', label: 'Tasks' },
          { id: 'milestones', label: 'Milestones' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id 
                ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" 
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && (
          <ProjectOverviewTab project={project} />
        )}

        {activeTab === 'engineers' && (
          <ProjectEngineersTab 
            project={project}
            readOnly={readOnly}
            onAddEngineerClick={() => setEngModalOpen(true)}
            onRemoveEngineer={onRemoveEngineer}
          />
        )}

        {activeTab === 'tasks' && (
          <ProjectTasksTab 
            project={project}
            readOnly={readOnly}
            onAssignTaskClick={() => setTaskModalOpen(true)}
            onUpdateTaskStatus={onUpdateTaskStatus}
            onDeleteTask={onDeleteTask}
            onDiscussTask={onDiscussTask}
            onAddTaskComment={(projectId, taskId, comment) => {
              onAddTaskComment(projectId, taskId, {
                ...comment,
                id: generateId(),
                createdAt: new Date().toISOString()
              });
            }}
          />
        )}

        {activeTab === 'logs' && (
          <ProjectLogsTab 
            project={project}
            activeLogTab={activeLogTab}
            onSetActiveLogTab={setActiveLogTab}
          />
        )}

        {activeTab === 'milestones' && (
          <ProjectMilestonesTab 
            project={project}
            readOnly={readOnly}
            showAllMilestones={showAllMilestones}
            onToggleShowAll={() => setShowAllMilestones(!showAllMilestones)}
            onAddMilestoneClick={() => setMilestoneModalOpen(true)}
            onCompleteMilestoneClick={(id) => {
               onUpdateMilestoneStatus(project.id, id, 'COMPLETED');
            }}
            onDeleteMilestone={onDeleteMilestone}
          />
        )}
      </motion.div>

      {/* Modals */}
      <CompleteProjectModal
        project={project}
        isOpen={isCompleteModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        onConfirm={() => {
          onUpdateProject(project.id, { 
            status: 'COMPLETED',
            updatedAt: new Date().toISOString()
          });
          setCompleteModalOpen(false);
        }}
      />

      <Modal isOpen={isEngModalOpen} onClose={() => setEngModalOpen(false)} title="Assign Engineer">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Select engineers to assign to {project.name}.</p>
          {availableEngineers.length === 0 ? (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-center text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800">
              No available engineers to assign.
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {availableEngineers.map(eng => (
                <div key={eng.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-semibold uppercase">{eng.name.charAt(0)}</div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{eng.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{eng.role}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      onAddEngineer(project.id, eng);
                    }}
                    className="text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-1.5 rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal isOpen={isMilestoneModalOpen} onClose={() => setMilestoneModalOpen(false)} title="Add Milestone">
        <form onSubmit={submitMilestone} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input 
              type="text" 
              value={mTitle}
              onChange={e => setMTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              placeholder="e.g. Foundation poured"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
            <input 
              type="date" 
              value={mDate}
              onChange={e => setMDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image (Optional)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  setMImage(e.target.files[0]);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setMilestoneModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={!mTitle || !mDate} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg disabled:opacity-50">
              Create Milestone
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isTaskModalOpen} onClose={() => setTaskModalOpen(false)} title="Assign Task">
        <form onSubmit={submitTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Title</label>
            <input 
              type="text" 
              value={tTitle}
              onChange={e => setTTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              placeholder="What needs to be done?"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To</label>
            <select 
              value={tEngineerId}
              onChange={e => setTEngineerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100"
              required
            >
              <option value="">Select an engineer...</option>
              {project.engineers.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setTaskModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={!tTitle || !tEngineerId} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg disabled:opacity-50">
              Assign Task
            </button>
          </div>
        </form>
      </Modal>

      <ProjectDocumentsModal
        project={project}
        isOpen={isViewDocsModalOpen}
        onClose={() => setViewDocsModalOpen(false)}
        onUpdateProject={onUpdateProject}
        onDeleteDoc={onDeleteDoc}
        readOnly={readOnly}
      />
    </div>
  );
}
