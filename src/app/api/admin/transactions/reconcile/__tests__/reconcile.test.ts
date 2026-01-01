import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies
vi.mock('@/services/supabase/supabase-admin', () => ({
    supabaseAdmin: {
        auth: {
            getUser: vi.fn(),
        },
        from: vi.fn(),
    },
}));

vi.mock('@/services/supabase/transaction.service', () => ({
    default: {
        createTransaction: vi.fn(),
        updateTransactionStatus: vi.fn(),
    },
}));

vi.mock('@/services/supabase/audit.service', () => ({
    default: {
        logAuditEvent: vi.fn(),
    },
}));

vi.mock('@/lib/rateLimit', () => ({
    checkRateLimit: vi.fn().mockReturnValue({ ok: true }),
}));

import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import transactionService from '@/services/supabase/transaction.service';

describe('Admin Transactions Reconcile API', () => {
    let mockRequest: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockRequest = {
            headers: {
                get: vi.fn(),
            },
            json: vi.fn(),
        };
    });

    // Helper to simulate admin auth
    const setupAdminAuth = () => {
        mockRequest.headers.get.mockReturnValue('Bearer token123');
        (supabaseAdmin.auth.getUser as any).mockResolvedValue({
            data: { user: { id: 'admin123' } }, error: null
        });
        (supabaseAdmin.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
                data: { roles: [{ name: 'admin' }] }, error: null
            }),
        });
    };

    it('should return 401 if unauthorized', async () => {
        mockRequest.headers.get.mockReturnValue(null);
        const response = await POST(mockRequest as NextRequest);
        expect(response.status).toBe(401);
    });

    it('should support transaction cancellation', async () => {
        setupAdminAuth();
        mockRequest.json.mockResolvedValue({
            transactionId: 'txn-123',
            action: 'cancel',
            note: 'Admin cancelled',
        });

        // Mock transaction lookup
        const mockTxn = { id: 'txn-123', user_id: 'user-1', status: 'pending', amount: 100 };
        const mockFrom = vi.fn().mockImplementation((table: string) => {
            if (table === 'transactions') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: mockTxn, error: null }),
                };
            }
            return { // user_roles check
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { roles: [{ name: 'admin' }] }, error: null }),
            };
        });
        (supabaseAdmin.from as any) = mockFrom;

        // Mock update status
        (transactionService.updateTransactionStatus as any).mockResolvedValue({ ...mockTxn, status: 'failed' });

        const response = await POST(mockRequest as NextRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(transactionService.updateTransactionStatus).toHaveBeenCalledWith(
            'user-1', 'txn-123', 'failed', expect.objectContaining({ method: 'admin_cancel' })
        );
    });

    it('should reject cancelling non-pending transactions', async () => {
        setupAdminAuth();
        mockRequest.json.mockResolvedValue({
            transactionId: 'txn-completed',
            action: 'cancel',
        });

        const mockTxn = { id: 'txn-completed', user_id: 'user-1', status: 'completed' };
        (supabaseAdmin.from as any).mockImplementation((table: string) => {
            if (table === 'transactions') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: mockTxn, error: null }),
                }
            }
            return { // user_roles
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { roles: [{ name: 'admin' }] }, error: null }),
            };
        });

        const response = await POST(mockRequest as NextRequest);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('Only pending');
    });

    it('should support refunds', async () => {
        setupAdminAuth();
        mockRequest.json.mockResolvedValue({
            transactionId: 'txn-123',
            action: 'refund',
            amount: 50
        });

        const mockTxn = { id: 'txn-123', user_id: 'user-1', status: 'completed', amount: 100, currency: 'USD' };
        (supabaseAdmin.from as any).mockImplementation((table: string) => {
            if (table === 'transactions') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: mockTxn, error: null }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { roles: [{ name: 'admin' }] }, error: null }),
            };
        });

        (transactionService.createTransaction as any).mockResolvedValue({ id: 'refund-1' });

        const response = await POST(mockRequest as NextRequest);
        expect(response.status).toBe(200);
        expect(transactionService.createTransaction).toHaveBeenCalledWith(expect.objectContaining({
            type: 'refund',
            amount: 50
        }));
    });

    it('should support adjustments', async () => {
        setupAdminAuth();
        mockRequest.json.mockResolvedValue({
            transactionId: 'txn-123',
            action: 'adjust',
            amount: 20,
            direction: 'credit'
        });

        const mockTxn = { id: 'txn-123', user_id: 'user-1', status: 'completed', amount: 100 };
        (supabaseAdmin.from as any).mockImplementation((table: string) => {
            if (table === 'transactions') {
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: mockTxn, error: null }),
                };
            }
            return {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { roles: [{ name: 'admin' }] }, error: null }),
            };
        });

        (transactionService.createTransaction as any).mockResolvedValue({ id: 'adj-1' });

        const response = await POST(mockRequest as NextRequest);
        expect(response.status).toBe(200);
        expect(transactionService.createTransaction).toHaveBeenCalledWith(expect.objectContaining({
            type: 'payout', // credit = payout
            amount: 20
        }));
    });
});
