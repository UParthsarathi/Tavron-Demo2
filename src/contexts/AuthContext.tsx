// DEMO BRANCH: no Supabase auth. The provider offers a persona picker
// (manager / engineer viewpoint) instead of a login, then exposes the same
// context shape the real AuthContext has, so every consumer — layouts,
// hooks, views — runs unmodified. "Sign out" returns to the picker.

import React, { createContext, useContext, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { Hexagon, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { DEMO_PERSONAS, getCurrentDemoUser, setCurrentDemoUser } from '@/lib/demo/data';
import type { Profile, UserRole } from '@/types';

const STORAGE_KEY = 'tavron-demo-persona';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
  signOut: async () => {},
});

function restorePersona(): Profile | null {
  try {
    const id = sessionStorage.getItem(STORAGE_KEY);
    if (!id) return null;
    setCurrentDemoUser(id);
    return getCurrentDemoUser();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(restorePersona);

  const pick = (profileId: string) => {
    setCurrentDemoUser(profileId);
    try { sessionStorage.setItem(STORAGE_KEY, profileId); } catch { /* private mode */ }
    setProfile(getCurrentDemoUser());
  };

  const signOut = async () => {
    setCurrentDemoUser(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* private mode */ }
    setProfile(null);
  };

  if (!profile) {
    return <PersonaPicker onPick={pick} />;
  }

  // The rest of the app only ever checks these for truthiness / ids.
  const fakeSession = { user: { id: profile.id, email: profile.email } } as unknown as Session;
  const fakeUser = fakeSession.user;

  return (
    <AuthContext.Provider value={{ session: fakeSession, user: fakeUser, profile, role: profile.role, signOut }}>
      {children}
      <button
        onClick={() => void signOut()}
        title="Switch demo viewpoint"
        className="fixed bottom-20 sm:bottom-4 left-4 z-40 flex items-center gap-2 pl-2.5 pr-3 py-1.5 rounded-full bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 text-xs font-medium shadow-lg backdrop-blur hover:opacity-90 transition-opacity"
      >
        <RefreshCw className="w-3 h-3" />
        Demo · {profile.name.split(' ')[0]}
      </button>
    </AuthContext.Provider>
  );
}

function PersonaPicker({ onPick }: { onPick: (profileId: string) => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a] p-4 relative">
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(#e5e5e5_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-[#0f0f11] border border-gray-200/60 dark:border-gray-800/60 rounded-3xl p-8 shadow-xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Hexagon className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Tavron — Demo</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Explore the app from either side of the team. Sample data only — everything resets on refresh.
          </p>
        </div>

        <div className="space-y-3">
          {DEMO_PERSONAS.map((persona) => (
            <button
              key={persona.profileId}
              onClick={() => onPick(persona.profileId)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-white dark:hover:bg-gray-900 transition-colors text-left group"
            >
              <div className="w-11 h-11 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-sm font-bold shrink-0">
                {persona.headline.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{persona.headline}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{persona.caption}</p>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          Frontend-only demo · no accounts, no backend
        </p>
      </motion.div>
    </div>
  );
}

export const useAuth = () => useContext(AuthContext);
