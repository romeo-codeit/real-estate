import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

class TransactionService {
  private supabase: SupabaseClient;
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Record a new transaction
  async createTransaction(data: {
    user_id: string;
    investment_id?: string;
    amount: number;
    type: 'deposit' | 'withdrawal' | 'investment';
    status: 'pending' | 'completed' | 'failed';
    tx_ref: string;
    metadata?: Record<string, any>;
  }) {
    const { data: transaction, error } = await this.supabase
      .from('transactions')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return transaction;
  }

  // Get all transactions for a user
  async getUserTransactions(userId: string) {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Update transaction status (admin or webhook)
  async updateTransactionStatus(tx_ref: string, status: string) {
    const { data, error } = await this.supabase
      .from('transactions')
      .update({ status })
      .eq('tx_ref', tx_ref)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

const transactionService = new TransactionService(supabase);
export default transactionService;
