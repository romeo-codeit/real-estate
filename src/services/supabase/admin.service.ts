import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { supabaseAdmin, hasServiceRoleKey } from './supabase-admin';

class AdminService {
  private supabase: SupabaseClient<any>;
  constructor() {
    // Always use server-side admin client if available, otherwise use regular client
    this.supabase = hasServiceRoleKey ? supabaseAdmin : supabase;
  }

  // Get total users count
  async getTotalUsers(): Promise<number> {
    const { count, error } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }

  // Get total investments amount
  async getTotalInvestments(): Promise<number> {
    const { data, error } = await this.supabase
      .from('investments')
      .select('amount_invested');

    if (error) throw error;

    const total = data?.reduce((sum, investment) => sum + (investment.amount_invested || 0), 0) || 0;
    return total;
  }

  // Get total transactions count by type
  async getTransactionStats() {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('type, amount');

    if (error) throw error;

    const deposits = data?.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0) || 0;
    const withdrawals = data?.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0) || 0;

    return { deposits, withdrawals };
  }

  // Get users by role count
  async getUsersByRole() {
    const { data, error } = await this.supabase
      .from('users')
      .select('role');

    if (error) throw error;

    const roleCounts = data?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return roleCounts;
  }

  // Get recent user registrations (last 30 days)
  async getRecentRegistrations(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count, error } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) throw error;
    return count || 0;
  }

  // Get investment growth over time (monthly for last 12 months)
  async getInvestmentGrowth(): Promise<Array<{ month: string; amount: number }>> {
    const months: Array<{ month: string; amount: number }> = [];
    const currentDate = new Date();

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'long' });
      months.push({ month: monthName, amount: 0 });
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data, error } = await this.supabase
      .from('investments')
      .select('amount_invested, created_at')
      .gte('created_at', oneYearAgo.toISOString());

    if (error) throw error;

    // Aggregate by month
    data?.forEach(investment => {
      const date = new Date(investment.created_at);
      const monthName = date.toLocaleString('default', { month: 'long' });
      const monthData = months.find(m => m.month === monthName);
      if (monthData) {
        monthData.amount += investment.amount_invested || 0;
      }
    });

    return months;
  }

  // Get all users (admin only - bypasses RLS)
  async getAllUsers() {
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
    }));
  }

  // Admin methods for user management
  async updateUserRole(userId: string, role: string) {
    const permissions = this.getPermissionsForRole(role);
    const { data, error } = await this.supabase
      .from('users')
      .update({ role, permissions })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Transform back to camelCase
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
    };
  }

  async updateUserStatus(userId: string, status: string) {
    const { data, error } = await this.supabase
      .from('users')
      .update({ status })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Transform back to camelCase
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
    };
  }

  private getPermissionsForRole(role: string) {
    // This should match the permissions logic from the permissions file
    switch (role) {
      case 'admin':
        return ['manage_users', 'manage_properties', 'manage_investments', 'manage_transactions', 'view_reports', 'manage_crypto', 'manage_agents', 'view_analytics'];
      case 'agent':
        return ['manage_properties', 'view_reports', 'manage_agents'];
      case 'investor':
        return ['view_analytics'];
      default:
        return [];
    }
  }
}

const adminService = new AdminService();
export default adminService;