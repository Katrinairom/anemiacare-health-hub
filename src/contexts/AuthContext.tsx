import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, age: number, dob: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user for when Supabase is not configured
const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'demo@anemiacare.com',
  app_metadata: {},
  user_metadata: { name: 'Priya', age: 28 },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      // Demo mode - check localStorage for demo session
      const demoSession = localStorage.getItem('anemiacare_demo_session');
      if (demoSession) {
        setUser(DEMO_USER);
      }
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [configured]);

  const signUp = async (email: string, password: string, name: string, age: number, dob: string) => {
    if (!configured) {
      localStorage.setItem('anemiacare_demo_session', 'true');
      localStorage.setItem('anemiacare_demo_profile', JSON.stringify({ name, age, dob }));
      setUser({ ...DEMO_USER, user_metadata: { name, age, dob } } as User);
      return { error: null };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, age, dob },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error?.message || null };
  };

  const signIn = async (email: string, password: string) => {
    if (!configured) {
      localStorage.setItem('anemiacare_demo_session', 'true');
      setUser(DEMO_USER);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signOut = async () => {
    if (!configured) {
      localStorage.removeItem('anemiacare_demo_session');
      localStorage.removeItem('anemiacare_demo_profile');
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, isConfigured: configured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
