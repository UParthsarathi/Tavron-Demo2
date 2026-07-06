import React from 'react';
import { motion } from 'motion/react';
import { Layers } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0a0a0a]">
      {/* Left side branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-50 dark:bg-[#111] border-r border-gray-200 dark:border-gray-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl flex items-center justify-center shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Tavron</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Streamline your engineering operations.
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
            A unified platform for managers to orchestrate and engineers to execute. Work together, ship faster.
          </p>
        </div>

        <div className="relative z-10 text-sm text-gray-400 dark:text-gray-600 font-medium">
          © {new Date().getFullYear()} Tavron Inc. All rights reserved.
        </div>
      </div>

      {/* Right side form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 z-0 lg:hidden pointer-events-none bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="lg:hidden flex items-center gap-3 mb-12 justify-center">
            <div className="w-10 h-10 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Tavron</span>
          </div>
          
          <div className="bg-white/80 dark:bg-[#0f0f11]/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-800/60 rounded-[2rem] p-8 shadow-2xl lg:shadow-none lg:bg-transparent lg:dark:bg-transparent lg:border-none lg:p-0">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
