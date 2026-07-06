import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';

// We'll mock the Supabase Auth entirely for now to allow local testing
interface AuthContextType {
  session: Session | null;
  user: User | null;
  signInMock: (email: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  signInMock: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a mocked user in local storage
    const storedUser = localStorage.getItem('mock_user_email');
    if (storedUser) {
      const mockUser = {
        id: 'mock-id',
        email: storedUser,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as User;
      setUser(mockUser);
      setSession({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockUser
      });
    }
    setLoading(false);
  }, []);

  const signInMock = (email: string) => {
    localStorage.setItem('mock_user_email', email);
    const mockUser = {
      id: 'mock-id',
      email,
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString()
    } as User;
    setUser(mockUser);
    setSession({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: mockUser
    });
  };

  const signOut = async () => {
    localStorage.removeItem('mock_user_email');
    setUser(null);
    setSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="w-8 h-8 border-4 border-gray-900 dark:border-gray-100 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, signInMock, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
