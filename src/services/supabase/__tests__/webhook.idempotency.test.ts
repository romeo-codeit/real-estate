import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookService, IdempotencyResult } from '@/services/supabase/webhook.service';

// Mock supabaseAdmin
vi.mock('@/services/supabase/supabase-admin', () => ({
    supabaseAdmin: {
        from: vi.fn(() => ({
            upsert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
        })),
    },
}));

vi.mock('server-only', () => ({}));

import { supabaseAdmin } from '@/services/supabase/supabase-admin';

describe('WebhookService Idempotency', () => {
    let service: WebhookService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new WebhookService();
    });

    describe('IdempotencyResult type', () => {
        it('should define shouldProcess true result', () => {
            const result: IdempotencyResult = {
                shouldProcess: true,
                webhookId: 'test-id',
                isRetry: false
            };
            expect(result.shouldProcess).toBe(true);
        });

        it('should define shouldProcess false with already_processed reason', () => {
            const result: IdempotencyResult = {
                shouldProcess: false,
                reason: 'already_processed'
            };
            expect(result.shouldProcess).toBe(false);
            expect(result.reason).toBe('already_processed');
        });

        it('should define shouldProcess false with currently_processing reason', () => {
            const result: IdempotencyResult = {
                shouldProcess: false,
                reason: 'currently_processing'
            };
            expect(result.shouldProcess).toBe(false);
            expect(result.reason).toBe('currently_processing');
        });
    });

    describe('isEventProcessed', () => {
        it('should return true for processed events', async () => {
            const mockFrom = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { status: 'processed' }, error: null })
            });
            (supabaseAdmin.from as any) = mockFrom;

            const result = await service.isEventProcessed('paystack', 'evt_123');
            expect(result).toBe(true);
        });

        it('should return false for pending events', async () => {
            const mockFrom = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: { status: 'pending' }, error: null })
            });
            (supabaseAdmin.from as any) = mockFrom;

            const result = await service.isEventProcessed('paystack', 'evt_123');
            expect(result).toBe(false);
        });

        it('should return false for non-existent events', async () => {
            const mockFrom = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: null })
            });
            (supabaseAdmin.from as any) = mockFrom;

            const result = await service.isEventProcessed('paystack', 'evt_nonexistent');
            expect(result).toBe(false);
        });
    });

    describe('recordEvent', () => {
        it('should return existing event if already recorded', async () => {
            const existingEvent = { id: 'existing-id', status: 'pending' };
            const mockFrom = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: existingEvent, error: null }),
                insert: vi.fn().mockReturnThis(),
            });
            (supabaseAdmin.from as any) = mockFrom;

            const result = await service.recordEvent('paystack', 'evt_123', 'charge.success', {});
            expect(result.id).toBe('existing-id');
            expect(result.isNew).toBe(false);
        });
    });

    describe('markProcessed', () => {
        it('should update event with processed status', async () => {
            const mockUpdate = vi.fn().mockReturnThis();
            const mockEq = vi.fn().mockReturnThis();
            const mockFrom = vi.fn().mockReturnValue({
                update: mockUpdate,
                eq: vi.fn().mockResolvedValue({ error: null }),
            });
            (supabaseAdmin.from as any) = mockFrom;

            await expect(service.markProcessed('webhook-id', {
                transaction_id: 'txn-123',
                provider_txn_id: 'provider-123'
            })).resolves.not.toThrow();

            expect(mockFrom).toHaveBeenCalledWith('webhook_events');
        });
    });

    describe('markFailed', () => {
        it('should update event with failed status and error message', async () => {
            const mockFrom = vi.fn().mockReturnValue({
                update: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ error: null }),
            });
            (supabaseAdmin.from as any) = mockFrom;

            await expect(service.markFailed('webhook-id', 'Processing error'))
                .resolves.not.toThrow();

            expect(mockFrom).toHaveBeenCalledWith('webhook_events');
        });
    });

    describe('Idempotency behavior', () => {
        it('should prevent double processing of same event', async () => {
            // First call - event processed
            const mockFrom1 = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: { id: 'evt-1', status: 'processed' },
                    error: null
                })
            });
            (supabaseAdmin.from as any) = mockFrom1;

            const result1 = await service.isEventProcessed('paystack', 'evt_123');
            expect(result1).toBe(true);

            // Second call with same event - should also show processed
            const result2 = await service.isEventProcessed('paystack', 'evt_123');
            expect(result2).toBe(true);
        });

        it('should handle concurrent processing attempts', async () => {
            // Simulate event already being processed
            const mockFrom = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: { id: 'evt-1', status: 'processing' },
                    error: null
                })
            });
            (supabaseAdmin.from as any) = mockFrom;

            const result = await service.isEventProcessed('paystack', 'evt_123');
            // Should not be marked as processed yet
            expect(result).toBe(false);
        });
    });

    describe('Retry behavior', () => {
        it('should allow retry of failed events', async () => {
            // First check shows failed status
            const mockFrom = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: { id: 'evt-1', status: 'failed', retry_count: 1 },
                    error: null
                })
            });
            (supabaseAdmin.from as any) = mockFrom;

            const isProcessed = await service.isEventProcessed('paystack', 'evt_123');
            // Failed events are not "processed" so they can be retried
            expect(isProcessed).toBe(false);
        });
    });
});
