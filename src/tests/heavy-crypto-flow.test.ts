import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted for the mock data to ensure it's available before vi.mock calls
const { mockSupabase } = vi.hoisted(() => {
    return {
        mockSupabase: {
            auth: {
                admin: {
                    createUser: vi.fn(),
                    listUsers: vi.fn(),
                },
            },
            from: vi.fn(() => ({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        single: vi.fn(),
                    })),
                    single: vi.fn(),
                })),
                insert: vi.fn(() => ({
                    select: vi.fn(() => ({
                        single: vi.fn(),
                    })),
                })),
                update: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        select: vi.fn(() => ({
                            single: vi.fn(),
                        })),
                    })),
                })),
            })),
            rpc: vi.fn(),
        }
    };
});

// Mock the Supabase modules BEFORE importing services that use them
vi.mock('@/services/supabase/supabase-admin', () => ({
    supabaseAdmin: mockSupabase,
}));

vi.mock('@/services/supabase/supabase', () => ({
    supabase: mockSupabase,
}));

vi.mock('@/services/supabase/notification.service', () => ({
    default: {
        createNotification: vi.fn().mockResolvedValue({ data: {}, error: null }),
    }
}));

// Mock receiptService too
vi.mock('@/services/receipt.service', () => ({
    receiptService: {
        generateReceipt: vi.fn().mockReturnValue({ transactionId: 'tx-123' }),
    }
}));

// Now import the services
import transactionService from '@/services/supabase/transaction.service';
import { receiptService } from '@/services/receipt.service';
import notificationService from '@/services/supabase/notification.service';

describe('Manual Crypto Flow - Business Logic Verification', () => {
    const testUserId = 'user-123';
    const testEmail = 'test@example.com';

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock successful transaction creation
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'transactions') {
                return {
                    insert: vi.fn((data) => ({
                        select: vi.fn(() => ({
                            single: vi.fn().mockResolvedValue({
                                data: { ...data, id: 'tx-123', status: data.status || 'pending' },
                                error: null
                            }),
                        })),
                    })),
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            single: vi.fn().mockResolvedValue({
                                data: {
                                    id: 'tx-123',
                                    user_id: testUserId,
                                    status: 'pending',
                                    amount: 1000,
                                    type: 'deposit',
                                    provider: 'crypto',
                                    provider_txn_id: 'crypto-tx-123'
                                },
                                error: null
                            }),
                        })),
                    })),
                    update: vi.fn((updates) => ({
                        eq: vi.fn(() => ({
                            select: vi.fn(() => ({
                                single: vi.fn().mockResolvedValue({
                                    data: {
                                        id: 'tx-123',
                                        status: updates.status || 'completed',
                                        amount: 1000,
                                        user_id: testUserId,
                                        type: 'deposit'
                                    },
                                    error: null
                                }),
                            })),
                        })),
                    })),
                };
            }
            if (table === 'users') {
                return {
                    select: vi.fn(() => ({
                        eq: vi.fn(() => ({
                            single: vi.fn().mockResolvedValue({ data: { email: testEmail }, error: null }),
                        })),
                    })),
                };
            }
            return {
                select: vi.fn(() => ({ eq: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: {}, error: null }) })) })),
            };
        });

        mockSupabase.rpc.mockResolvedValue({ data: { balance: 1000 }, error: null });
    });

    it('should successfully update transaction status and trigger receipt/notification simulation', async () => {
        const logSpy = vi.spyOn(console, 'log');
        const receiptSpy = vi.spyOn(receiptService, 'generateReceipt');

        // 1. Initiate
        const tx = await transactionService.createTransaction({
            user_id: testUserId,
            type: 'deposit',
            amount: 1000,
            provider: 'crypto',
            provider_txn_id: 'crypto-tx-123'
        });

        expect(tx.status).toBe('pending');

        // 2. Confirm (Admin action)
        const updated = await transactionService.updateTransactionStatus(
            testUserId,
            'crypto-tx-123',
            'completed',
            { source: 'manual_confirm', method: 'crypto' }
        );

        expect(updated.status).toBe('completed');

        // 3. Verify side effects
        expect(receiptSpy).toHaveBeenCalled();

        // Verify system logs (mocked email and receipt generation)
        const logs = logSpy.mock.calls.map(args => args[0].toString());
        expect(logs.some(l => l.includes('[SYSTEM] Transaction tx-123 completed'))).toBe(true);
        expect(logs.some(l => l.includes('[EMAIL LOG] Would have sent deposit confirmation'))).toBe(true);

        logSpy.mockRestore();
    });
});
