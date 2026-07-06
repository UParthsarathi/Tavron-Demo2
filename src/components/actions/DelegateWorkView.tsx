import React, { useState, useEffect } from 'react';
import { Briefcase, ArrowLeft, CheckCircle2, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { generateId } from '@/lib/utils';
import { determineUserRole } from '@/types/roles';

export function DelegateWorkView({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const userRole = determineUserRole(user?.email);
  const myName = user?.email?.split('@')[0] || 'Me';

  const [engineers, setEngineers] = useState<any[]>([]);
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/engineers')
      .then(res => res.json())
      .then(data => {
        setEngineers(data);
        if (data.length > 0) {
          setSelectedEngineer(data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEngineer || !taskTitle) return;
        
    setIsSubmitting(true);
    try {
      const chatId = `eng-${selectedEngineer}`;
      
      const content = `**New Delegated Task: ${taskTitle}**\n\n${taskDescription}`;

      const response = await fetch(`/api/messages/${chatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: generateId(),
          sender_email: user?.email || '',
          sender_name: myName,
          sender_role: userRole,
          content,
          created_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delegate work');
      }

      setIsSuccess(true);
            
      // Reset after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setTaskTitle('');
        setTaskDescription('');
      }, 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to delegate work. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 md:py-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Actions
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-brand-green" />
          Delegate Work
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Assign an independent task to an engineer via direct message.
        </p>
      </div>

      <div className="bg-white dark:bg-[#0f0f11] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 sm:p-12 text-center"
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Work Delegated!</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              The task has been sent to the selected engineer via direct message.
            </p>
            <button 
              onClick={() => setIsSuccess(false)}
              className="mt-8 px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Delegate Another Task
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Engineer
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={selectedEngineer}
                    onChange={(e) => setSelectedEngineer(e.target.value)}
                    className="w-full appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 dark:focus:ring-white/20 transition-all"
                  >
                    {engineers.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Review Q3 Reports"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 dark:focus:ring-white/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Description (Optional)
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Provide context and requirements..."
                  rows={4}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 dark:focus:ring-white/20 transition-all resize-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedEngineer || !taskTitle}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 dark:border-gray-900/30 border-t-white dark:border-t-gray-900 rounded-full animate-spin" />
                  ) : (
                    <Briefcase className="w-5 h-5" />
                  )}
                  Delegate Task
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
