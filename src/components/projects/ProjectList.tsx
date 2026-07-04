import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Project } from '@/types';
import { ProjectCard } from './ProjectCard';
import { motion } from 'motion/react';
import { SearchBar } from '@/components/ui/SearchBar';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onNewProject?: () => void;
  readOnly?: boolean;
}

export function ProjectList({ projects, onSelectProject, onNewProject, readOnly = false }: ProjectListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(project => {
    const s = searchQuery.toLowerCase();
    return project.name && project.name.toLowerCase().includes(s);
  }).sort((a, b) => {
    if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
    if (a.status !== 'COMPLETED' && b.status === 'COMPLETED') return -1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-4 sm:py-6 md:py-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6 md:mb-8">
        <h2 className="text-lg sm:text-xl font-medium text-gray-800 dark:text-gray-200">All Projects</h2>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder="Search projects..." 
            className="w-full sm:w-64"
          />
          {!readOnly && onNewProject && (
            <button 
              onClick={onNewProject}
              className="flex w-full sm:w-auto items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          )}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400">No projects found matching "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredProjects.map((project, idx) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <ProjectCard 
                project={project} 
                onClick={() => onSelectProject(project)} 
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
