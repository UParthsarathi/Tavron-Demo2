import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Project } from '@/types';
import { AlertCircle } from 'lucide-react';

interface CompleteProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function CompleteProjectModal({ project, isOpen, onClose, onConfirm }: CompleteProjectModalProps) {
  const pendingMilestones = project.milestones.filter(m => m.status !== 'COMPLETED').length;
  const pendingTasks = project.tasks ? project.tasks.filter(t => t.status !== 'DONE').length : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Project">
      <div className="flex flex-col gap-6">
        <div className="text-gray-700 dark:text-gray-300">
          <p>Are you sure you want to mark this project as completed?</p>
          
          {(pendingMilestones > 0 || pendingTasks > 0) && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg flex gap-3 text-amber-800 dark:text-amber-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Pending items remaining:</p>
                <ul className="list-disc list-inside space-y-1">
                  {pendingMilestones > 0 && <li>{pendingMilestones} milestone(s)</li>}
                  {pendingTasks > 0 && <li>{pendingTasks} task(s)</li>}
                </ul>
                <p className="mt-2">Completing the project will leave these permanently open.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    </Modal>
  );
}
