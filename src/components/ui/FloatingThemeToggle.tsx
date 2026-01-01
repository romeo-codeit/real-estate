"use client";

import ThemeToggle from '@/components/ui/ThemeToggle';

export default function FloatingThemeToggle() {
  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <div className="shadow-xl rounded-full p-1 bg-card/90 border border-border backdrop-blur-md focus-within:outline-none focus-within:ring-2 focus-within:ring-accent">
        <ThemeToggle />
      </div>
    </div>
  );
}
