import { SupabaseClient } from '@supabase/supabase-js';
import { Database, TablesInsert, TablesUpdate } from '../../../database.types';
import { supabase } from './supabase';

class InvestmentService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  // ✅ Create a new investment
  async createInvestment(data: TablesInsert<'investments'>) {
    try {
      const { data: result, error } = await this.supabase
        .from('investments')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Error creating investment:', error);
      throw error;
    }
  }

  // ✅ Fetch all investments (optionally by user)
  async getInvestments(userId?: string) {
    try {
      const query = this.supabase
        .from('investments')
        .select('*')
        .order('created_at', { ascending: false });
      if (userId) query.eq('user_id', userId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching investments:', error);
      throw error;
    }
  }

  // ✅ Fetch single investment by ID
  async getInvestmentById(id: string) {
    try {
      const { data, error } = await this.supabase
        .from('investments')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching investment:', error);
      throw error;
    }
  }

  // ✅ Update investment details
  async updateInvestment(id: string, updates: TablesUpdate<'investments'>) {
    try {
      const { data, error } = await this.supabase
        .from('investments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating investment:', error);
      throw error;
    }
  }

  // ✅ Delete investment
  async deleteInvestment(id: string) {
    try {
      const { error } = await this.supabase
        .from('investments')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting investment:', error);
      throw error;
    }
  }
}

const investmentService = new InvestmentService(supabase);
export default investmentService;
