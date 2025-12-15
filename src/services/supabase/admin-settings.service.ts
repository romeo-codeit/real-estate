import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface ROISetting {
  id: string;
  investment_type: 'crypto' | 'property' | 'plan';
  base_roi: number;
  adjustment_rate: number;
  growth_direction: 'up' | 'down' | 'stable';
  last_updated: string;
  updated_by?: string;
}

export interface AdminControl {
  id: string;
  investment_growth_mode: 'automatic' | 'manual' | 'paused';
  roi_adjustment_rate: number;
  last_applied?: string;
}

class AdminSettingsService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // ROI Settings Management
  async getROISettings(): Promise<ROISetting[]> {
    const { data, error } = await this.supabase
      .from('roi_settings')
      .select('*')
      .order('investment_type');

    if (error) throw error;
    return data || [];
  }

  async updateROISetting(
    investmentType: string,
    updates: Partial<Pick<ROISetting, 'base_roi' | 'adjustment_rate' | 'growth_direction'>>
  ): Promise<void> {
    const { error } = await this.supabase
      .from('roi_settings')
      .update({
        ...updates,
        last_updated: new Date().toISOString(),
      })
      .eq('investment_type', investmentType);

    if (error) throw error;
  }

  // Admin Controls Management
  async getAdminControls(): Promise<AdminControl | null> {
    const { data, error } = await this.supabase
      .from('admin_controls')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }

  async updateAdminControls(updates: Partial<AdminControl>): Promise<void> {
    const { error } = await this.supabase
      .from('admin_controls')
      .update({
        ...updates,
        last_applied: new Date().toISOString(),
      })
      .eq('id', (await this.getAdminControls())?.id);

    if (error) throw error;
  }

  // User Role Management
  async getAllUsers() {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateUserRole(userId: string, role: string, permissions: string[]) {
    const { error } = await this.supabase
      .from('users')
      .update({
        role,
        permissions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  }

  async updateUserStatus(userId: string, status: string) {
    const { error } = await this.supabase
      .from('users')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  }
}

const adminSettingsService = new AdminSettingsService(supabase);
export default adminSettingsService;