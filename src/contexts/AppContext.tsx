import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AppContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshProjects: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data && !error) {
      setProfile(data);
    }
  };

  // Fetch user's projects
  const fetchProjects = async (userId: string) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (data && !error) {
      const formattedProjects: Project[] = data.map((p) => ({
        id: p.id,
        name: p.name,
        domain: p.domain || '',
        createdAt: new Date(p.created_at),
        keywords: 0,
        briefs: 0,
        ga_connected: p.ga_connected,
        ga_property_id: p.ga_property_id,
      }));
      setProjects(formattedProjects);
      if (formattedProjects.length > 0 && !currentProject) {
        setCurrentProject(formattedProjects[0]);
      }
    }
  };

  const refreshProjects = async () => {
    if (user) {
      await fetchProjects(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);

        // Defer data fetching to avoid deadlocks
        if (currentSession?.user) {
          setTimeout(() => {
            fetchProfile(currentSession.user.id);
            fetchProjects(currentSession.user.id);
          }, 0);
        } else {
          setProfile(null);
          setProjects([]);
          setCurrentProject(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
        fetchProjects(currentSession.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // const signUp = async (email: string, password: string, fullName?: string) => {
  //   const redirectUrl = `${window.location.origin}/`;

  //   const { error } = await supabase.auth.signUp({
  //     email,
  //     password,
  //     options: {
  //       emailRedirectTo: redirectUrl,
  //       data: {
  //         full_name: fullName || email.split('@')[0],
  //       },
  //     },
  //   });
  //   return { error };
  // };

  const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: {
        full_name: fullName,
      }
    }
  });
  
  return { data, error };
};


  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setProjects([]);
      setCurrentProject(null);
    }
    return { error };
  };

  const isAuthenticated = !!session;

  return (
    <AppContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        currentProject,
        setCurrentProject,
        projects,
        setProjects,
        isAuthenticated,
        signUp,
        signIn,
        signOut,
        refreshProjects,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
