import React from 'react';
import { Folder, Square, PlayCircle, CheckSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
    </motion.div>
  );
}

interface EngineerStatCardsProps {
  activeProjectsCount: number;
  todoTasksCount: number;
  inProgressTasksCount: number;
  completedTasksCount: number;
}

export function EngineerStatCards({
  activeProjectsCount,
  todoTasksCount,
  inProgressTasksCount,
  completedTasksCount
}: EngineerStatCardsProps) {
  const stats = [
    { label: 'Active Projects', value: activeProjectsCount, icon: <Folder className="w-4 h-4" /> },
    { label: 'To Do Tasks', value: todoTasksCount, icon: <Square className="w-4 h-4" /> },
    { label: 'In Progress Tasks', value: inProgressTasksCount, icon: <PlayCircle className="w-4 h-4" /> },
    { label: 'Completed Tasks', value: completedTasksCount, icon: <CheckSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, idx) => (
        <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} delay={idx * 0.1} />
      ))}
    </div>
  );
}
