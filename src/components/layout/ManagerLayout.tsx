import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectDetails } from '@/components/projects/ProjectDetails';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { QuickActionsView } from '@/components/actions/QuickActionsView';
import { AddEngineerView } from '@/components/actions/AddEngineerView';
import { AccountView } from '@/components/account/AccountView';
import { MessagesView } from '@/components/messages/MessagesView';
import { useProjects } from '@/hooks/useProjects';
import { Undo2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ManagerLayout() {
  const { 
    projects, 
    lastAction,
    undo,
    addProject, 
    updateProject,
    deleteProject,
    addEngineerToProject, 
    removeEngineerFromProject,
    addMilestone, 
    addDocument,
    deleteDocument,
    updateMilestoneStatus,
    deleteMilestone,
    addTask,
    updateTaskStatus,
    deleteTask,
    addTaskComment
  } = useProjects();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'projects' | 'dashboard' | 'actions' | 'account' | 'messages' | 'add_engineer'>('projects');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const selectedProject = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId) 
    : null;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] transition-colors duration-200 relative selection:bg-gray-200 dark:selection:bg-gray-800 flex flex-col">
      {/* Subtle Dot Pattern Background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        <Header currentView={currentView as any} onViewChange={(view) => {
          setCurrentView(view as any);
          if (view === 'dashboard' || view === 'actions' || view === 'account' || view === 'messages') {
            setSelectedProjectId(null);
          }
          if (view !== 'messages') {
            setSelectedChatId(null);
          }
        }} />
        
        <main className="w-full relative pb-20 sm:pb-8 flex-1">
        {currentView === 'messages' ? (
          <MessagesView 
            projects={projects} 
            initialChatId={selectedChatId} 
            onAddTaskComment={addTaskComment} 
          />
        ) : currentView === 'add_engineer' ? (
          <AddEngineerView onBack={() => setCurrentView('actions')} />
        ) : currentView === 'account' ? (
          <AccountView />
        ) : currentView === 'actions' ? (
          <QuickActionsView onActionClick={(action) => {
            if (action === 'Direct Messages' || action === 'Delegate Work') {
              setCurrentView('messages');
              setSelectedChatId(null);
            } else if (action === 'Add Engineer') {
              setCurrentView('add_engineer');
            }
          }} />
        ) : currentView === 'dashboard' ? (
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
            <DashboardOverview projects={projects} />
          </div>
        ) : selectedProject ? (
          <ProjectDetails 
            project={selectedProject} 
            onBack={() => setSelectedProjectId(null)}
            onUpdateProject={updateProject}
            onDeleteProject={() => {
              deleteProject(selectedProject.id);
              setSelectedProjectId(null);
            }}
            onAddEngineer={addEngineerToProject}
            onRemoveEngineer={removeEngineerFromProject}
            onAddMilestone={addMilestone}
            onUpdateMilestoneStatus={updateMilestoneStatus}
            onDeleteMilestone={deleteMilestone}
            onAddDoc={addDocument}
            onDeleteDoc={deleteDocument}
            onAddTask={addTask}
            onUpdateTaskStatus={updateTaskStatus}
            onDeleteTask={deleteTask}
            onAddTaskComment={addTaskComment}
            onDiscussTask={(taskId) => {
              setSelectedChatId(`task-${taskId}`);
              setCurrentView('messages');
            }}
          />
        ) : (
          <ProjectList 
            projects={projects}
            onSelectProject={(p) => setSelectedProjectId(p.id)}
            onNewProject={() => setIsCreateModalOpen(true)}
          />
        )}
      </main>

      <CreateProjectModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(newProject) => {
          addProject(newProject);
          setCurrentView('projects');
          setSelectedProjectId(newProject.id); // optionally go straight to the new project
        }}
      />

      <MobileBottomNav currentView={currentView as any} onViewChange={(view) => {
        setCurrentView(view as any);
        if (view === 'dashboard' || view === 'actions' || view === 'account' || view === 'messages') {
          setSelectedProjectId(null);
        }
        if (view !== 'messages') {
            setSelectedChatId(null);
        }
      }} />

      <AnimatePresence>
        {lastAction && (
          <motion.div 
            key="toast"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-4 z-50"
          >
            <span className="text-sm font-medium">{lastAction.label}</span>
            <div className="w-px h-4 bg-gray-700" />
            <button 
              onClick={undo}
              className="flex items-center gap-1.5 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
