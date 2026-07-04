import { LayoutDashboard, ListTodo, Zap, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { determineUserRole } from '@/types/roles';

export interface MobileBottomNavProps {
  currentView?: 'projects' | 'dashboard' | 'actions' | 'account' | 'messages' | 'add_engineer';
  onViewChange?: (view: 'projects' | 'dashboard' | 'actions' | 'account' | 'messages' | 'add_engineer') => void;
}

export function MobileBottomNav({ currentView = 'projects', onViewChange }: MobileBottomNavProps) {
  const { user } = useAuth();
  const userRole = determineUserRole(user?.email);

  if (!onViewChange) return null;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md pb-safe z-50">
      <nav className="flex items-center justify-around px-2 pb-4 pt-2">
        <button
          onClick={() => onViewChange('projects')}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 min-w-[4rem] transition-colors",
            currentView === 'projects' 
              ? "text-gray-900 dark:text-white" 
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          <div className={cn(
            "p-1 rounded-full transition-colors",
            currentView === 'projects' ? "bg-gray-100 dark:bg-gray-800" : "bg-transparent"
          )}>
            <ListTodo className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium">Projects</span>
        </button>

        {userRole === 'MANAGER' && (
          <button
            onClick={() => onViewChange('dashboard')}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-[4rem] transition-colors",
              currentView === 'dashboard' 
                ? "text-gray-900 dark:text-white" 
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <div className={cn(
              "p-1 rounded-full transition-colors",
              currentView === 'dashboard' ? "bg-gray-100 dark:bg-gray-800" : "bg-transparent"
            )}>
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium">Dashboard</span>
          </button>
        )}

        <button
          onClick={() => onViewChange('messages')}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 min-w-[4rem] transition-colors",
            currentView === 'messages' 
              ? "text-gray-900 dark:text-white" 
              : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
          )}
        >
          <div className={cn(
            "p-1 rounded-full transition-colors",
            currentView === 'messages' ? "bg-gray-100 dark:bg-gray-800" : "bg-transparent"
          )}>
            <MessageSquare className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-medium">Comm</span>
        </button>

        {userRole === 'MANAGER' && (
          <button
            onClick={() => onViewChange('actions')}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-[4rem] transition-colors",
              currentView === 'actions' 
                ? "text-gray-900 dark:text-white" 
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <div className={cn(
              "p-1 rounded-full transition-colors",
              currentView === 'actions' ? "bg-gray-100 dark:bg-gray-800" : "bg-transparent"
            )}>
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-medium">Actions</span>
          </button>
        )}
      </nav>
    </div>
  );
}
