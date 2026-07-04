import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { AccountView } from '@/components/account/AccountView';
import { MessagesView } from '@/components/messages/MessagesView';
import { ProjectList } from '@/components/projects/ProjectList';
import { ProjectDetails } from '@/components/projects/ProjectDetails';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/contexts/AuthContext';

export function EngineerLayout() {
  const { 
    projects, 
    addTaskComment
  } = useProjects();
  const { user } = useAuth();
  
  const [currentView, setCurrentView] = useState<'projects' | 'dashboard' | 'actions' | 'account' | 'messages' | 'add_engineer'>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const myEmail = (user?.email || '').toLowerCase().trim();

  // Filter projects where this engineer is assigned
  const assignedProjects = projects.filter(p => 
    p.engineers.some(e => e.email.toLowerCase().trim() === myEmail)
  );

  const selectedProject = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId) 
    : null;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] transition-colors duration-200 relative selection:bg-gray-200 dark:selection:bg-gray-800 flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        <Header currentView={currentView} onViewChange={(view) => {
          setCurrentView(view);
          if (view === 'account' || view === 'messages') {
            setSelectedProjectId(null);
          }
          if (view !== 'messages') {
            setSelectedChatId(null);
          }
        }} />
        
        <main className="w-full relative pb-20 sm:pb-8 flex-1">
        {currentView === 'messages' ? (
          <MessagesView 
            projects={assignedProjects} 
            initialChatId={selectedChatId} 
            onAddTaskComment={addTaskComment} 
          />
        ) : currentView === 'account' ? (
          <AccountView />
        ) : selectedProject ? (
          <ProjectDetails 
            project={selectedProject} 
            onBack={() => setSelectedProjectId(null)}
            onUpdateProject={() => {}}
            onDeleteProject={() => {}}
            onAddEngineer={() => {}}
            onRemoveEngineer={() => {}}
            onAddMilestone={() => {}}
            onUpdateMilestoneStatus={() => {}}
            onDeleteMilestone={() => {}}
            onAddDoc={() => {}}
            onDeleteDoc={() => {}}
            onAddTask={() => {}}
            onUpdateTaskStatus={() => {}}
            onDeleteTask={() => {}}
            onAddTaskComment={addTaskComment}
            onDiscussTask={(taskId) => {
              setSelectedChatId(`task-${taskId}`);
              setCurrentView('messages');
            }}
            readOnly={true}
          />
        ) : (
          <ProjectList 
            projects={assignedProjects}
            onSelectProject={(p) => setSelectedProjectId(p.id)}
            readOnly={true}
          />
        )}
        </main>
      </div>
      <MobileBottomNav currentView={currentView} onViewChange={(view) => {
        setCurrentView(view);
        if (view === 'account' || view === 'messages') {
          setSelectedProjectId(null);
        }
        if (view !== 'messages') {
            setSelectedChatId(null);
        }
      }} />
    </div>
  );
}
