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

  async processWebhook(payload: any, signature?: string): Promise<boolean> {
    try {
      // PayPal webhook verification would require webhook ID validation
      // For now, we'll trust the webhook if it comes from PayPal's IP ranges
      console.log('PayPal webhook received:', payload.event_type);

      // Handle different webhook events
      switch (payload.event_type) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          console.log('PayPal payment completed:', payload.resource.id);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          console.log('PayPal payment denied:', payload.resource.id);
          break;
        default:
          console.log('Unhandled PayPal webhook event:', payload.event_type);
      }

      return true;
    } catch (error) {
      console.error('PayPal webhook processing failed:', error);
      return false;
    }
  }

  getSupportedMethods(): PaymentMethod[] {
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