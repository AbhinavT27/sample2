
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type UserPreferences = {
  dietary_preferences: string[] | null;
  allergies: string[] | null;
  username: string;
  phone_number: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userPreferences: UserPreferences | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshUserPreferences: () => Promise<void>;
  isNewUser: boolean;
  setIsNewUser: (isNew: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // Function to fetch user preferences
  const fetchUserPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, dietary_preferences, allergies, phone_number')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user preferences:', error);
        return;
      }

      if (data) {
        setUserPreferences({
          username: data.username,
          dietary_preferences: data.dietary_preferences,
          allergies: data.allergies,
          phone_number: data.phone_number
        });
      }
    } catch (error) {
      console.error('Error in fetchUserPreferences:', error);
    }
  };

  // Function to refresh user preferences
  const refreshUserPreferences = async () => {
    if (!user?.id) return;
    await fetchUserPreferences(user.id);
  };

  useEffect(() => {
    // Clean up function to avoid memory leaks
    const cleanupAuthState = () => {
      try {
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            
            // Fetch user preferences when auth state changes to signed in
            if (session?.user) {
              // Use setTimeout to prevent potential deadlocks
              setTimeout(() => {
                fetchUserPreferences(session.user.id);
              }, 0);
            } else {
              setUserPreferences(null);
            }
            
            setIsLoading(false);
          }
        );

        // THEN check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Use setTimeout to prevent potential deadlocks
            setTimeout(() => {
              fetchUserPreferences(session.user.id);
            }, 0);
          }
          
          setIsLoading(false);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error setting up auth state:', error);
        setIsLoading(false);
        return () => {};
      }
    };

    const cleanup = cleanupAuthState();
    return cleanup;
  }, []);

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Clean up auth state from storage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Attempt global sign out
      await supabase.auth.signOut({ scope: 'global' });
      
      // Force page reload for a clean state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      userPreferences, 
      isLoading, 
      signOut,
      refreshUserPreferences,
      isNewUser,
      setIsNewUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
