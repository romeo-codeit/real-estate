import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

class InvestmentPlansService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Get all active investment plans
  async getActivePlans() {
    const { data, error } = await this.supabase
      .from('investment_plans')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get all investment plans (admin view)
  async getAllPlans() {
    const { data, error } = await this.supabase
      .from('investment_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get investment plan by ID
  async getPlanById(id: string) {
    const { data, error } = await this.supabase
      .from('investment_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Create new investment plan (admin only)
  async createPlan(planData: {
    name: string;
    description?: string;
    roi_rate: number;
    min_investment: number;
    max_investment?: number;
    duration_months?: number;
  }) {
    const { data, error } = await this.supabase
      .from('investment_plans')
      .insert({
        ...planData,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update investment plan (admin only)
  async updatePlan(id: string, updates: Partial<{
    name: string;
    description: string;
    roi_rate: number;
    min_investment: number;
    max_investment: number;
    duration_months: number;
    status: string;
  }>) {
    const { data, error } = await this.supabase
      .from('investment_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete investment plan (admin only)
  async deletePlan(id: string) {
    const { error } = await this.supabase
      .from('investment_plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}

const investmentPlansService = new InvestmentPlansService(supabase);
export default investmentPlansService;