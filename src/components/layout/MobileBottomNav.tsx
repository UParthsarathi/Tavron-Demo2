import React from 'react';
import { LayoutDashboard, ListTodo, Zap, MessageSquare, NotebookPen, SquareCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import type { AppView } from './Header';

export interface MobileBottomNavProps {
  currentView?: AppView;
  onViewChange?: (view: AppView) => void;
  /** Unread message count shown on the Comm tab. */
  messagesBadge?: number;
}

export function MobileBottomNav({ currentView = 'projects', onViewChange, messagesBadge = 0 }: MobileBottomNavProps) {
  const { role } = useAuth();

  if (!onViewChange) return null;

  const navButton = (view: AppView, label: string, icon: React.ReactNode, badge = 0) => (
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
        "relative p-1 rounded-full transition-colors",
        currentView === view ? "bg-gray-100 dark:bg-gray-800" : "bg-transparent"
      )}>
        {icon}
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[1rem] h-4 px-1 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[9px] font-bold flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
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
        {navButton('messages', 'Comm', <MessageSquare className="w-4 h-4" />, messagesBadge)}
        {role === 'MANAGER' && navButton('actions', 'Actions', <Zap className="w-4 h-4" />)}
      </nav>
    </div>
  );
}
