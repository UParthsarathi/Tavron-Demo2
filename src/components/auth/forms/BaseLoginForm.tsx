import React, { useState } from 'react';
import { Mail, Lock, Loader2, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface BaseLoginFormProps {
  role: 'manager' | 'engineer';
  defaultEmail?: string;
  subtitle?: React.ReactNode;
}

export function BaseLoginForm({ role, defaultEmail = '', subtitle }: BaseLoginFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInMock } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Mock login delay
    setTimeout(() => {
      if (email.trim()) {
        signInMock(email.trim());
      } else {
        setError('Please enter a valid email address.');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <form onSubmit={handleAuth} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl">
          {error}
        </div>
      )}
      
      {subtitle && (
        <div className="p-4 bg-blue-50/80 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 text-sm rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>{subtitle}</div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          Work Email
        </label>
        <div className="relative">
          <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 pl-11 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all outline-none"
            placeholder={role === 'manager' ? "manager@demo.com" : "engineer@demo.com"}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Password
          </label>
          <a href="#" className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
            Forgot password?
          </a>
        </div>
        <div className="relative">
          <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl py-2.5 pl-11 pr-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all outline-none"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all flex items-center justify-center mt-2 disabled:opacity-70 shadow-sm"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          `Sign in as ${role === 'manager' ? 'Manager' : 'Engineer'}`
        )}
      </button>
    </form>
  );
}
