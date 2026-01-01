import { describe, it, expect, vi, beforeEach } from 'vitest';
import investmentService from '../investment.service';
import { supabase } from '../supabase';

// Mock Supabase client
vi.mock('../supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            insert: vi.fn(() => ({
                select: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: { id: 'inv_123' }, error: null })
                }))
            })),
            update: vi.fn(() => ({
                eq: vi.fn(() => ({
                    select: vi.fn(() => ({
                        single: vi.fn().mockResolvedValue({ data: {}, error: null })
                    }))
                }))
            })),
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: {}, error: null })
                })),
                order: vi.fn()
            }))
        })),
        rpc: vi.fn().mockResolvedValue({ data: { id: 'inv_123' }, error: null })
    }
}));

// Mock getInvestmentById to return a dummy object
vi.spyOn(investmentService, 'getInvestmentById').mockResolvedValue({ id: 'inv_123' } as any);

describe('InvestmentService - Concurrency & Atomicity', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should use atomic database function to create investment', async () => {
        const investmentData = {
            user_id: 'user_123',
            sanity_id: 'prop_123',
            amount_invested: 1000,
            investment_type: 'property',
            status: 'pending',
            roi_rate: 5,
            duration_months: 12,
            start_date: '2025-01-01T00:00:00Z'
        };

        // Attempt to create investment
        // The service should now call the atomic RPC function
        await investmentService.createInvestment(investmentData as any);

        // Expectation: The service should call the atomic RPC function
        expect(supabase.rpc).toHaveBeenCalledWith('reserve_funds_for_investment', expect.objectContaining({
            p_user_id: investmentData.user_id,
            p_amount: investmentData.amount_invested,
            p_sanity_id: investmentData.sanity_id,
            p_investment_type: investmentData.investment_type
        }));
    });
});
