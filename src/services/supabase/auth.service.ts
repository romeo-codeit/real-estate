import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

class AuthService {
  private supabase: SupabaseClient;
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Create account
  async register(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  // Login
  async login(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  // Logout
  async signOut() {
    return this.supabase.auth.signOut();
  }

  async logout() {
    return this.signOut();
  }

  // Get current user
  async getCurrentUser() {
    return this.supabase.auth.getUser();
  }

  // Reset password
  async resetPassword(email: string) {
    return this.supabase.auth.resetPasswordForEmail(email);
  }
}

const authService = new AuthService(supabase);
export default authService;
