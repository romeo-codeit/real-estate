'use client';

import { useAuth } from '@/hooks/use-auth-rbac';

type Props = {
  children: React.ReactNode;
};

const CustomDashboardLayout = ({ children }: Props) => {
  const { isAuthenticating, isAuthenticated } = useAuth();

  // useEffect(() => {
  //   // Start authentication state listener
  //   const { data: authListener } = supabase.auth.onAuthStateChange(
  //     async (event, session) => {
  //       if (event === 'SIGNED_IN' && session) {
  //         // user logged in
  //         setIsAuthenticated(true);
  //       }

  //       if (event === 'SIGNED_OUT') {
  //         // user logged out
  //         setIsAuthenticated(false);
  //         window.location.replace('/login');
  //       }
  //     }
  //   );

  //   // Check session immediately on mount
  //   const checkSession = async () => {
  //     const {
  //       data: { session },
  //     } = await supabase.auth.getSession();

  //     if (session) {
  //       setIsAuthenticated(true);
  //     } else {
  //       setIsAuthenticated(false);
  //     }
  //   };

  //   checkSession();

  //   // Cleanup subscription on unmount
  //   return () => {
  //     authListener.subscription.unsubscribe();
  //   };
  // }, [setIsAuthenticated]);

  // Loading spinner while authenticating
  if (isAuthenticating) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  // Redirect unauthenticated users
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
    return null;
  }

  // Render protected dashboard
  return <>{children}</>;
};

export default CustomDashboardLayout;
