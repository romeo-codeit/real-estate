'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/components/providers/AuthProvider';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't show header/footer on admin pages and dashboard pages
  const isAdminPage = pathname.startsWith('/admin');
  const isDashboardPage = pathname.startsWith('/dashboard');

  const hideHeaderFooter = isAdminPage || isDashboardPage;

  return (
    <AuthProvider>
      {!hideHeaderFooter && <Header />}
      <main className={hideHeaderFooter ? "min-h-screen" : "min-h-[calc(100vh-15rem)]"}>
        {children}
      </main>
      {!hideHeaderFooter && <Footer />}
    </AuthProvider>
  );
}