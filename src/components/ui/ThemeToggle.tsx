"use client";

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

function getInitialTheme() {
  try {
    // cookie takes precedence for SSR
    const match = document.cookie.match(/(^|;)\s*theme=([^;]+)/);
    if (match && match[2]) return match[2];
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch (e) {
    return 'light';
  }
}

export default function ThemeToggle() {
  // Defer resolving theme until after mount to avoid hydration mismatches
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = getInitialTheme() as 'light' | 'dark';
    setTheme(initial);

    // Apply class to document root
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // persist to localStorage and cookie (1 year)
    try {
      localStorage.setItem('theme', initial);
      document.cookie = `theme=${initial};path=/;max-age=${60 * 60 * 24 * 365}`;
    } catch (e) {
      // ignore
    }

    setMounted(true);
  }, []);

  const toggle = () => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      if (next === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('theme', next);
        document.cookie = `theme=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
      } catch (e) {}
      return next;
    });
  };

  // While not mounted, render a neutral placeholder to avoid mismatches
  if (!mounted) {
    return (
      <button
        aria-hidden={true}
        aria-label="Toggle theme"
        title="Toggle theme"
        className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent/20 transition-colors"
      >
        {/* empty placeholder to avoid SSR/CSR icon mismatch */}
        <span className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      aria-pressed={theme === 'dark'}
      aria-label="Toggle theme"
      title="Toggle theme"
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent/20 transition-colors"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
