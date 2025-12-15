"use client";
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

const useQueryParams = () => {
  const router = useRouter();

  // Only access window on client side
  const location = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return window.location;
  }, []);

  // ✅ Read query parameters
  const getQueryParams = () => {
    if (!location) return {};
    return Object.fromEntries(new URLSearchParams(location.search));
  };

  const setQueryParams = (
    newParams: Record<string, string | null>,
    options: { replace?: boolean; merge?: boolean } = {
      replace: false,
      merge: true,
    }
  ) => {
    if (!location) return;

    const searchParams = new URLSearchParams(location.search);

    if (options.merge) {
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null) {
          searchParams.delete(key);
        } else {
          searchParams.set(key, value);
        }
      });
    } else {
      // Replace all params
      Object.entries(newParams).forEach(([key, value]) => {
        if (value !== null) {
          searchParams.set(key, value);
        }
      });

      // Remove any keys not in newParams
      for (const key of Array.from(searchParams.keys())) {
        if (!(key in newParams)) {
          searchParams.delete(key);
        }
      }
    }

    router.push(`${location.pathname}?${searchParams.toString()}`);
  };

  return { getQueryParams, setQueryParams };
};

export default useQueryParams;
