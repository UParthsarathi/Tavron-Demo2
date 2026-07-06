import { Hexagon, Moon, Sun, LayoutDashboard, ListTodo, Zap, MessageSquare, ClipboardList } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { determineUserRole } from '@/types/roles';

export interface HeaderProps {
  currentView?: 'projects' | 'dashboard' | 'actions' | 'account' | 'messages' | 'add_engineer' | 'daily_log';
  onViewChange?: (view: 'projects' | 'dashboard' | 'actions' | 'account' | 'messages' | 'add_engineer' | 'daily_log') => void;
}

export function Header({ currentView = 'projects', onViewChange }: HeaderProps) {
  const { user } = useAuth();
  const userRole = determineUserRole(user?.email);
  const username = user?.email?.split('@')[0] || 'User';

  
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
            <button
              onClick={() => onViewChange('projects')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                currentView === 'projects' 
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <ListTodo className="w-4 h-4" />
              Projects
            </button>
            
            <button
                onClick={() => onViewChange('dashboard')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  currentView === 'dashboard' 
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
            
            {userRole === 'MANAGER' && (
              <button
                onClick={() => onViewChange('actions')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  currentView === 'actions' 
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Zap className="w-4 h-4" />
                Quick Actions
              </button>
            )}

            {userRole === 'ENGINEER' && (
              <button
                onClick={() => onViewChange('daily_log')}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  currentView === 'daily_log' 
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" 
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <ClipboardList className="w-4 h-4" />
                Daily Log
              </button>
            )}

            <button
              onClick={() => onViewChange('messages')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                currentView === 'messages' 
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <MessageSquare className="w-4 h-4" />
              Comm
            </button>
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
