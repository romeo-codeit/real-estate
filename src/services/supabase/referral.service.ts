import { supabase } from './supabase';
import { Referral, ReferralStats, ReferralCommission } from '@/lib/types';

export class ReferralService {
  /**
   * Generate a unique referral code for a user
   */
  static async generateReferralCode(userId: string): Promise<string> {
    const code = `REF${userId.slice(0, 8).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Check if code already exists
    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referral_code', code)
      .single();

    if (existing) {
      // Recursively generate a new code if collision
      return this.generateReferralCode(userId);
    }

    return code;
  }

  /**
   * Create a referral record when someone signs up with a referral code
   */
  static async createReferral(referrerCode: string, refereeId: string): Promise<Referral | null> {
    try {
      // Find the referrer by their referral code
      const { data: referrerData, error: referrerError } = await supabase
        .from('referrals')
        .select('referrer_id')
        .eq('referral_code', referrerCode)
        .single();

      if (referrerError || !referrerData) {
        console.error('Invalid referral code:', referrerError);
        return null;
      }

      const referrerId = referrerData.referrer_id;

      // Check if referee already has a referral
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referee_id', refereeId)
        .single();

      if (existingReferral) {
        // Commented out console.log to prevent browser extension conflicts
        // console.log('User already has a referral');
        return null;
      }

      // Generate a unique referral code for the new user
      const newReferralCode = await this.generateReferralCode(refereeId);

      // Create the referral record
      const { data, error } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referee_id: refereeId,
          referral_code: newReferralCode,
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

      return data as Referral;
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
      const { data, error } = await supabase
        .from('referrals')
        .update({
          status: 'invested',
          first_investment_amount: investmentAmount,
          first_investment_date: new Date().toISOString(),
          commission_amount: investmentAmount * 0.05, // 5% commission
          metadata: {
            first_investment_processed: true,
            commission_rate: 0.05
          }
        })
        .eq('referee_id', refereeId)
        .eq('status', 'registered')
        .select()
        .single();

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
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select(`
          id,
          status,
          commission_amount,
          commission_paid,
          referral_code
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
          referralCode: '',
          referralLink: ''
        }
      );

      // Get user's referral code
      const referralCode = referrals[0]?.referral_code || await this.generateReferralCode(userId);
      const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/signup?ref=${referralCode}`;

      return {
        ...stats,
        referralCode,
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
          referee:users!referrals_referee_id_fkey (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user referrals:', error);
        return [];
      }

      return (data || []) as Referral[];
    } catch (error) {
      console.error('Error in getUserReferrals:', error);
      return [];
    }
  }

  /**
   * Process commission payment for completed referrals
   */
  static async processCommissionPayments(): Promise<void> {
    try {
      // Find referrals that are invested but not completed
      const { data: pendingReferrals, error } = await supabase
        .from('referrals')
        .select('id, referrer_id, commission_amount')
        .eq('status', 'invested')
        .eq('commission_paid', false);

      if (error) {
        console.error('Error fetching pending referrals:', error);
        return;
      }

      for (const referral of pendingReferrals || []) {
        // Create transaction record for commission
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: referral.referrer_id,
            type: 'payout',
            amount: referral.commission_amount,
            currency: 'USD',
            status: 'completed',
            related_object: {
              type: 'referral_commission',
              referral_id: referral.id
            },
            metadata: {
              commission_payment: true,
              referral_id: referral.id,
              confirmation: {
                source: 'system',
                method: 'referral_commission',
                note: 'Internal referral commission payout recorded in ledger',
                status: 'completed',
                at: new Date().toISOString(),
              }
            }
          });

        if (transactionError) {
          console.error('Error creating commission transaction:', transactionError);
          continue;
        }

        // Mark referral as completed
        await this.completeReferral(referral.id);
      }
    } catch (error) {
      console.error('Error in processCommissionPayments:', error);
    }
  }

  /**
   * Process commission payment for a single referral by id.
   * Creates a payout transaction and marks referral completed.
   */
  static async processCommissionForReferral(referralId: string): Promise<boolean> {
    try {
      const { data: referral, error: rError } = await supabase
        .from('referrals')
        .select('id, referrer_id, commission_amount, status, commission_paid')
        .eq('id', referralId)
        .single();

      if (rError || !referral) {
        console.error('Referral not found for processing:', rError);
        return false;
      }

      if (referral.status !== 'invested' || referral.commission_paid) {
        console.warn('Referral not eligible for commission processing:', referralId);
        return false;
      }

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: referral.referrer_id,
          type: 'payout',
          amount: referral.commission_amount,
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
              note: 'Internal referral commission payout recorded in ledger',
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
        .from('referrals')
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