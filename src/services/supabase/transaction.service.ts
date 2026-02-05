import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';
import notificationService from './notification.service';
import { receiptService } from '../receipt.service';

export class TransactionService {
  private supabase: SupabaseClient;
  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    console.log('DEBUG: TransactionService initialized. Has admin?', !!this.supabase.auth.admin);
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
      source?: 'gateway_webhook' | 'gateway_verify' | 'manual_confirm' | 'system' | 'manual_claim';
      method?: string;
      note?: string;
      idempotencyKey?: string;
    }
  ) {
    console.log(`DEBUG: updateTransactionStatus called for providerTxnId: ${providerTxnId}`);

    // 1. Load and validate existing transaction
    const existing = await this.getTransactionByProviderId(providerTxnId, userId);

    // 2. Idempotency check
    if (this.isDuplicateRequest(existing, status, context?.idempotencyKey)) {
      return existing;
    }

    // 3. Update primary status
    const { data: updated, error: updateError } = await this.supabase
      .from('transactions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 4. Update confirmation metadata
    const finalTransaction = await this.saveConfirmationMetadata(updated, status, context, existing.metadata);

    // 5. Handle side effects (async/background)
    await this.handleTransactionSideEffects(finalTransaction, status);

    return finalTransaction;
  }

  private async getTransactionByProviderId(providerTxnId: string, userId?: string) {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('provider_txn_id', providerTxnId)
      .single();

    if (error) throw error;
    if (userId && data.user_id !== userId) {
      throw new Error(`Transaction ownership mismatch`);
    }
    return data;
  }

  private isDuplicateRequest(existing: any, newStatus: string, idempotencyKey?: string) {
    const confirmation = existing.metadata?.confirmation;
    return (
      idempotencyKey &&
      confirmation?.idempotencyKey === idempotencyKey &&
      confirmation?.status === newStatus
    );
  }

  private async saveConfirmationMetadata(transaction: any, status: string, context: any, existingMetadata: any) {
    if (!context) return transaction;

    const confirmation = {
      source: context.source || 'system',
      method: context.method || transaction.provider || null,
      note: context.note || null,
      status,
      at: new Date().toISOString(),
      idempotencyKey: context.idempotencyKey || existingMetadata?.confirmation?.idempotencyKey || null,
    };

    const { data, error } = await this.supabase
      .from('transactions')
      .update({
        metadata: { ...existingMetadata, confirmation },
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async handleTransactionSideEffects(transaction: any, status: string) {
    // 1. Investment Activation
    if (status === 'completed' && transaction.type === 'investment' && transaction.related_object?.investment_id) {
      try {
        const { InvestmentService } = await import('./investment.service');
        const investmentService = new InvestmentService(this.supabase);
        await investmentService.activateInvestment(transaction.related_object.investment_id);
      } catch (err) {
        console.error('Investment activation failed:', err);
      }
    }

    // 2. Notifications & Lifecycle Tasks
    try {
      await this.sendLifecycleNotifications(transaction, status);
      if (status === 'completed') {
        await this.handlePostCompletionTasks(transaction);
      }
    } catch (err) {
      console.error('Lifecycle side effects failed:', err);
    }
  }

  private async sendLifecycleNotifications(transaction: any, status: string) {
    const title = status === 'completed' ? 'Transaction completed' : `Transaction ${status}`;
    await notificationService.createNotification({
      user_id: transaction.user_id,
      type: `transaction_${status}`,
      title,
      body: `${transaction.type} ${status} for ${transaction.amount} ${transaction.currency || 'USD'}.`,
      data: { transaction_id: transaction.id, status, amount: transaction.amount, currency: transaction.currency },
    });
  }

  private async handlePostCompletionTasks(transaction: any) {
    // Receipt Generation
    try {
      await receiptService.generateReceipt(transaction, { id: transaction.user_id, email: 'fetched-in-receipt-step' });
    } catch (err) {
      console.error('Receipt generation failed:', err);
    }

    // Email Simulation Log
    try {
      const { data: user } = await this.supabase.from('users').select('email').eq('id', transaction.user_id).single();
      if (user?.email) {
        console.log(`[EMAIL LOG] Sent ${transaction.type} confirmation to ${user.email} for ${transaction.amount} ${transaction.currency}`);
      }
    } catch (err) {
      console.error('Email log failed:', err);
    }
  }
}

const transactionService = new TransactionService(supabase);
export default transactionService;
