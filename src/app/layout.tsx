import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Toaster } from "@/components/ui/toaster";
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import { CriticalErrorBoundary } from '@/components/shared/AsyncErrorBoundary';
import { setupGlobalErrorHandlers } from '@/lib/error-monitoring';

// Initialize global error handlers
if (typeof window !== 'undefined') {
  setupGlobalErrorHandlers();
}

export const metadata: Metadata = {
  title: 'RealEstate Explorer',
  description: 'Find your dream home with RealEstate Explorer',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var match = document.cookie.match(/(^|;)\s*theme=([^;]+)/);
              var theme = (match && match[2]) || localStorage.getItem('theme');
              if(!theme) {
                var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                theme = prefersDark ? 'dark' : 'light';
              }
              if(theme === 'dark') document.documentElement.classList.add('dark');
              else document.documentElement.classList.remove('dark');
            } catch (e) { /* ignore */ }
          })();
        ` }} />
      </head>
      <body className="font-body bg-background text-foreground antialiased" suppressHydrationWarning>
        <CriticalErrorBoundary name="root-layout">
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </CriticalErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
