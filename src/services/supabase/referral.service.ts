import { supabase } from './supabase';
import { Referral, ReferralStats, ReferralCommission } from '@/lib/types';

export class ReferralService {
  /**
   * Generate or retrieve a unique referral code for a user
   */
  static async generateReferralCode(userId: string): Promise<string> {
    try {
      // 1. Check if user already has a code in profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', userId)
        .single();

      if (profile?.referral_code) {
        return profile.referral_code;
      }

      // 2. Generate new code
      const code = `REF${userId.slice(0, 8).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // 3. Try checking collision (though unique constraint on update will catch it too)
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', code)
        .single();

      if (existing) {
        return this.generateReferralCode(userId); // Retry
      }

      // 4. Save to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ referral_code: code })
        .eq('id', userId);

      if (updateError) {
        console.error('Error saving referral code:', updateError);
        // If error is uniqueness violation, retry
        if (updateError.code === '23505') {
          return this.generateReferralCode(userId);
        }
        throw updateError;
      }

      return code;
    } catch (error) {
      console.error('Error generating referral code:', error);
      throw error;
    }
  }

  /**
   * Create a referral record when someone signs up with a referral code
   */
  static async createReferral(referrerCode: string, refereeId: string): Promise<Referral | null> {
    try {
      // 1. Find the referrer by their code
      const { data: referrerProfile, error: referrerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referrerCode)
        .single();

      if (referrerError || !referrerProfile) {
        console.warn('Invalid referral code used:', referrerCode);
        return null;
      }

      const referrerId = referrerProfile.id;

      // 2. Check self-referral
      if (referrerId === refereeId) {
        console.warn('Self-referral attempted:', refereeId);
        return null;
      }

      // 3. Check if referee already has a referral
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referee_id', refereeId)
        .single();

      if (existingReferral) {
        return null; // Already referred
      }

      // 4. Create the referral record
      const { data, error } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referee_id: refereeId,
          referral_code_snapshot: referrerCode,
          status: 'registered',
          metadata: {
            signup_date: new Date().toISOString(),
            source: 'referral_link'
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating referral:', error);
        return null;
      }

      return data as any;
    } catch (error) {
      console.error('Error in createReferral:', error);
      return null;
    }
  }

  /**
   * Update referral status when referee makes first investment
   */
  static async updateReferralOnInvestment(refereeId: string, investmentAmount: number): Promise<void> {
    try {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id, status')
        .eq('referee_id', refereeId)
        .single();

      if (!referral || referral.status !== 'registered') {
        return; // No referral or already processed
      }

      const commissionAmount = investmentAmount * 0.05; // 5% commission const

      const { error } = await supabase
        .from('referrals')
        .update({
          status: 'invested',
          first_investment_amount: investmentAmount,
          first_investment_date: new Date().toISOString(),
          commission_amount: commissionAmount,
          metadata: {
            first_investment_processed: true,
            commission_rate: 0.05
          }
        })
        .eq('id', referral.id);

      if (error) {
        console.error('Error updating referral on investment:', error);
      }
    } catch (error) {
      console.error('Error in updateReferralOnInvestment:', error);
    }
  }

  /**
   * Mark referral as completed (after commission is paid)
   */
  static async completeReferral(referralId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('referrals')
        .update({
          status: 'completed',
          commission_paid: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', referralId);

      if (error) {
        console.error('Error completing referral:', error);
      }
    } catch (error) {
      console.error('Error in completeReferral:', error);
    }
  }

  /**
   * Get referral statistics for a user
   */
  static async getReferralStats(userId: string): Promise<ReferralStats> {
    try {
      // Fetch user's referral code first
      const code = await this.generateReferralCode(userId);

      const { data: referrals, error } = await supabase
        .from('referrals')
        .select(`
          id,
          status,
          commission_amount,
          commission_paid
        `)
        .eq('referrer_id', userId);

      if (error) {
        console.error('Error fetching referral stats:', error);
        return this.getEmptyStats(userId);
      }

      const stats = referrals.reduce(
        (acc, referral) => {
          acc.totalReferrals++;
          switch (referral.status) {
            case 'pending':
              acc.pendingReferrals++;
              break;
            case 'registered':
              acc.registeredReferrals++;
              break;
            case 'invested':
              acc.investedReferrals++;
              break;
            case 'completed':
              acc.completedReferrals++;
              break;
          }

          if (referral.commission_paid) {
            acc.totalCommissionEarned += referral.commission_amount || 0;
          } else {
            acc.pendingCommission += referral.commission_amount || 0;
          }

          return acc;
        },
        {
          totalReferrals: 0,
          pendingReferrals: 0,
          registeredReferrals: 0,
          investedReferrals: 0,
          completedReferrals: 0,
          totalCommissionEarned: 0,
          pendingCommission: 0,
          referralCode: code,
          referralLink: ''
        }
      );

      const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup?ref=${code}`;

      return {
        ...stats,
        referralCode: code,
        referralLink
      };
    } catch (error) {
      console.error('Error in getReferralStats:', error);
      return this.getEmptyStats(userId);
    }
  }

