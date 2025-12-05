import { Sidebar } from '@/components/dashboard/Sidebar';
import CustomDashboardLayout from '@/components/dashboard/layout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomDashboardLayout>
      <div className="flex min-h-[calc(100vh-5rem)] bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </CustomDashboardLayout>
  );
}
