"use client";
import { useRouter } from 'next/navigation';

const useQueryParams = () => {
  const location = window.location;
  const router = useRouter();

  // ✅ Read query parameters
  const getQueryParams = () => {
    return Object.fromEntries(new URLSearchParams(location.search));
  };

  const setQueryParams = (
    newParams: Record<string, string | null>,
    options: { replace?: boolean; merge?: boolean } = {
      replace: false,
      merge: true,
    }
  ) => {
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
