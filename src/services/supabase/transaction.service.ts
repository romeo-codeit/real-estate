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
    type: 'deposit' | 'withdrawal' | 'investment' | 'payout' | 'fee' | 'refund';
    amount: number;
    currency?: string;
    status?: 'pending' | 'completed' | 'failed' | 'cancelled';
    provider?: string;
    provider_txn_id?: string;
    related_object?: Record<string, any>;
    fees?: number;
    metadata?: Record<string, any>;
  }) {
    const { data: transaction, error } = await this.supabase
      .from('transactions')
      .insert({
        user_id: data.user_id,
        type: data.type,
        amount: data.amount,
        currency: data.currency || 'USD',
        status: data.status || 'pending',
        provider: data.provider,
        provider_txn_id: data.provider_txn_id,
        related_object: data.related_object,
        fees: data.fees || 0,
        metadata: data.metadata,
      })
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

  // Get all transactions (admin view)
  async getAllTransactions() {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  // Attach or update the provider transaction identifier for a given
  // internal transaction record. This is used so webhooks and
  // verification endpoints can reliably match gateway events to our
  // ledger rows.
  async setProviderTransactionId(transactionId: string, providerTxnId: string) {
    const { data, error } = await this.supabase
      .from('transactions')
      .update({
        provider_txn_id: providerTxnId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Calculate user's effective balance and available withdrawal amount
  // Calculate user's effective balance and available withdrawal amount (DB-driven)
  async getUserAvailableBalance(userId: string) {
    const { data, error } = await (this.supabase as any).rpc('get_user_balance_details', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error fetching user balance:', error);
      throw error;
    }

    // RPC returns JSONB, cast it to expected shape
    const result = data as {
      balance: number;
      pendingWithdrawals: number;
      pendingInvestments: number;
      availableToWithdraw: number;
    };

    return result;
  }

  // Create a withdrawal atomically with balance checks
  async createWithdrawal(data: {
    user_id: string;
    amount: number;
    currency: string;
    provider: string;
    metadata?: any;
  }) {
    const { data: result, error } = await (this.supabase as any).rpc('request_withdrawal', {
      p_user_id: data.user_id,
      p_amount: data.amount,
      p_currency: data.currency,
      p_provider: data.provider,
      p_metadata: data.metadata || {}
    });

    if (error) {
      console.error('Error requesting withdrawal:', error);
      throw error;
    }

    return result;
  }

  // Update transaction status and record how it was confirmed.
  async updateTransactionStatus(
    userId: string | undefined,
    providerTxnId: string,
    status: string,
    context?: {
      source?: 'gateway_webhook' | 'gateway_verify' | 'manual_confirm' | 'system';
      method?: string; // e.g. stripe, paystack, paypal, crypto
      note?: string;
      idempotencyKey?: string;
    }
  ) {
    // First, load the transaction so we can perform idempotency checks
    // and then decide whether to apply updates.
    let selectQuery = this.supabase
      .from('transactions')
      .select('*')
      .eq('provider_txn_id', providerTxnId);

    if (userId) {
      selectQuery = selectQuery.eq('user_id', userId);
    }

    const { data: existing, error: selectError } = await selectQuery.single();

    if (selectError) throw selectError;

    const existingMetadata = (existing.metadata as Record<string, any> | null) || {};
    const existingConfirmation = existingMetadata.confirmation as
      | { idempotencyKey?: string; status?: string }
      | undefined;

    // If we have an idempotency key and we've already processed this
    // exact event for this transaction, treat as a no-op.
    if (
      context?.idempotencyKey &&
      existingConfirmation?.idempotencyKey === context.idempotencyKey &&
      existingConfirmation?.status === status
    ) {
      return existing;
    }

    // Apply the status update (idempotent if status is unchanged).
    let updateQuery = this.supabase
      .from('transactions')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    const { data, error } = await updateQuery.select().single();

    if (error) throw error;

    // Record confirmation metadata so ops can distinguish
    // gateway-confirmed vs manual/system changes.
    if (context && data) {
      const confirmation = {
        source: context.source || 'system',
        method: context.method || data.provider || null,
        note: context.note || null,
        status,
        at: new Date().toISOString(),
        idempotencyKey: context.idempotencyKey || existingConfirmation?.idempotencyKey || null,
      };

      const { error: metaError } = await this.supabase
        .from('transactions')
        .update({
          metadata: {
            ...existingMetadata,
            confirmation,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.id);

      if (metaError) throw metaError;

      // Reflect new metadata in the returned object
      (data as any).metadata = {
        ...existingMetadata,
        confirmation,
      };
    }

    // If transaction is completed and it's an investment transaction, update investment status
    if (status === 'completed' && data.type === 'investment' && data.related_object?.investment_id) {
      const investmentService = (await import('./investment.service')).default;
      await investmentService.updateInvestmentStatus(data.related_object.investment_id, 'active');
    }

    return data;
  }
}

const transactionService = new TransactionService(supabase);
export default transactionService;
