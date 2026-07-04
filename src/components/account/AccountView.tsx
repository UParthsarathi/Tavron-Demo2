import { User, Settings, Shield, Bell, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';

export function AccountView() {
  const { user, signOut } = useAuth();
  
  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-8 py-4 sm:py-8 animate-in fade-in duration-500">
      <div className="mb-4 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Account & Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your profile, preferences, and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm flex flex-col items-center text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-brand-green to-emerald-400 flex items-center justify-center text-2xl sm:text-3xl font-bold text-brand-green-text border-4 border-white dark:border-gray-950 shadow-md mb-3 sm:mb-4">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {user?.email?.split('@')[0] || 'User'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">{user?.email}</p>
            
            <button className="w-full py-2 sm:py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-xl transition-colors">
              Edit Profile
            </button>
          </div>

          <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm">
            <button 
              onClick={signOut}
              className="w-full flex items-center gap-3 text-red-600 dark:text-red-400 font-medium py-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg px-3 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Settings List */}
        <div className="md:col-span-2 space-y-3 sm:space-y-4">
          <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 tracking-wide uppercase">Preferences</h4>
            
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-gray-950 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">General Settings</p>
                    <p className="text-xs text-gray-500">Language, timezone, and appearance</p>
                  </div>
                </div>
              </button>

              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-gray-950 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Notifications</p>
                    <p className="text-xs text-gray-500">Email, push, and in-app alerts</p>
                  </div>
                </div>
              </button>

              <button className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-gray-950 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Privacy & Security</p>
                    <p className="text-xs text-gray-500">Password, 2FA, and sessions</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
          
          {/* Recent Activity Mini */}
          <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-[#0f0f11] shadow-sm">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 tracking-wide uppercase">Account Summary</h4>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <p className="text-xs text-gray-500 mb-1">Member Since</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Oct 2023</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <p className="text-xs text-gray-500 mb-1">Role</p>
                <p className="text-sm font-medium text-brand-green-text">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
