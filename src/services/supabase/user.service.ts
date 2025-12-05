import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

class UserService {
  private supabase: SupabaseClient;
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Get user profile by ID
  async getUserById(userId: string) {
    return await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
  }

  // Update user profile fields
  async updateUser(userId: string, updates: Record<string, any>) {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Fetch all users (admin only)
  async getAllUsers() {
    const { data, error } = await this.supabase.from('users').select('*');
    if (error) throw error;
    return data;
  }
}

const userService = new UserService(supabase);
export default userService;
