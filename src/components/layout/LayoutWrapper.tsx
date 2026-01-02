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

  // Don't show header/footer on admin pages, dashboard pages, and auth pages (login/signup)
  const isAdminPage = pathname.startsWith('/admin');
  const isDashboardPage = pathname.startsWith('/dashboard');
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password');

  const hideHeaderFooter = isAdminPage || isDashboardPage || isAuthPage;

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