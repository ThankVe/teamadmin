import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  canManageEvents: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);

  // Can manage events if admin or editor
  const canManageEvents = isAdmin || isEditor;

  const checkRoleStatus = async () => {
    try {
      const { data: adminData } = await supabase.rpc('is_admin');
      const isAdminUser = adminData === true;
      
      // Check if user has editor role
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return { isAdmin: false, isEditor: false };
      
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.user.id)
        .maybeSingle();
      
      const isEditorUser = roleData?.role === 'editor';
      
      return { isAdmin: isAdminUser, isEditor: isEditorUser };
    } catch (err) {
      console.error('Error in checkRoleStatus:', err);
      return { isAdmin: false, isEditor: false };
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, avatar_url')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    let roleChannel: ReturnType<typeof supabase.channel> | null = null;

    // Set up auth state change listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Defer profile and role check to avoid blocking
        setTimeout(async () => {
          const [profileData, roleStatus] = await Promise.all([
            fetchProfile(session.user.id),
            checkRoleStatus()
          ]);
          setProfile(profileData);
          setIsAdmin(roleStatus.isAdmin);
          setIsEditor(roleStatus.isEditor);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsEditor(false);
      }
      
      setIsLoading(false);
    });

    // THEN get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const [profileData, roleStatus] = await Promise.all([
          fetchProfile(session.user.id),
          checkRoleStatus()
        ]);
        setProfile(profileData);
        setIsAdmin(roleStatus.isAdmin);
        setIsEditor(roleStatus.isEditor);

        // Subscribe to realtime role changes for this user
        roleChannel = supabase
          .channel('user-role-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_roles',
              filter: `user_id=eq.${session.user.id}`,
            },
            async () => {
              const newRoleStatus = await checkRoleStatus();
              setIsAdmin(newRoleStatus.isAdmin);
              setIsEditor(newRoleStatus.isEditor);
            }
          )
          .subscribe();
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (roleChannel) {
        supabase.removeChannel(roleChannel);
      }
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName || email,
          },
        },
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
    setIsEditor(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isLoading,
      isAdmin,
      isEditor,
      canManageEvents,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
