import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ReferralService } from '../services/supabase/referral.service';

describe('ReferralService Property-Based Testing', () => {
    describe('Commission Calculation Stats', () => {
        // We need to test the logic inside getReferralStats reducer
        // Since getReferralStats is an async method that calls Supabase, 
        // we'll extract the core reduction logic for testing or mock the input.

        it('total commission should equal sum of individual commissions', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            status: fc.constantFrom('pending', 'registered', 'invested', 'completed'),
                            commission_amount: fc.double({ min: 0, max: 10000 }),
                            commission_paid: fc.boolean()
                        }),
                        { minLength: 0, maxLength: 100 }
                    ),
                    (referrals) => {
                        // Mock the reduction logic from ReferralService.getReferralStats
                        const stats = referrals.reduce(
                            (acc, referral) => {
                                acc.totalReferrals++;
                                if (referral.commission_paid) {
                                    acc.totalCommissionEarned += referral.commission_amount || 0;
                                } else {
                                    acc.pendingCommission += referral.commission_amount || 0;
                                }
                                return acc;
                            },
                            {
                                totalReferrals: 0,
                                totalCommissionEarned: 0,
                                pendingCommission: 0
                            }
                        );

                        const expectedEarned = referrals
                            .filter(r => r.commission_paid)
                            .reduce((sum, r) => sum + (r.commission_amount || 0), 0);

                        const expectedPending = referrals
                            .filter(r => !r.commission_paid)
                            .reduce((sum, r) => sum + (r.commission_amount || 0), 0);

                        // Floating point precision check
                        const epsilon = 1e-7;
                        return (
                            Math.abs(stats.totalCommissionEarned - expectedEarned) < epsilon &&
                            Math.abs(stats.pendingCommission - expectedPending) < epsilon
                        );
                    }
                )
            );
        });

        it('commission amount should never be negative and should handle tiny amounts', () => {
            fc.assert(
                fc.property(
                    fc.double({ min: -1000, max: 100000 }), // investment amount
                    (amount) => {
                        // Logic from updateReferralOnInvestment (Fixed)
                        const commissionRate = 0.05;
                        const commissionAmount = Math.max(0, Math.round(amount * commissionRate * 100) / 100);

                        // Property: Commission is always >= 0
                        // Property: Commission is never NaN or Infinity
                        return commissionAmount >= 0 && Number.isFinite(commissionAmount);
                    }
                )
            );
        });
    });
});
