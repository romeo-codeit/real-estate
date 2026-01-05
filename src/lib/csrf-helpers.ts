/**
 * Helper utility to fetch CSRF token for authenticated requests
 * Use this before making any POST/PATCH/DELETE requests to protected endpoints
 */

import { supabase } from '@/services/supabase/supabase';

export async function fetchCSRFToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session');
  }

  const csrfResponse = await fetch('/api/csrf', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!csrfResponse.ok) {
    throw new Error('Failed to get security token');
  }

  const { token } = await csrfResponse.json();
  return token;
}

/**
 * Get authenticated headers including CSRF token
 * Usage:
 * const headers = await getAuthHeaders();
 * fetch('/api/endpoint', { method: 'POST', headers, body: ... })
 */
export async function getAuthHeaders(includeContentType = true): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session');
  }

  const csrfToken = await fetchCSRFToken();
  
  const headers: HeadersInit = {
    'Authorization': `Bearer ${session.access_token}`,
    'x-csrf-token': csrfToken,
  };

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}
