import { supabaseAdmin } from './supabase-admin';

export interface WebhookEvent {
    id: string;
    provider: string;
    event_id: string;
    event_type: string;
    status: 'pending' | 'processing' | 'processed' | 'failed';
    transaction_id?: string;
    provider_txn_id?: string;
    target_status?: string;
    error_message?: string;
    retry_count: number;
    payload: any;
    created_at: string;
    updated_at: string;
    processed_at?: string;
}

export type IdempotencyResult =
    | { shouldProcess: true; webhookId: string; isRetry: boolean }
    | { shouldProcess: false; reason: 'already_processed' | 'currently_processing' };

export class WebhookService {
    /**
     * Attempts to acquire a processing lock for a webhook event.
     * Uses upsert with atomic status transition for proper idempotency.
     * 
     * @returns Object indicating whether to proceed and the webhook record ID
     */
    async acquireEventLock(
        provider: string,
        eventId: string,
        eventType: string,
        payload: any
    ): Promise<IdempotencyResult> {
        // First, try to insert the event (if it doesn't exist)
        const { data: inserted, error: insertError } = await supabaseAdmin
            .from('webhook_events')
            .upsert({
                provider,
                event_id: eventId,
                event_type: eventType,
                payload,
                status: 'processing',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'provider,event_id',
                ignoreDuplicates: true // Don't update if exists
            })
            .select('id, status')
            .single();

        // If insert succeeded, we got the lock
        if (inserted && inserted.status === 'processing') {
            return { shouldProcess: true, webhookId: inserted.id, isRetry: false };
        }

        // Check existing record
        const { data: existing } = await supabaseAdmin
            .from('webhook_events')
            .select('id, status, retry_count')
            .eq('provider', provider)
            .eq('event_id', eventId)
            .single();

        if (!existing) {
            // Race condition - try again
            return this.acquireEventLock(provider, eventId, eventType, payload);
        }

        // Already processed - skip
        if (existing.status === 'processed') {
            return { shouldProcess: false, reason: 'already_processed' };
        }

        // Currently being processed by another worker
        if (existing.status === 'processing') {
            return { shouldProcess: false, reason: 'currently_processing' };
        }

        // Status is 'failed' or 'pending' - attempt to acquire lock for retry
        const { data: updated, error: updateError } = await supabaseAdmin
            .from('webhook_events')
            .update({
                status: 'processing',
                retry_count: (existing.retry_count || 0) + 1,
                updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
            .eq('status', existing.status!) // Optimistic lock
            .select('id')
            .single();

        if (updated) {
            return { shouldProcess: true, webhookId: existing.id, isRetry: true };
        }

        // Another worker grabbed it
        return { shouldProcess: false, reason: 'currently_processing' };
    }

    /**
     * Checks if a webhook event has already been processed.
     * @deprecated Use acquireEventLock instead for proper idempotency
     */
    async isEventProcessed(provider: string, eventId: string): Promise<boolean> {
        const { data } = await supabaseAdmin
            .from('webhook_events')
            .select('status')
            .eq('provider', provider)
            .eq('event_id', eventId)
            .single();

        return data?.status === 'processed';
    }

    /**
     * Records a new webhook event or returns existing one.
     * @deprecated Use acquireEventLock for proper atomic locking
     */
    async recordEvent(
        provider: string,
        eventId: string,
        eventType: string,
        payload: any
    ): Promise<{ id: string; status: string; isNew: boolean }> {
        // Check for existing
        const { data: existing } = await supabaseAdmin
            .from('webhook_events')
            .select('id, status')
            .eq('provider', provider)
            .eq('event_id', eventId)
            .single();

        if (existing) {
            return { id: existing.id, status: existing.status!, isNew: false };
        }

        // Insert new
        const { data: newEvent, error } = await supabaseAdmin
            .from('webhook_events')
            .insert({
                provider,
                event_id: eventId,
                event_type: eventType,
                payload,
                status: 'pending'
            })
            .select('id, status')
            .single();

        if (error) {
            // Handle potential race condition if inserted between check and insert
            if (error.code === '23505') { // Unique constraint violation
                return this.recordEvent(provider, eventId, eventType, payload);
            }
            throw error;
        }

        return { id: newEvent.id, status: newEvent.status!, isNew: true };
    }

    /**
     * Marks event as successfully processed.
     */
    async markProcessed(
        webhookId: string,
        details: {
            transaction_id?: string;
            provider_txn_id?: string;
            target_status?: string;
        } = {}
    ): Promise<void> {
        const { error } = await supabaseAdmin
            .from('webhook_events')
            .update({
                status: 'processed',
                processed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                ...details
            })
            .eq('id', webhookId);

        if (error) throw error;
    }

    /**
     * Marks event as failed.
     */
    async markFailed(
        webhookId: string,
        errorMessage: string
    ): Promise<void> {
        const { error } = await supabaseAdmin
            .from('webhook_events')
            .update({
                status: 'failed',
                error_message: errorMessage,
                updated_at: new Date().toISOString()
            })
            .eq('id', webhookId);

        if (error) throw error;
    }

    /**
     * Updates the status of a webhook event.
     * @deprecated Use markProcessed or markFailed instead
     */
    async updateEventStatus(
        id: string,
        status: 'processed' | 'failed',
        updates: {
            transaction_id?: string;
            provider_txn_id?: string;
            target_status?: string;
            error_message?: string;
        } = {}
    ) {
        const { error } = await supabaseAdmin
            .from('webhook_events')
            .update({
                status,
                ...updates,
                updated_at: new Date().toISOString(),
                ...(status === 'processed' ? { processed_at: new Date().toISOString() } : {})
            })
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * Gets event by provider and event ID.
     */
    async getEvent(provider: string, eventId: string): Promise<WebhookEvent | null> {
        const { data } = await supabaseAdmin
            .from('webhook_events')
            .select('*')
            .eq('provider', provider)
            .eq('event_id', eventId)
            .single();

        return data as WebhookEvent | null;
    }
}

export const webhookService = new WebhookService();
