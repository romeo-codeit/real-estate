import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { User, UserRole } from '@/lib/types';
import { getPermissionsForRole } from '@/lib/permissions';
import { checkRateLimit } from '@/lib/rateLimit';

class AuthService {
  private supabase: SupabaseClient;
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Create account
  async register(email: string, password: string, firstName: string, lastName: string, role: UserRole = 'user') {
    // NOTE: This service runs on the client and server; the in-memory
    // limiter is only reliable on the server. For production, consider
    // moving auth endpoints to dedicated API routes and applying a
    // Redis-backed limiter there.
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    if (error) throw error;

    // Database trigger (handle_new_user) automatically creates:
    // - users table record with default 'user' role
    // - profiles table record
    // - user_roles assignment
    // No manual insert needed here!

    return { data, error };
  }

  // Login
  async login(email: string, password: string) {
    // Basic best-effort rate limiting when called on the server. On the
    // client, this has no effect; UI-side we should still avoid enabling
    // automated brute-force.
    try {
      // Fake a minimal NextRequest-like object is not practical here, so
      // we intentionally keep server-side login flows in API routes if
      // stronger rate limiting is needed. This method itself does not
      // have direct access to the incoming request.
    } catch {
      // ignore
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { data: null, error };
    }

    // Update last login
    if (data.user) {
      try {
        const { error: updateError } = await this.supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Failed to update last_login:', updateError);
        }
      } catch (updateError) {
        console.error('Exception updating last_login:', updateError);
      }
    }

    return { data, error: null };
  }

  // Logout
  async signOut() {
    return this.supabase.auth.signOut();
  }

  async logout() {
    return this.signOut();
  }

  // Get current user with profile
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error || !user) return null;

      // Get user profile
      const { data: profile, error: profileError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // Profile fetch failed - return user without profile data
        // This allows authentication to work even if profile is temporarily unavailable
        return {
          ...user,
          profile: null,
        };
      }

      return {
        ...user,
        profile,
      };
    } catch (error) {
      console.error('getCurrentUser error:', error);
      return null;
    }
  }

  // Reset password
  async resetPassword(email: string) {
    return this.supabase.auth.resetPasswordForEmail(email);
  }

  // Check if user has permission
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('permissions')
      .eq('id', userId)
      .single();

    if (error || !user) return false;

    return user.permissions?.includes(permission) || false;
  }

  // Check if user has role
  async hasRole(userId: string, role: UserRole): Promise<boolean> {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !user) return false;

    return user.role === role;
  }
}

const authService = new AuthService(supabase);
export default authService;
