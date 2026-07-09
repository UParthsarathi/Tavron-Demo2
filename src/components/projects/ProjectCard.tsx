import React from 'react';
import { cn } from '@/lib/utils';
import { Project } from '@/types';
import { formatTimeAgo } from '@/lib/utils';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';
import { downloadProjectSummary } from '@/lib/projectSummary';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "bg-white dark:bg-[#0f0f11] border md:min-h-[140px] border-gray-200/60 dark:border-gray-800/60 rounded-2xl p-6 cursor-pointer relative",
        "hover:shadow-lg hover:shadow-gray-100/50 dark:hover:shadow-none hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 flex flex-col justify-between"
      )}
    >
      <div className="flex justify-between items-start mb-6">
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 tracking-tight pr-4">{project.name}</h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              void downloadProjectSummary(project);
            }}
            className="p-1 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center"
            title="Download project report (status + full discussion)"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>
          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md border border-gray-200/50 dark:border-gray-700/50">
            {project.status === 'ON_HOLD' ? 'ON HOLD' : project.status}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-end text-sm text-gray-500 dark:text-gray-400">
        <span className="font-medium flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600"></div>
          {project.engineers.length} {project.engineers.length === 1 ? 'member' : 'members'}
        </span>
        <span className="font-mono text-xs">{formatTimeAgo(project.updatedAt)}</span>
      </div>
    </motion.div>
  );
}
