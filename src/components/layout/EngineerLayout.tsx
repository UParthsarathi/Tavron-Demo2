import React, { useState } from 'react';
import { Header, type AppView } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { AccountView } from '@/components/account/AccountView';
import { MessagesView, type ChatTarget } from '@/components/messages/MessagesView';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectDetails } from '@/components/projects/ProjectDetails';
import { TasksView } from '@/components/tasks/TasksView';
import { DailyLogsView } from '@/components/logs/DailyLogsView';
import { useProjects } from '@/hooks/useProjects';
import { useConversations } from '@/hooks/useConversations';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export function EngineerLayout() {
  const {
    projects, // RLS already scopes these to the signed-in engineer's projects
    engineers,
    standaloneTasks, // likewise: only tasks assigned to this engineer
    logs,
    loading,
    notice,
    updateTaskStatus,
    addDailyLog,
    updateDailyLog,
    deleteDailyLog,
  } = useProjects();

  const chat = useConversations();

  const [currentView, setCurrentView] = useState<AppView>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);

  const selectedProject = selectedProjectId
    ? projects.find(p => p.id === selectedProjectId)
    : null;

  const changeView = (view: AppView) => {
    setCurrentView(view);
    if (view !== 'projects') {
      setSelectedProjectId(null);
    }
    if (view !== 'messages') {
      setChatTarget(null);
    }
  };

  const openChat = (target: ChatTarget) => {
    setChatTarget(target);
    setCurrentView('messages');
  };

  const noop = () => {};

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] transition-colors duration-200 relative selection:bg-gray-200 dark:selection:bg-gray-800 flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>

      <div className="relative z-10 flex-1 flex flex-col">
        <Header currentView={currentView} onViewChange={changeView} messagesBadge={chat.unreadTotal} />

        <main className="w-full relative pb-20 sm:pb-8 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : currentView === 'messages' ? (
          <MessagesView chat={chat} initialTarget={chatTarget} />
        ) : currentView === 'account' ? (
          <AccountView />
        ) : currentView === 'tasks' ? (
          <TasksView
            projects={projects}
            standaloneTasks={standaloneTasks}
            engineers={engineers}
            onAddTask={noop}
            onUpdateTaskStatus={updateTaskStatus}
            onDeleteTask={noop}
            onDiscussTask={(taskId) => openChat({ kind: 'task', id: taskId })}
          />
        ) : currentView === 'logs' ? (
          <DailyLogsView
            logs={logs}
            projects={projects}
            onAddLog={addDailyLog}
            onUpdateLog={updateDailyLog}
            onDeleteLog={deleteDailyLog}
          />
        ) : selectedProject ? (
          <ProjectDetails
            project={selectedProject}
            allEngineers={engineers}
            onBack={() => setSelectedProjectId(null)}
            onUpdateProjectStatus={noop}
            onDeleteProject={noop}
            onAddEngineer={noop}
            onRemoveEngineer={noop}
            onAddMilestone={noop}
            onUpdateMilestoneStatus={noop}
            onDeleteMilestone={noop}
            onAddDoc={noop}
            onDeleteDoc={noop}
            onAddTask={noop}
            onUpdateTaskStatus={updateTaskStatus}
            onDeleteTask={noop}
            onDiscussTask={(taskId) => openChat({ kind: 'task', id: taskId })}
            onDiscussMilestone={(milestoneId) => openChat({ kind: 'milestone', id: milestoneId })}
            onOpenProjectChat={(projectId) => openChat({ kind: 'project', id: projectId })}
            readOnly={true}
          />
        ) : (
          <ProjectList
            projects={projects}
            onSelectProject={(p) => setSelectedProjectId(p.id)}
            readOnly={true}
          />
        )}
        </main>
      </div>
      <MobileBottomNav currentView={currentView} onViewChange={changeView} messagesBadge={chat.unreadTotal} />

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
  );
}
