'use client';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth-rbac';
import { useEffect, useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminLoginPage = pathname === '/admin';
  const { isAuthenticating, isAuthenticated } = useAuth();
  const [authTimeout, setAuthTimeout] = useState(false);

  // Set timeout for authentication check (5 seconds)
  useEffect(() => {
    if (isAuthenticating) {
      const timer = setTimeout(() => {
        console.error('Authentication timeout - forcing redirect');
        setAuthTimeout(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticating]);

  // Loading spinner while authenticating
  if (isAuthenticating && !authTimeout) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users or timeout
  if (!isAuthenticated || authTimeout) {
    if (typeof window !== 'undefined') {
      console.log('Redirecting to login - authenticated:', isAuthenticated, 'timeout:', authTimeout);
      window.location.replace('/login');
    }
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background dark:bg-sidebar-background">
      {!isAdminLoginPage && <AdminSidebar />}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
