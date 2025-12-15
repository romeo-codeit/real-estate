import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { User, UserRole, Permission } from '@/lib/types';
import { getPermissionsForRole } from '@/lib/permissions';

class UserService {
  private supabase: SupabaseClient;
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Get user profile by ID
  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;

    // Transform snake_case database columns to camelCase for the interface
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      role: data.role,
      permissions: data.permissions || [],
      lastLogin: data.last_login,
      status: data.status,
      is_admin: data.role === 'admin' // Legacy field
    } as User;
  }

  // Update user profile fields
  async updateUser(userId: string, updates: Partial<User>) {
    // Transform camelCase to snake_case for database
    const dbUpdates: any = {};
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.permissions !== undefined) dbUpdates.permissions = updates.permissions;
    if (updates.lastLogin !== undefined) dbUpdates.last_login = updates.lastLogin;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    const { data, error } = await this.supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Transform back to camelCase for the interface
    return {
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      role: data.role,
      permissions: data.permissions || [],
      lastLogin: data.last_login,
      status: data.status,
      is_admin: data.role === 'admin'
    } as User;
  }

  // Update user role and permissions
  async updateUserRole(userId: string, role: UserRole) {
    const permissions = getPermissionsForRole(role);
    return this.updateUser(userId, { role, permissions });
  }

  // Fetch all users (admin only)
  async getAllUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform snake_case database columns to camelCase for the interface
    return (data || []).map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      lastLogin: user.last_login,
      status: user.status,
      is_admin: user.role === 'admin' // Legacy field
    })) as User[];
  }

  // Get users by role
  async getUsersByRole(role: UserRole): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform snake_case database columns to camelCase for the interface
    return (data || []).map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      permissions: user.permissions || [],
      lastLogin: user.last_login,
      status: user.status,
      is_admin: user.role === 'admin' // Legacy field
    })) as User[];
  }

  // Suspend user
  async suspendUser(userId: string) {
    return this.updateUser(userId, { status: 'Suspended' });
  }

  // Activate user
  async activateUser(userId: string) {
    return this.updateUser(userId, { status: 'Active' });
  }

  // Ban user
  async banUser(userId: string) {
    return this.updateUser(userId, { status: 'Banned' });
  }

  // Check if user has permission
  async userHasPermission(userId: string, permission: Permission): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user?.permissions?.includes(permission) || false;
  }

  // Check if user has role
  async userHasRole(userId: string, role: UserRole): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user?.role === role || false;
  }
}

const userService = new UserService(supabase);
export default userService;
