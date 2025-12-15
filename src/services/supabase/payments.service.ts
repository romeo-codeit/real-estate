import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { ReferralService } from './referral.service';

class PaymentsService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Create a new payment record
  async createPayment(data: {
    user_id: string;
    investment_id: string;
    amount: number;
    payment_method: string;
    tx_hash?: string;
  }) {
    const { data: payment, error } = await this.supabase
      .from('payments')
      .insert({
        user_id: data.user_id,
        investment_id: data.investment_id,
        amount: data.amount,
        payment_method: data.payment_method,
        tx_hash: data.tx_hash,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return payment;
  }

  // Update payment status
  async updatePaymentStatus(paymentId: string, status: 'pending' | 'completed' | 'failed' | 'cancelled', confirmedBy?: string) {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.confirmed_at = new Date().toISOString();
      if (confirmedBy) {
        updateData.confirmed_by = confirmedBy;
      }
    }

    const { data, error } = await this.supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get payments for a user
  async getUserPayments(userId: string) {
    const { data, error } = await this.supabase
      .from('payments')
      .select(`
        *,
        investments (
          investment_type,
          amount_invested,
          roi_rate
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Get payment by ID
  async getPaymentById(id: string) {
    const { data, error } = await this.supabase
      .from('payments')
      .select(`
        *,
        investments (
          investment_type,
          amount_invested,
          roi_rate,
          user_id
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // Get payments by investment ID
  async getPaymentsByInvestment(investmentId: string) {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('investment_id', investmentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Confirm payment and activate investment
  async confirmPaymentAndActivateInvestment(paymentId: string, adminUserId: string) {
    // This legacy method performed multiple cross-table updates (payments,
    // investments, referrals) without a true database transaction, which can
    // leave the system in an inconsistent state if any step fails.
    //
    // The production-safe pattern is now:
    //   - Use the unified `transactions` ledger for all money movements
    //   - Let gateway webhooks or the verification flow call
    //     `transactionService.updateTransactionStatus`, which will in turn
    //     activate the related investment in a controlled, idempotent way and
    //     record confirmation metadata.
    //
    // To avoid anyone accidentally wiring webhooks or admin tools into this
    // non-atomic helper, it is intentionally disabled.
    throw new Error(
      'PaymentsService.confirmPaymentAndActivateInvestment is deprecated. '
      + 'Use the transactions ledger + transactionService.updateTransactionStatus-based flows instead.'
    );
  }
}

const paymentsService = new PaymentsService(supabase);
export default paymentsService;