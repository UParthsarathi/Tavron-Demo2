import React, { useState, useRef } from 'react';
import { ArrowLeft, Plus, Users, Calendar, FileText, CircleCheck, Circle, SquareCheck, ListTodo, Trash2, Undo2, MessageCircle, Send, Image as ImageIcon, X } from 'lucide-react';
import { Engineer, MilestoneStatus, ProjectStatus, Project, TaskStatus } from '@/types';
import { formatTimeAgo, cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { CompleteProjectModal } from './CompleteProjectModal';
import { ProjectDocumentsModal } from './ProjectDocumentsModal';
import { motion } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import type { NewDocumentInput } from '@/hooks/useProjects';

interface ProjectDetailsProps {
  project: Project;
  allEngineers: Engineer[];
  onBack: () => void;
  onUpdateProjectStatus: (projectId: string, status: ProjectStatus) => void;
  onDeleteProject: () => void;
  onAddEngineer: (projectId: string, eng: Engineer) => void;
  onRemoveEngineer: (projectId: string, engId: string) => void;
  onAddMilestone: (projectId: string, data: { title: string; dueDate: string; imageFile?: File | null }) => void;
  onUpdateMilestoneStatus: (projectId: string, milestoneId: string, status: MilestoneStatus, proofImageFile?: File | null) => void;
  onDeleteMilestone: (projectId: string, milestoneId: string) => void;
  onAddDoc: (projectId: string, input: NewDocumentInput) => void;
  onDeleteDoc: (projectId: string, docId: string) => void;
  onAddTask: (projectId: string, data: { title: string; engineerId: string }) => void;
  onUpdateTaskStatus: (projectId: string | null, taskId: string, status: TaskStatus) => void;
  onDeleteTask: (projectId: string | null, taskId: string) => void;
  onDiscussTask?: (taskId: string) => void;
  onDiscussMilestone?: (milestoneId: string) => void;
  onOpenProjectChat?: (projectId: string) => void;
  readOnly?: boolean;
}

export function ProjectDetails({
  project,
  allEngineers,
  onBack,
  onUpdateProjectStatus,
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
  onDiscussTask,
  onDiscussMilestone,
  onOpenProjectChat,
  readOnly = false
}: ProjectDetailsProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'engineers' | 'tasks' | 'milestones'>('overview');

  // Modals state
  const [isEngModalOpen, setEngModalOpen] = useState(false);
  const [isMilestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [isViewDocsModalOpen, setViewDocsModalOpen] = useState(false);
  const [isCompleteModalOpen, setCompleteModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [completeMilestoneId, setCompleteMilestoneId] = useState<string | null>(null);
  const [completeMilestoneImage, setCompleteMilestoneImage] = useState<File | null>(null);

  // Real projects carry 35–40 milestones; the timeline collapses the
  // completed ones by default once there are enough to bury the open work.
  const [showCompleted, setShowCompleted] = useState<boolean | null>(null);
  const sortedMilestones = [...project.milestones].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  const completedCount = sortedMilestones.filter((m) => m.status === 'COMPLETED').length;
  const revealCompleted = showCompleted ?? completedCount <= 5;
  const timelineMilestones = revealCompleted
    ? sortedMilestones
    : sortedMilestones.filter((m) => m.status !== 'COMPLETED');

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
    onAddMilestone(project.id, {
      title: mTitle,
      dueDate: new Date(mDate).toISOString().slice(0, 10),
      imageFile: mImage,
    });
    setMTitle(''); setMDate(''); setMImage(null);
    setMilestoneModalOpen(false);
  };

  const submitCompleteMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeMilestoneId || !completeMilestoneImage) return;
    onUpdateMilestoneStatus(project.id, completeMilestoneId, 'COMPLETED', completeMilestoneImage);
    setCompleteMilestoneId(null);
    setCompleteMilestoneImage(null);
  };

  const submitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle || !tEngineerId) return;
    onAddTask(project.id, { title: tTitle, engineerId: tEngineerId });
    setTTitle(''); setTEngineerId('');
    setTaskModalOpen(false);
  };

  // Filter available engineers to not show ones already in project
  const availableEngineers = allEngineers.filter(me => !project.engineers.find(e => e.id === me.id));

  // Modal functions
  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-8 py-4 sm:py-8">
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">{project.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Last updated {formatTimeAgo(project.updatedAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {onOpenProjectChat && (
              <button
                onClick={() => onOpenProjectChat(project.id)}
                className="flex items-center gap-1.5 text-sm font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" /> Project Chat
              </button>
            )}
            <button
              onClick={() => setViewDocsModalOpen(true)}
              className="flex items-center gap-1.5 text-sm font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" /> Documents
            </button>
            {!readOnly && project.status === 'ACTIVE' ? (
              <button
                onClick={() => setCompleteModalOpen(true)}
                className="text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
              >
                Complete<span className="hidden sm:inline"> Project</span>
              </button>
            ) : !readOnly && project.status !== 'ACTIVE' ? (
               <button
                onClick={() => onUpdateProjectStatus(project.id, 'ACTIVE')}
                className="flex items-center gap-1.5 text-sm font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
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
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                title="Delete Project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <span className={cn(
              "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full",
              project.status === 'ACTIVE' ? "bg-brand-green text-brand-green-text" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            )}>
              {project.status}
            </span>
          </div>
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
        )}

        {activeTab === 'engineers' && (
          <div>
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">Assigned Engineers</h3>
              {!readOnly && (
                <button onClick={() => setEngModalOpen(true)} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
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
        )}

        {activeTab === 'tasks' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Engineer Tasks</h3>
              {!readOnly && (
                <button
                  onClick={() => setTaskModalOpen(true)}
                  disabled={project.engineers.length === 0}
                  className="flex items-center gap-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-4 h-4" /> Assign Task
                </button>
              )}
            </div>
            {(!project.tasks || project.tasks.length === 0) ? (
              <p className="text-gray-500 dark:text-gray-400 italic">
                {project.engineers.length === 0 ? "Add engineers to the project to start assigning tasks." : "No tasks assigned yet."}
              </p>
            ) : (
              <div className="space-y-4">
                {project.tasks.map(t => {
                  const assignee = project.engineers.find(e => e.id === t.engineerId);
                  // Engineers may change the status of their own tasks even in read-only mode.
                  const canUpdateStatus = !readOnly || t.engineerId === profile?.id;
                  return (
                    <div key={t.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="pt-0.5">
                            {t.status === 'DONE' ? (
                              <SquareCheck className="w-5 h-5 text-brand-green-text" />
                            ) : t.status === 'IN_PROGRESS' ? (
                              <ListTodo className="w-5 h-5 text-amber-500" />
                            ) : (
                              <ListTodo className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                            )}
                          </div>
                          <div>
                            <h4 className={cn("font-medium", t.status === 'DONE' ? "text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-white")}>
                              {t.title}
                            </h4>
                            <div className="flex items-center flex-wrap gap-2 mt-2">
                              {assignee ? (
                                <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                                  <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] font-bold uppercase">{assignee.name.charAt(0)}</div>
                                  {assignee.name}
                                </span>
                              ) : (
                                <span className="text-xs text-red-500 dark:text-red-400">Unassigned</span>
                              )}
                              <span className="text-xs text-gray-400 dark:text-gray-500">• Created {formatTimeAgo(t.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:pl-0 pl-9">
                          {onDiscussTask && (
                            <button
                              onClick={() => onDiscussTask(t.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Discuss
                            </button>
                          )}

                          <select
                            value={t.status}
                            onChange={(e) => onUpdateTaskStatus(project.id, t.id, e.target.value as TaskStatus)}
                            disabled={!canUpdateStatus}
                            className={cn("text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white", !canUpdateStatus ? "opacity-70 cursor-not-allowed" : "")}
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                          </select>
                          {!readOnly && (
                            <button
                              onClick={() => onDeleteTask(project.id, t.id)}
                              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'milestones' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Project Timeline</h3>
              {!readOnly && (
                <button onClick={() => setMilestoneModalOpen(true)} className="flex items-center gap-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm">
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
              <>
                {completedCount > 0 && (
                  <button
                    onClick={() => setShowCompleted(!revealCompleted)}
                    className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2 rounded-lg transition-colors"
                  >
                    <CircleCheck className="w-3.5 h-3.5 text-brand-green-text" />
                    {revealCompleted
                      ? `Hide ${completedCount} completed`
                      : `Show ${completedCount} completed milestones`}
                  </button>
                )}
                {timelineMilestones.length === 0 ? (
                  <div className="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      All {completedCount} milestones completed. 🎉
                    </p>
                  </div>
                ) : (
              <div className="relative pl-3 md:pl-0 py-4">
                {/* Vertical Timeline Line (desktop centered, mobile left) */}
                <div className="absolute left-[27px] md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800 transform md:-translate-x-1/2" />

                <div className="space-y-8 relative">
                  {timelineMilestones.map((m, idx) => {
                    const isEven = idx % 2 === 0;
                    // Check if it's past due (only comparing date parts to avoid time timezone bugs)
                    const dueDate = new Date(m.dueDate);
                    dueDate.setHours(0,0,0,0);
                    const today = new Date();
                    today.setHours(0,0,0,0);
                    const isPastDue = dueDate < today && m.status !== 'COMPLETED';

                    return (
                      <div key={m.id} className={cn("relative flex items-center justify-between md:justify-normal w-full", isEven ? "md:flex-row-reverse" : "md:flex-row")}>
                        {/* Timeline Node */}
                        <div className="absolute left-[27px] md:left-1/2 w-8 h-8 rounded-full bg-white dark:bg-gray-950 border-4 border-gray-100 dark:border-gray-900 flex items-center justify-center transform -translate-x-1/2 z-10 shadow-sm">
                          {m.status === 'COMPLETED' ? (
                            <CircleCheck className="w-5 h-5 text-brand-green-text bg-white dark:bg-gray-900 rounded-full" />
                          ) : (
                            <Circle className={cn("w-4 h-4", isPastDue ? "text-amber-500 fill-amber-50 dark:fill-amber-900/30" : "text-gray-300 dark:text-gray-700 fill-gray-50 dark:fill-gray-800")} />
                          )}
                        </div>

                        {/* Empty Space for alternate side on desktop */}
                        <div className="hidden md:block w-1/2" />

                        {/* Content Card */}
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
                                {onDiscussMilestone && (
                                  <button
                                    onClick={() => onDiscussMilestone(m.id)}
                                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    Discuss
                                  </button>
                                )}
                              </div>

                              {!readOnly && (
                                <>
                                  {m.status !== 'COMPLETED' ? (
                                    <button
                                      onClick={() => setCompleteMilestoneId(m.id)}
                                      className="text-xs font-semibold bg-white dark:bg-gray-900 hover:bg-brand-green dark:hover:bg-brand-green/20 hover:text-brand-green-text text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand-green-text px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow-sm group"
                                    >
                                      <span className="flex items-center gap-1.5"><CircleCheck className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" /> Complete</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => onUpdateMilestoneStatus(project.id, m.id, 'PENDING')}
                                      className="text-xs font-semibold bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow-sm group flex items-center gap-1.5"
                                    >
                                      <Undo2 className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" /> Undo
                                    </button>
                                  )}
                                  <button
                                    onClick={() => onDeleteMilestone(project.id, m.id)}
                                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                    title="Delete Milestone"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
                )}
              </>
            )}
          </div>
        )}
      </motion.div>

      <Modal isOpen={isEngModalOpen} onClose={() => setEngModalOpen(false)} title="Assign Engineer">
        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
          {availableEngineers.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">All available engineers are assigned to this project.</p>
          ) : (
            availableEngineers.map(e => (
              <button
                key={e.id}
                onClick={() => { onAddEngineer(project.id, e); setEngModalOpen(false); }}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-900 dark:hover:border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all text-left"
              >
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{e.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{e.role}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{e.email}</p>
                </div>
                <Plus className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </button>
            ))
          )}
        </div>
      </Modal>

      <Modal isOpen={isMilestoneModalOpen} onClose={() => setMilestoneModalOpen(false)} title="Add Milestone">
        <form onSubmit={submitMilestone} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Milestone Title</label>
            <input
              type="text"
              required
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              value={mTitle}
              onChange={e => setMTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
            <input
              type="date"
              required
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              value={mDate}
              onChange={e => setMDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Image Attachment (Optional)</label>
            <input
              type="file"
              accept="image/*"
              className="text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 dark:file:bg-gray-800 dark:file:text-gray-300 dark:hover:file:bg-gray-700 cursor-pointer"
              onChange={e => setMImage(e.target.files ? e.target.files[0] : null)}
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
              Add Milestone
            </button>
          </div>
        </form>
      </Modal>

      <ProjectDocumentsModal
        project={project}
        isOpen={isViewDocsModalOpen}
        onClose={() => setViewDocsModalOpen(false)}
        onAddDoc={onAddDoc}
        onDeleteDoc={onDeleteDoc}
        readOnly={readOnly}
      />

      <Modal isOpen={isTaskModalOpen} onClose={() => setTaskModalOpen(false)} title="Assign New Task">
        <form onSubmit={submitTask} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Task Description</label>
            <input
              type="text"
              required
              placeholder="e.g. Design the database schema"
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              value={tTitle}
              onChange={e => setTTitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Assign To</label>
            <select
              required
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              value={tEngineerId}
              onChange={e => setTEngineerId(e.target.value)}
            >
              <option value="" disabled>Select an engineer...</option>
              {project.engineers.map(e => (
                <option key={e.id} value={e.id}>{e.name} — {e.role}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
              Create Task
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!completeMilestoneId} onClose={() => { setCompleteMilestoneId(null); setCompleteMilestoneImage(null); }} title="Complete Milestone">
        <form onSubmit={submitCompleteMilestone} className="flex flex-col gap-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please attach proof of completion (e.g. screenshot, document image) to mark this milestone as complete.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Proof Image</label>
            <input
              type="file"
              required
              accept="image/*"
              className="text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 dark:file:bg-gray-800 dark:file:text-gray-300 dark:hover:file:bg-gray-700 cursor-pointer"
              onChange={e => setCompleteMilestoneImage(e.target.files ? e.target.files[0] : null)}
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => { setCompleteMilestoneId(null); setCompleteMilestoneImage(null); }} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!completeMilestoneImage} className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Complete Milestone
            </button>
          </div>
        </form>
      </Modal>

      <CompleteProjectModal
        project={project}
        isOpen={isCompleteModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        onConfirm={() => {
          onUpdateProjectStatus(project.id, 'COMPLETED');
          setCompleteModalOpen(false);
        }}
      />
    </div>
  );
}
