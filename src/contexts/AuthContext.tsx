
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
    console.log('Starting signOut process...');
    
    try {
      // First, clear all browser storage completely
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear local state first for immediate UI feedback
      setUser(null);
      setSession(null);
      setProfile(null);
      
      console.log('Local state cleared, attempting Supabase signOut...');
      
      // Call Supabase signOut with global scope to invalidate on all devices
      const { error } = await supabase.auth.signOut({ 
        scope: 'global' 
      });
      
      if (error) {
        console.error('Error during Supabase signOut:', error);
        throw error;
      }
      
      console.log('Supabase signOut completed successfully');
      
      // Force a page reload to clear any cached state
      window.location.reload();
      
    } catch (error) {
      console.error('Error during signOut process:', error);
      throw error;
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
