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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (typeof window !== 'undefined' ? getInitialTheme() as 'light' | 'dark' : 'light'));

  useEffect(() => {
    // Apply class to document root
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // persist to localStorage and cookie (1 year)
    try {
      localStorage.setItem('theme', theme);
      document.cookie = `theme=${theme};path=/;max-age=${60 * 60 * 24 * 365}`;
    } catch (e) {
      // ignore
    }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

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