  /**
   * Get referrals for a user (with referee details)
   */
  static async getUserReferrals(userId: string): Promise<Referral[]> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referee:profiles!referrals_referee_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user referrals:', error);
        return [];
      }

      // Map the response to match the expected Referral type if needed, 
      // primarily mapping nested referee relation
      return data.map((r: any) => ({
        ...r,
        referee_email: r.referee?.email, // Flatten for backward compat if needed
        referral_code: r.referral_code_snapshot
      })) as unknown as Referral[];
    } catch (error) {
      console.error('Error in getUserReferrals:', error);
      return [];
    }
  }

  /**
   * Process commission payment for completed referrals
   */
  static async processCommissionPayments(): Promise<void> {
    // Implementation remains largely same, just ensuring column names
    // ... (Previous logic for bulk processing)
    try {
      const { data: pendingReferrals, error } = await supabase
        .from('referrals')
        .select('id, referrer_id, commission_amount')
        .eq('status', 'invested')
        .eq('commission_paid', false);

      if (error || !pendingReferrals) return;

      for (const referral of pendingReferrals) {
        await this.processCommissionForReferral(referral.id);
      }
    } catch (error) {
      console.error('Error bulk processing commissions:', error);
    }
  }

  /**
   * Process commission payment for a single referral by id.
   */
  static async processCommissionForReferral(referralId: string): Promise<boolean> {
    try {
      const { data: referral, error: rError } = await supabase
        .from('referrals')
        .select('id, referrer_id, commission_amount, status, commission_paid')
        .eq('id', referralId)
        .single();

      if (rError || !referral) {
        return false;
      }

      if (referral.status !== 'invested' || referral.commission_paid) {
        return false;
      }

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: referral.referrer_id!,
          type: 'payout',
          amount: referral.commission_amount!,
          currency: 'USD',
          status: 'completed',
          related_object: {
            type: 'referral_commission',
            referral_id: referral.id,
          },
          metadata: {
            commission_payment: true,
            referral_id: referral.id,
            confirmation: {
              source: 'system',
              method: 'referral_commission',
              note: 'Internal referral commission payout',
              status: 'completed',
              at: new Date().toISOString(),
            },
          },
        });

      if (transactionError) {
        console.error('Error creating commission transaction:', transactionError);
        return false;
      }

      await this.completeReferral(referral.id);
      return true;
    } catch (error) {
      console.error('Error in processCommissionForReferral:', error);
      return false;
    }
  }

  /**
   * Validate referral code
   */
  static async validateReferralCode(code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', code)
        .single();

      return !error && !!data;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return false;
    }
  }

  private static getEmptyStats(userId: string): ReferralStats {
    return {
      totalReferrals: 0,
      pendingReferrals: 0,
      registeredReferrals: 0,
      investedReferrals: 0,
      completedReferrals: 0,
      totalCommissionEarned: 0,
      pendingCommission: 0,
      referralCode: '',
      referralLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup?ref=`
    };
  }
}