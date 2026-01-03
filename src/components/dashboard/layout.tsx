'use client';

import { useAuth } from '@/hooks/use-auth-rbac';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase/supabase';

type Props = {
  children: React.ReactNode;
};

const CustomDashboardLayout = ({ children }: Props) => {
  const router = useRouter();
  const { isAuthenticating, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check Supabase session directly
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session?.user) {
          // No valid session, redirect to login
          router.replace('/login?redirect=' + encodeURIComponent(window.location.pathname));
        }
        setSessionChecked(true);
      } catch (err) {
        console.error('Error checking session:', err);
        router.replace('/login?redirect=' + encodeURIComponent(window.location.pathname));
      }
    };

    checkSession();
    
    // Safety timeout - if session check hangs for more than 3 seconds, force it to complete
    const timeout = setTimeout(() => {
      if (!sessionChecked) {
        console.warn('Session check timed out, forcing completion');
        setSessionChecked(true);
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [mounted, router, sessionChecked]);

  // Loading spinner while checking auth
  if (!mounted || isAuthenticating || !sessionChecked) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  // Redirect unauthenticated users (fallback)
  if (!isAuthenticated) {
    return null;
  }

  // Render protected dashboard
  return <>{children}</>;
};

export default CustomDashboardLayout;
