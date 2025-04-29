
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  role: string;
  email: string;
  full_name?: string;
  specialty?: 'pml' | 'pol';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('role, email, full_name, specialty')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      console.log('Profile data received:', data);
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing auth...');
        
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, currentSession) => {
            console.log('Auth state change event:', event);
            
            // Update session and user synchronously
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            // If we have a user, fetch their profile but don't block UI
            if (currentSession?.user) {
              // Using setTimeout to avoid potential deadlocks with Supabase client
              setTimeout(async () => {
                const userProfile = await fetchProfile(currentSession.user.id);
                setProfile(userProfile);
                console.log('User profile from auth change:', userProfile);
              }, 0);
            } else {
              setProfile(null);
            }
          }
        );

        // THEN check for existing session
        try {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting auth session:', error);
          } else {
            console.log('Session check complete:', data.session ? 'session found' : 'no session');
            
            // Update session and user
            setSession(data.session);
            setUser(data.session?.user ?? null);
            
            // If we have a session with a user, fetch their profile
            if (data.session?.user) {
              const userProfile = await fetchProfile(data.session.user.id);
              setProfile(userProfile);
              console.log('User profile from session check:', userProfile);
            }
          }
        } catch (sessionError) {
          console.error('Exception during session fetch:', sessionError);
        } finally {
          // Always set loading to false, even if there was an error
          setLoading(false);
        }
        
        console.log('Auth initialization complete');

        return () => {
          console.log('Cleaning up auth subscription');
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signOut = async () => {
    try {
      console.log('Signing out...');
      
      // First clear our local state - do this first to ensure UI updates quickly
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      } else {
        console.log('Sign out successful');
        
        // Force redirect to login page after logout
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if there's an error, redirect to login
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    session,
    profile,
    signOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
