import React, { useState } from 'react';
import { Header, type AppView } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectDetails } from '@/components/projects/ProjectDetails';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { QuickActionsView } from '@/components/actions/QuickActionsView';
import { AddEngineerView } from '@/components/actions/AddEngineerView';
import { AccountView } from '@/components/account/AccountView';
import { MessagesView } from '@/components/messages/MessagesView';
import { TasksView } from '@/components/tasks/TasksView';
import { DailyLogsView } from '@/components/logs/DailyLogsView';
import { useProjects } from '@/hooks/useProjects';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export function ManagerLayout() {
  const {
    projects,
    engineers,
    standaloneTasks,
    logs,
    loading,
    notice,
    addProject,
    updateProjectStatus,
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
    addTaskComment,
    addDailyLog,
    updateDailyLog,
    deleteDailyLog,
  } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('projects');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const selectedProject = selectedProjectId
    ? projects.find(p => p.id === selectedProjectId)
    : null;

  const changeView = (view: AppView) => {
    setCurrentView(view);
    if (view !== 'projects') {
      setSelectedProjectId(null);
    }
    if (view !== 'messages') {
      setSelectedChatId(null);
    }
  };

  const discussTask = (taskId: string) => {
    setSelectedChatId(`task-${taskId}`);
    setCurrentView('messages');
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] transition-colors duration-200 relative selection:bg-gray-200 dark:selection:bg-gray-800 flex flex-col">
      {/* Subtle Dot Pattern Background */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>

      <div className="relative z-10 flex-1 flex flex-col">
        <Header currentView={currentView} onViewChange={changeView} />

        <main className="w-full relative pb-20 sm:pb-8 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : currentView === 'messages' ? (
          <MessagesView
            projects={projects}
            standaloneTasks={standaloneTasks}
            initialChatId={selectedChatId}
            onAddTaskComment={addTaskComment}
          />
        ) : currentView === 'add_engineer' ? (
          <AddEngineerView onBack={() => setCurrentView('actions')} />
        ) : currentView === 'account' ? (
          <AccountView />
        ) : currentView === 'delegate' ? (
          <TasksView
            projects={projects}
            standaloneTasks={standaloneTasks}
            engineers={engineers}
            onAddTask={addTask}
            onUpdateTaskStatus={updateTaskStatus}
            onDeleteTask={deleteTask}
            onDiscussTask={discussTask}
          />
        ) : currentView === 'logs' ? (
          <DailyLogsView
            logs={logs}
            projects={projects}
            onAddLog={addDailyLog}
            onUpdateLog={updateDailyLog}
            onDeleteLog={deleteDailyLog}
          />
        ) : currentView === 'actions' ? (
          <QuickActionsView onActionClick={(action) => {
            if (action === 'Task Discussions') {
              setCurrentView('messages');
              setSelectedChatId(null);
            } else if (action === 'Delegate Work') {
              setCurrentView('delegate');
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
            allEngineers={engineers}
            onBack={() => setSelectedProjectId(null)}
            onUpdateProjectStatus={updateProjectStatus}
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
            onDiscussTask={discussTask}
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
        onSubmit={async (name) => {
          const newId = await addProject(name);
          if (newId) {
            setCurrentView('projects');
            setSelectedProjectId(newId);
          }
        }}
      />

      <MobileBottomNav currentView={currentView} onViewChange={changeView} />

      <AnimatePresence>
        {notice && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={cn(
              "fixed bottom-6 right-6 text-white px-4 py-3 rounded-xl shadow-xl z-50",
              notice.type === 'error' ? "bg-red-600" : "bg-gray-900"
            )}
          >
            <span className="text-sm font-medium">{notice.label}</span>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
