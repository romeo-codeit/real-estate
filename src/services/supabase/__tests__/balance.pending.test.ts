import { describe, it, expect, vi, beforeEach } from 'vitest';
import transactionService from '../transaction.service';
import { supabase } from '../supabase';

// Mock Supabase client
vi.mock('../supabase', () => ({
    supabase: {
        rpc: vi.fn(),
    }
}));

describe('TransactionService - Pending Investment Reservation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should reflect pending investments in available balance', async () => {
        // Scenario: User has 5000 settled, but has 500 in pending investments
        // Available should be 5000 - 500 = 4500
        const mockBalanceDetails = {
            balance: 5000,
            pendingWithdrawals: 0,
            pendingInvestments: 500,
            availableToWithdraw: 4500
        };

        (supabase.rpc as any).mockResolvedValue({
            data: mockBalanceDetails,
            error: null
        });

        const result = await transactionService.getUserAvailableBalance('user_123');

        // Identify that we are correctly parsing the pendingInvestments field
        expect(result.pendingInvestments).toBe(500);
        expect(result.availableToWithdraw).toBe(4500);

        // Ensure the RPC call was made correctly
        expect(supabase.rpc).toHaveBeenCalledWith('get_user_balance_details', {
            p_user_id: 'user_123'
        });
    });
});
