import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock server-only to prevent errors
vi.mock('server-only', () => { return {}; });

import { POST } from '@/app/api/webhooks/paystack/route';
import { webhookService } from '@/services/supabase/webhook.service';
import { paymentService } from '@/services/payments/payment.service';
import transactionService from '@/services/supabase/transaction.service';

// Mock services
vi.mock('@/services/supabase/webhook.service');
vi.mock('@/services/payments/payment.service');
vi.mock('@/services/supabase/transaction.service');

describe('Paystack Webhook Idempotency', () => {
    const mockEvent = {
        event: 'charge.success',
        data: {
            id: 12345,
            reference: 'ref_123',
            amount: 10000,
            metadata: { userId: 'user_1' }
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (paymentService.processWebhook as any).mockResolvedValue(true);
    });

    it('should process new unique events', async () => {
        // Mock webhookService to return it's a new event
        (webhookService.recordEvent as any).mockResolvedValue({ id: 'wh_1', isNew: true, status: 'pending' });
        (transactionService.updateTransactionStatus as any).mockResolvedValue({ id: 'tx_1' });

        const req = new Request('http://localhost/api/webhooks/paystack', {
            method: 'POST',
            body: JSON.stringify(mockEvent),
            headers: { 'x-paystack-signature': 'valid' }
        });

        const res = await POST(req as any);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body).toEqual({ received: true });

        // Should verify transaction status was updated
        expect(transactionService.updateTransactionStatus).toHaveBeenCalled();
        // Should update webhook status to processed
        expect(webhookService.updateEventStatus).toHaveBeenCalledWith('wh_1', 'processed', expect.anything());
    });

    it('should ignore duplicate processed events', async () => {
        // Mock webhookService to return it's NOT new and ALREADY processed
        (webhookService.recordEvent as any).mockResolvedValue({ id: 'wh_1', isNew: false, status: 'processed' });

        const req = new Request('http://localhost/api/webhooks/paystack', {
            method: 'POST',
            body: JSON.stringify(mockEvent),
            headers: { 'x-paystack-signature': 'valid' }
        });

        const res = await POST(req as any);

        expect(res.status).toBe(200);

        // CRITICAL: Should NOT call updateTransactionStatus again
        expect(transactionService.updateTransactionStatus).not.toHaveBeenCalled();
        expect(webhookService.updateEventStatus).not.toHaveBeenCalled();
    });
});
