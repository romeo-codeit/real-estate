'use client';

import { useAuth } from '@/hooks/use-auth-rbac';
import { useEffect, useState } from 'react';

type Props = {
  children: React.ReactNode;
};

const CustomDashboardLayout = ({ children }: Props) => {
  const { isAuthenticating, isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Loading spinner while authenticating or mounting
  if (isAuthenticating || !mounted) {
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
