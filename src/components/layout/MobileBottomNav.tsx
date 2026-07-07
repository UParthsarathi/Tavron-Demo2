import React from 'react';
import { LayoutDashboard, ListTodo, Zap, MessageSquare, NotebookPen, SquareCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { AppView } from './Header';

export interface MobileBottomNavProps {
  currentView?: AppView;
  onViewChange?: (view: AppView) => void;
}

export function MobileBottomNav({ currentView = 'projects', onViewChange }: MobileBottomNavProps) {
  const { role } = useAuth();

  if (!onViewChange) return null;

  const navButton = (view: AppView, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => onViewChange(view)}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 min-w-[3.5rem] transition-colors",
        currentView === view
          ? "text-gray-900 dark:text-white"
          : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
      )}
    >
      <div className={cn(
        "p-1 rounded-full transition-colors",
        currentView === view ? "bg-gray-100 dark:bg-gray-800" : "bg-transparent"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md pb-safe z-50">
      <nav className="flex items-center justify-around px-2 pb-4 pt-2">
        {navButton('projects', 'Projects', <ListTodo className="w-4 h-4" />)}
        {role === 'MANAGER' && navButton('dashboard', 'Dashboard', <LayoutDashboard className="w-4 h-4" />)}
        {role === 'ENGINEER' && navButton('tasks', 'Tasks', <SquareCheck className="w-4 h-4" />)}
        {navButton('logs', 'Logs', <NotebookPen className="w-4 h-4" />)}
        {navButton('messages', 'Comm', <MessageSquare className="w-4 h-4" />)}
        {role === 'MANAGER' && navButton('actions', 'Actions', <Zap className="w-4 h-4" />)}
      </nav>
    </div>
  );
}
