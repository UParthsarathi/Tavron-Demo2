import React, { useState, useEffect } from 'react';
import { Hexagon, Moon, Sun, LayoutDashboard, ListTodo, Zap, MessageSquare, NotebookPen, SquareCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export type AppView =
  | 'projects'
  | 'dashboard'
  | 'actions'
  | 'account'
  | 'messages'
  | 'add_engineer'
  | 'delegate'
  | 'tasks'
  | 'logs';

export interface HeaderProps {
  currentView?: AppView;
  onViewChange?: (view: AppView) => void;
  /** Unread message count shown on the Comm tab. */
  messagesBadge?: number;
}

export function Header({ currentView = 'projects', onViewChange, messagesBadge = 0 }: HeaderProps) {
  const { profile, role } = useAuth();
  const username = profile?.name || profile?.email?.split('@')[0] || 'User';

  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const themeInLoc = 'theme' in localStorage;
        const mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
        return document.documentElement.classList.contains('dark') ||
          (!themeInLoc && mql ? mql.matches : false);
      } catch (e) {
        return false;
      }
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      try { localStorage.setItem('theme', 'dark'); } catch (e) {}
    } else {
      root.classList.remove('dark');
      try { localStorage.setItem('theme', 'light'); } catch (e) {}
    }
  }, [isDark]);

  const navButton = (view: AppView, label: string, icon: React.ReactNode, badge = 0) => (
    <button
      onClick={() => onViewChange?.(view)}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
        currentView === view
          ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      )}
    >
      {icon}
      {label}
      {badge > 0 && (
        <span className="min-w-[1.1rem] h-4 px-1 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );

  return (
    <header className="w-full flex items-center justify-between px-3 sm:px-8 py-2.5 sm:py-5 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm sticky top-0 z-50 transition-colors duration-200">
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2">
          <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-1.5 rounded-md transition-colors duration-200">
            <Hexagon className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-gray-900 dark:text-white mr-2 sm:mr-4">Tavron</h1>
        </div>

        {onViewChange && (
          <nav className="hidden sm:flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
            {navButton('projects', 'Projects', <ListTodo className="w-4 h-4" />)}
            {role === 'MANAGER' && navButton('dashboard', 'Dashboard', <LayoutDashboard className="w-4 h-4" />)}
            {role === 'MANAGER' && navButton('actions', 'Quick Actions', <Zap className="w-4 h-4" />)}
            {role === 'ENGINEER' && navButton('tasks', 'My Tasks', <SquareCheck className="w-4 h-4" />)}
            {navButton('logs', 'Daily Logs', <NotebookPen className="w-4 h-4" />)}
            {navButton('messages', 'Comm', <MessageSquare className="w-4 h-4" />, messagesBadge)}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <button
          onClick={() => setIsDark(!isDark)}
          className="text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          title="Toggle Dark Mode"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          onClick={() => onViewChange?.('account')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-green to-emerald-400 flex items-center justify-center text-[10px] font-bold text-brand-green-text border border-white dark:border-gray-900 shadow-sm uppercase">
            {username.charAt(0)}
          </div>
          <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300 font-medium">{username}</span>
        </button>
      </div>
    </header>
  );
}
