import React, { useState } from 'react';
import { GeoPhotoCapture } from '../components/GeoPhotoCapture';
import { Project } from '@/types';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface DailyLogFormProps {
  projects: Project[];
  onSubmit: (logData: any) => Promise<void>;
}

export function DailyLogForm({ projects, onSubmit }: DailyLogFormProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [tasksCompleted, setTasksCompleted] = useState('');
  const [blockers, setBlockers] = useState('');
  const [photoData, setPhotoData] = useState<{ file: File; location: { lat: number; lng: number } | null } | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !photoData?.file) return;

    setIsSubmitting(true);
    
    // Create log data
    const logData = {
      projectId: selectedProjectId,
      tasksCompleted,
      blockers,
      photo: photoData.file,
      location: photoData.location,
      timestamp: new Date().toISOString()
    };

    try {
      await onSubmit(logData);
      setIsSuccess(true);
      // Reset form after a delay
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedProjectId('');
        setTasksCompleted('');
        setBlockers('');
        setPhotoData(null);
      }, 3000);
    } catch (error) {
      console.error("Failed to submit log", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#111] border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm"
      >
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Log Submitted Successfully</h3>
        <p className="text-gray-500 dark:text-gray-400">Your daily update and site photo have been recorded.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
      
      {/* Photo Capture Section */}
      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Site Photo</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Please provide a geo-tagged photo of your work site or progress.</p>
        </div>
        <GeoPhotoCapture 
          onCapture={(file, location) => {
            if (file.name === "reset") {
              setPhotoData(null);
            } else {
              setPhotoData({ file, location });
            }
          }} 
        />
      </section>

      <hr className="border-gray-100 dark:border-gray-800" />

      {/* Details Section */}
      <section className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Project <span className="text-red-500">*</span>
          </label>
          <select
            required
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none transition-all appearance-none"
          >
            <option value="" disabled>Select a project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Work Completed Today <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={tasksCompleted}
            onChange={(e) => setTasksCompleted(e.target.value)}
            rows={4}
            className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none transition-all resize-none"
            placeholder="Describe the tasks you finished, progress made, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Blockers or Issues (Optional)
          </label>
          <textarea
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            rows={3}
            className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl py-3 px-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent outline-none transition-all resize-none"
            placeholder="Any materials missing, weather delays, or safety concerns?"
          />
        </div>
      </section>

      {/* Submit Button */}
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !selectedProjectId || !photoData?.file}
          className="w-full sm:w-auto px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Daily Log'
          )}
        </button>
      </div>
    </form>
  );
}
