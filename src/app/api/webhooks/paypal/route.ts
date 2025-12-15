import { NextRequest, NextResponse } from 'next/server';
import transactionService from '@/services/supabase/transaction.service';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENVIRONMENT = process.env.PAYPAL_ENVIRONMENT;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;

const PAYPAL_BASE_URL = PAYPAL_ENVIRONMENT === 'sandbox'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com';

async function getPayPalAccessToken(): Promise<string | null> {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error('PayPal client credentials are not configured');
      return null;
    }

    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      console.error('Failed to obtain PayPal access token', await response.text());
      return null;
    }

    const data: any = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error('Error obtaining PayPal access token:', error);
    return null;
  }
}

async function verifyPayPalWebhook(request: NextRequest, body: any): Promise<boolean> {
  try {
    if (!PAYPAL_WEBHOOK_ID) {
      console.error('PAYPAL_WEBHOOK_ID is not configured; refusing to accept PayPal webhooks');
      return false;
    }

    const transmissionId = request.headers.get('paypal-transmission-id');
    const transmissionTime = request.headers.get('paypal-transmission-time');
    const certUrl = request.headers.get('paypal-cert-url');
    const authAlgo = request.headers.get('paypal-auth-algo');
    const transmissionSig = request.headers.get('paypal-transmission-sig');

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      console.error('Missing PayPal webhook verification headers');
      return false;
    }

    const accessToken = await getPayPalAccessToken();
    if (!accessToken) {
      return false;
    }

    const verifyBody = {
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: PAYPAL_WEBHOOK_ID,
      webhook_event: body,
    };

    const verifyResponse = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verifyBody),
    });

    if (!verifyResponse.ok) {
      console.error('PayPal webhook verification request failed', await verifyResponse.text());
      return false;
    }

    const result: any = await verifyResponse.json();
    const status = result.verification_status;

    if (status !== 'SUCCESS') {
      console.error('PayPal webhook verification failed with status:', status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying PayPal webhook:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Strongly verify PayPal webhook signature with PayPal's API.
    const verified = await verifyPayPalWebhook(request, body);
    if (!verified) {
      return NextResponse.json({ error: 'Invalid PayPal webhook signature' }, { status: 400 });
    }

    // Handle successful payment
    if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = body.resource_links?.find((link: any) => link.rel === 'up')?.href?.split('/').pop();

      if (orderId) {
        // Find transaction by PayPal order ID stored as provider_txn_id
        const { data: transaction } = await supabaseAdmin
          .from('transactions')
          .select('*')
          .eq('provider_txn_id', orderId)
          .eq('provider', 'paypal')
          .single();

        if (transaction) {
          const updatedTransaction = await transactionService.updateTransactionStatus(
            transaction.user_id || undefined,
            orderId,
            'completed',
            {
              source: 'gateway_webhook',
              method: 'paypal',
              idempotencyKey: body.id, // PayPal webhook event ID
            }
          );

          await (supabaseAdmin as any).from('webhook_events').insert({
            provider: 'paypal',
            event_id: body.id,
            event_type: body.event_type,
            status: 'processed',
            transaction_id: updatedTransaction.id,
            provider_txn_id: orderId,
            target_status: 'completed',
            payload: body,
          });

          console.log('PayPal payment completed:', orderId, 'Transaction:', updatedTransaction.id);
        }
      }
    }

    if (body.event_type === 'PAYMENT.CAPTURE.DENIED') {
      const orderId = body.resource_links?.find((link: any) => link.rel === 'up')?.href?.split('/').pop();

      if (orderId) {
        const { data: transaction } = await supabaseAdmin
          .from('transactions')
          .select('*')
          .eq('provider_txn_id', orderId)
          .eq('provider', 'paypal')
          .single();

        if (transaction) {
          await transactionService.updateTransactionStatus(
            transaction.user_id || undefined,
            orderId,
            'failed',
            {
              source: 'gateway_webhook',
              method: 'paypal',
              idempotencyKey: body.id,
            }
          );

          await (supabaseAdmin as any).from('webhook_events').insert({
            provider: 'paypal',
            event_id: body.id,
            event_type: body.event_type,
            status: 'processed',
            transaction_id: null,
            provider_txn_id: orderId,
            target_status: 'failed',
            payload: body,
          });

          console.log('PayPal payment denied:', orderId);
        }
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}