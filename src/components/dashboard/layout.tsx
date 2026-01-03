'use client';

import { useAuth } from '@/hooks/use-auth-rbac';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Props = {
  children: React.ReactNode;
};

const CustomDashboardLayout = ({ children }: Props) => {
  const router = useRouter();
  const { isAuthenticating, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect unauthenticated users once loading is done
  useEffect(() => {
    if (mounted && !isAuthenticating && !isAuthenticated) {
      router.replace('/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [mounted, isAuthenticating, isAuthenticated, router]);

  // Loading spinner while authenticating or mounting
  if (!mounted || isAuthenticating) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  // If authenticated, render children
  // If not authenticated, the useEffect above will handle redirect
  // We return null here to prevent flashing protected content
  if (!isAuthenticated) {
    return null;
  }

  // Render protected dashboard
  return <>{children}</>;
};

export default CustomDashboardLayout;
