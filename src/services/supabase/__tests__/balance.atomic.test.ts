import { describe, it, expect, vi, beforeEach } from 'vitest';
import transactionService from '../transaction.service';
import { supabase } from '../supabase';

// Mock Supabase client
vi.mock('../supabase', () => ({
    supabase: {
        rpc: vi.fn(),
        from: vi.fn(), // Should not be called for balance
    }
}));

describe('TransactionService - Atomic Balance Calculation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should use atomic database RPC to fetch balance', async () => {
        const mockBalanceDetails = {
            balance: 5000,
            pendingWithdrawals: 1000,
            pendingInvestments: 500,
            availableToWithdraw: 3500
        };

        // Correctly mock the RPC resolution
        // .rpc() usually returns { data, error }
        (supabase.rpc as any).mockResolvedValue({
            data: mockBalanceDetails,
            error: null
        });

        const result = await transactionService.getUserAvailableBalance('user_123');

        // Expectation: The service calls the RPC 'get_user_balance_details'
        expect(supabase.rpc).toHaveBeenCalledWith('get_user_balance_details', {
            p_user_id: 'user_123'
        });

        // Expectation: The result matches the RPC data
        expect(result).toEqual(mockBalanceDetails);
    });
});
