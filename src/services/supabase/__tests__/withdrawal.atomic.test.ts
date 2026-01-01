import { describe, it, expect, vi, beforeEach } from 'vitest';
import transactionService from '../transaction.service';
import { supabase } from '../supabase';

// Mock Supabase client
vi.mock('../supabase', () => ({
    supabase: {
        rpc: vi.fn(),
    }
}));

describe('TransactionService - Atomic Withdrawal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call atomic RPC for withdrawal', async () => {
        const withdrawalData = {
            user_id: 'user_123',
            amount: 100,
            currency: 'USD',
            provider: 'crypto',
            metadata: { wallet: '0x123' }
        };

        // Mock successful response
        (supabase.rpc as any).mockResolvedValue({
            data: { id: 'tx_123', status: 'pending', amount: 100 },
            error: null
        });

        const result = await transactionService.createWithdrawal(withdrawalData);

        expect(supabase.rpc).toHaveBeenCalledWith('request_withdrawal', expect.objectContaining({
            p_user_id: withdrawalData.user_id,
            p_amount: withdrawalData.amount,
            p_provider: withdrawalData.provider
        }));

        expect(result).toEqual({ id: 'tx_123', status: 'pending', amount: 100 });
    });

    it('should throw error if RPC fails (e.g. insufficient funds)', async () => {
        const withdrawalData = {
            user_id: 'user_123',
            amount: 1000000,
            currency: 'USD',
            provider: 'crypto'
        };

        // Mock error response
        (supabase.rpc as any).mockResolvedValue({
            data: null,
            error: { message: 'Insufficient funds' }
        });

        await expect(transactionService.createWithdrawal(withdrawalData))
            .rejects.toEqual({ message: 'Insufficient funds' });
    });
});
