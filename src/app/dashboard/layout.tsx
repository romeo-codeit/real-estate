'use client';

import { Sidebar } from '@/components/dashboard/Sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { DashboardMobileMenu } from '@/components/dashboard/DashboardMobileMenu';
import { AdminMobileMenu } from '@/components/admin/AdminMobileMenu';
import CustomDashboardLayout from '@/components/dashboard/layout';
import { CriticalErrorBoundary } from '@/components/shared/AsyncErrorBoundary';
import { useAuth } from '@/hooks/use-auth-rbac';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  return (
    <CustomDashboardLayout>
      <CriticalErrorBoundary name="dashboard-layout">
        <div className="flex flex-col h-screen bg-background dark:bg-sidebar-background">
          {/* Mobile Menu - only visible on mobile */}
          {isAdmin ? <AdminMobileMenu /> : <DashboardMobileMenu />}
          
          {/* Main flex container for desktop */}
          <div className="hidden md:flex flex-1 overflow-hidden">
            {isAdmin ? <AdminSidebar /> : <Sidebar />}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
          </div>

          {/* Mobile main content - shows on mobile when no sheet is open */}
          <div className="md:hidden flex flex-1 overflow-hidden">
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">{children}</main>
          </div>
        </div>
      </CriticalErrorBoundary>
    </CustomDashboardLayout>
  );
}
