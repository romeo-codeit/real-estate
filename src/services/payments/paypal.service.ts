import { NextRequest } from 'next/server';
import { BasePaymentService, PaymentResult, PaymentIntent, PaymentMethod } from './base-payment.service';

export class PayPalPaymentService extends BasePaymentService {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;

  constructor() {
    super();
    this.clientId = process.env.PAYPAL_CLIENT_ID!;
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
    this.baseUrl = process.env.PAYPAL_ENVIRONMENT === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
  }

  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();
    return data.access_token;
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentResult> {
    try {
      const accessToken = await this.getAccessToken();

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toFixed(2),
          },
          description: 'Deposit to investment account',
        }],
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/deposit/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/deposit/cancel`,
        },
      };

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const order = await response.json();

      if (order.id) {
        return {
          success: true,
          paymentId: order.id,
          status: 'pending',
          redirectUrl: order.links.find((link: any) => link.rel === 'approve')?.href,
        };
      } else {
        return {
          success: false,
          error: 'Failed to create PayPal order',
          status: 'failed',
        };
      }
    } catch (error: any) {
      console.error('PayPal payment creation failed:', error);
      return {
        success: false,
        error: error.message,
        status: 'failed',
      };
    }
  }

  async confirmPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${paymentId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const capture = await response.json();

      if (capture.status === 'COMPLETED') {
        return {
          success: true,
          paymentId,
          transactionId: capture.id,
          status: 'completed',
        };
      } else {
        return {
          success: false,
          error: 'Payment capture failed',
          status: 'failed',
        };
      }
    } catch (error: any) {
      console.error('PayPal payment confirmation failed:', error);
      return {
        success: false,
        error: error.message,
        status: 'failed',
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentIntent | null> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const order = await response.json();

      return {
        id: paymentId,
        amount: parseFloat(order.purchase_units[0].amount.value),
        currency: order.purchase_units[0].amount.currency_code,
        method: 'paypal',
        status: this.mapPayPalStatus(order.status),
        userId: order.metadata?.userId || '',
        createdAt: new Date(order.create_time),
        updatedAt: new Date(order.update_time),
      };
    } catch (error) {
      console.error('PayPal get payment status failed:', error);
      return null;
    }
  }

  async processWebhook(payload: any, request?: NextRequest): Promise<boolean> {
    try {
      if (!request) return false;

      const transmissionId = request.headers.get('paypal-transmission-id');
      const transmissionTime = request.headers.get('paypal-transmission-time');
      const certUrl = request.headers.get('paypal-cert-url');
      const authAlgo = request.headers.get('paypal-auth-algo');
      const transmissionSig = request.headers.get('paypal-transmission-sig');

      if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
        console.error('Missing PayPal webhook verification headers');
        return false;
      }

      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return false;
      }

      const verifyBody = {
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: process.env.PAYPAL_WEBHOOK_ID!,
        webhook_event: payload,
      };

      const verifyResponse = await fetch(`${this.baseUrl}/v1/notifications/verify-webhook-signature`, {
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

      console.log('PayPal webhook verified:', payload.event_type);
      return true;
    } catch (error) {
      console.error('PayPal webhook processing failed:', error);
      return false;
    }
  }

  async getSupportedMethods(): Promise<PaymentMethod[]> {
    return [
      {
        id: 'paypal',
        name: 'PayPal',
        type: 'paypal',
        enabled: true,
        minAmount: 1,
        maxAmount: 10000,
        fees: 2.9,
        processingTime: 'Instant',
      },
    ];
  }

  private mapPayPalStatus(status: string): PaymentIntent['status'] {
    switch (status) {
      case 'CREATED':
      case 'APPROVED':
        return 'pending';
      case 'COMPLETED':
        return 'completed';
      case 'VOIDED':
        return 'cancelled';
      default:
        return 'failed';
    }
  }
}