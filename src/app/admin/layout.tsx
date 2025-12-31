'use client';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth-rbac';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminLoginPage = pathname === '/admin';
  const { isAuthenticating, isAuthenticated } = useAuth();

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

  return (
    <div className="flex min-h-screen bg-background dark:bg-sidebar-background">
      {!isAdminLoginPage && <AdminSidebar />}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
