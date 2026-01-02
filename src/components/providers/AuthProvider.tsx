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
  const { setUser: setUserStore, logout: logoutStore, setIsAuthenticated } = useUserStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          setLoading(false);
          setIsInitialized(true);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          
          // Load user profile data
          try {
            const userData = await authService.getCurrentUser();
            if (isMounted && userData?.profile) {
              setUserStore(userData.profile);
            }
          } catch (profileError) {
            console.error('AuthProvider: Error loading user profile:', profileError);
            if (isMounted) {
              setIsAuthenticated(true);
            }
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('AuthProvider: Error in getInitialSession:', error);
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        const currentUser = session.user;
        setUser(currentUser);
        setIsAuthenticated(true);

        // Update last_login only on actual sign in events
        if (event === 'SIGNED_IN') {
          try {
            const { error: updateError } = await supabase
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', currentUser.id);

            if (updateError) {
              console.error('Failed to update last_login:', updateError);
            }

            // Log audit event
            try {
              await auditService.logAuditEvent(
                currentUser.id,
                'login',
                'user',
                currentUser.id,
                { event: 'user_signed_in' },
                undefined,
                navigator?.userAgent
              );
            } catch (auditError) {
              console.error('Failed to log audit event:', auditError);
            }
          } catch (updateError) {
            console.error('Exception updating last_login:', updateError);
          }
        }

        // Load user profile data
        try {
          const userData = await authService.getCurrentUser();
          if (isMounted && userData?.profile) {
            setUserStore(userData.profile);
          }
        } catch (profileError) {
          console.error('AuthProvider: Error loading user profile on auth change:', profileError);
        }
      } else {
        // Store user ID before clearing for audit log
        const previousUserId = user?.id;
        
        setUser(null);
        setIsAuthenticated(false);

        // Log logout event on explicit sign out
        if (event === 'SIGNED_OUT' && previousUserId) {
          try {
            await auditService.logAuditEvent(
              previousUserId,
              'logout',
              'user',
              previousUserId,
              { event: 'user_signed_out' },
              undefined,
              navigator?.userAgent
            );
          } catch (error) {
            console.error('Exception logging logout:', error);
          }
        }

        // Clear user store
        if (isMounted) {
          logoutStore();
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setUserStore, logoutStore, setIsAuthenticated]);

  const value = {
    user,
    loading: !isInitialized ? true : loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}