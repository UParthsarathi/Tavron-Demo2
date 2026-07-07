import React, { useState } from 'react';
import { UserPlus, Mail, Shield, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { profiles as profilesApi } from '@/lib/api';

export function AddEngineerView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Mechanical Engineer');
  const [customRole, setCustomRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    if (role === 'Custom' && !customRole) return;

    setIsSubmitting(true);
    setError(null);
    try {
      // Sends a real Supabase auth invitation via the invite-engineer edge
      // function; the invitee's profile is created (role ENGINEER) when they
      // accept the email link and set a password.
      await profilesApi.inviteEngineer({
        email,
        discipline: role === 'Custom' ? customRole : role,
      });
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
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
          <UserPlus className="w-6 h-6 text-brand-green" />
          Add Engineer
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Invite a new engineer to join the organization. An invitation link will be sent to their email address.
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
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Invitation Sent!</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              We've sent an email to <span className="font-semibold text-gray-700 dark:text-gray-300">{email}</span>. 
              Once they click the link, they'll be prompted to create their account and log in as an engineer.
            </p>
            <button
              onClick={() => {
                setIsSuccess(false);
                setEmail('');
                setRole('Mechanical Engineer');
                setCustomRole('');
              }}
              className="mt-8 px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Invite Another Engineer
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="engineer@company.com"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 dark:focus:ring-white/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role / Specialization
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={role === 'Custom' ? 'Custom' : role}
                    onChange={(e) => {
                      setRole(e.target.value);
                      if (e.target.value !== 'Custom') {
                        setCustomRole('');
                      }
                    }}
                    className="w-full appearance-none bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 dark:focus:ring-white/20 transition-all"
                  >
                    <option value="Mechanical Engineer">Mechanical Engineer</option>
                    <option value="Electrical Engineer">Electrical Engineer</option>
                    <option value="Instrumentation Engineer">Instrumentation Engineer</option>
                    <option value="Custom">Custom...</option>
                  </select>
                </div>
              </div>

              {role === 'Custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-2"
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Custom Role
                  </label>
                  <input
                    type="text"
                    required
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="e.g. Chemical Engineer"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900 dark:focus:ring-white/20 transition-all"
                  />
                </motion.div>
              )}

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 dark:border-gray-900/30 border-t-white dark:border-t-gray-900 rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-5 h-5" />
                  )}
                  Send Invitation
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
