import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/confirm-payment/route';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import transactionService from '@/services/supabase/transaction.service';

// Mock services
vi.mock('@/services/supabase/supabase-admin', () => ({
    supabaseAdmin: {
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn(),
    },
}));

vi.mock('@/services/supabase/transaction.service');
vi.mock('server-only', () => ({}));

describe('Confirm Payment Endpoint', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should reject non-admin users', async () => {
        // Mock user as non-admin
        (supabaseAdmin.auth.getUser as any).mockResolvedValue({
            data: { user: { id: 'user_123', email: 'user@example.com' } },
            error: null,
        });

        const mockSelect = vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                    data: { role: 'user' }, // Not admin
                    error: null,
                }),
            }),
        });

        // .from() returns an object which has .select() method
        (supabaseAdmin.from as any).mockReturnValue({ select: mockSelect });

        const req = new Request('http://localhost/api/confirm-payment', {
            method: 'POST',
            headers: { authorization: 'Bearer token' },
            body: JSON.stringify({ transactionId: 'tx_1' }),
        });

        const res = await POST(req as any);
        const body = await res.json();

        expect(res.status).toBe(403);
        expect(body.error).toContain('Admin access required');
    });

    it('should allow admin users', async () => {
        // Mock user as admin
        (supabaseAdmin.auth.getUser as any).mockResolvedValue({
            data: { user: { id: 'admin_123', email: 'admin@example.com' } },
            error: null,
        });

        // Mock DB calls for user role and transaction lookup
        const mockFrom = vi.fn();
        (supabaseAdmin.from as any).mockImplementation(mockFrom);

        // Mock checks: 1. check role
        mockFrom.mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
                }),
            }),
        });

        // Mock checks: 2. get transaction
        mockFrom.mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        single: vi.fn().mockResolvedValue({
                            data: {
                                id: 'tx_1',
                                user_id: 'user_target',
                                status: 'pending',
                                provider: 'bank_transfer',
                                type: 'investment'
                            },
                            error: null,
                        }),
                    }),
                }),
            }),
        });

        // Mock successful update
        (transactionService.updateTransactionStatus as any).mockResolvedValue({ id: 'tx_1', status: 'completed' });

        const req = new Request('http://localhost/api/confirm-payment', {
            method: 'POST',
            headers: { authorization: 'Bearer token' },
            body: JSON.stringify({ transactionId: 'tx_1' }),
        });

        const res = await POST(req as any);

        expect(res.status).toBe(200);
        expect(transactionService.updateTransactionStatus).toHaveBeenCalledWith(
            'user_target',
            'tx_1',
            'completed',
            expect.objectContaining({ note: expect.stringContaining('admin admin@example.com') })
        );
    });
});
