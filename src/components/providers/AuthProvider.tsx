'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase/supabase';
import useUserStore from '@/states/user-store';
import authService from '@/services/supabase/auth.service';
import auditService from '@/services/supabase/audit.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setUser: setUserStore, logout: logoutStore } = useUserStore();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          // Load user profile data
          try {
            const userData = await authService.getCurrentUser();
            if (userData?.profile) {
              setUserStore(userData.profile);
            }
          } catch (profileError) {
            console.error('AuthProvider: Error loading user profile:', profileError);
          }
        }
      } catch (error) {
        console.error('AuthProvider: Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Commented out console.log to prevent browser extension conflicts
      // console.log('Auth state change:', event, session?.user?.email);

      if (session?.user) {
        setUser(session.user);

        // Update last_login only on actual sign in events
        if (event === 'SIGNED_IN') {
          try {
            const { error: updateError } = await supabase
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', session.user.id);

            if (updateError) {
              console.error('Failed to update last_login:', updateError);
            }

            // Log audit event
            await auditService.logAuditEvent(
              session.user.id,
              'login',
              'user',
              session.user.id,
              { event: 'user_signed_in' },
              undefined, // IP address (would need to be passed from client)
              navigator?.userAgent
            );
          } catch (updateError) {
            console.error('Exception updating last_login:', updateError);
          }
        }

        if (event === 'SIGNED_OUT') {
          // Log logout event if we have the user ID
          if (user) {
            try {
              await auditService.logAuditEvent(
                user.id,
                'logout',
                'user',
                user.id,
                { event: 'user_signed_out' },
                undefined,
                navigator?.userAgent
              );
            } catch (error) {
              console.error('Exception logging logout:', error);
            }
          }
        }

        // Load user profile data
        try {
          const userData = await authService.getCurrentUser();
          if (userData?.profile) {
            setUserStore(userData.profile);
          }
        } catch (profileError) {
          console.error('AuthProvider: Error loading user profile on auth change:', profileError);
        }
      } else {
        setUser(null);
        // Only clear store if this wasn't triggered by a manual logout
        // (manual logout will handle clearing the store itself)
        if (event !== 'SIGNED_OUT') {
          logoutStore();
        }
      }

      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [setUserStore, logoutStore]);

  const value = {
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}