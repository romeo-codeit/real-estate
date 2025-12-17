import Stripe from 'stripe';
import { NextRequest } from 'next/server';
import { BasePaymentService, PaymentResult, PaymentIntent, PaymentMethod } from './base-payment.service';

export class StripePaymentService extends BasePaymentService {
  private stripe: Stripe;

  constructor() {
    super();
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          userId,
          ...metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        success: true,
        paymentId: paymentIntent.id,
        status: paymentIntent.status,
        redirectUrl: `https://js.stripe.com/v3/link.html#payment_intent=${paymentIntent.client_secret}`,
      };
    } catch (error: any) {
      console.error('Stripe payment intent creation failed:', error);
      return {
        success: false,
        error: error.message,
        status: 'failed',
      };
    }
  }

  async confirmPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);

      return {
        success: paymentIntent.status === 'succeeded',
        paymentId: paymentIntent.id,
        transactionId: paymentIntent.id,
        status: paymentIntent.status,
      };
    } catch (error: any) {
      console.error('Stripe payment confirmation failed:', error);
      return {
        success: false,
        error: error.message,
        status: 'failed',
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentIntent | null> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentId);

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency,
        method: 'stripe',
        status: this.mapStripeStatus(paymentIntent.status),
        userId: paymentIntent.metadata?.userId || '',
        metadata: paymentIntent.metadata,
        createdAt: new Date(paymentIntent.created * 1000),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Stripe get payment status failed:', error);
      return null;
    }
  }

  async processWebhook(payload: any, request?: NextRequest): Promise<boolean> {
    try {
      const signature = request?.headers.get('stripe-signature') || undefined;

      if (!signature) return false;

      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      // Signature verified; route-level handler will perform any
      // database updates based on this webhook.
      console.log('Stripe webhook verified:', event.id, event.type);
      return true;
    } catch (error) {
      console.error('Stripe webhook processing failed:', error);
      return false;
    }
  }

  async getSupportedMethods(): Promise<PaymentMethod[]> {
    return [
      {
        id: 'stripe_card',
        name: 'Credit/Debit Card',
        type: 'card',
        enabled: true,
        minAmount: 10,
        maxAmount: 10000,
        fees: 2.9, // 2.9% + 30¢
        processingTime: 'Instant',
      },
    ];
  }

  private mapStripeStatus(status: string): PaymentIntent['status'] {
    switch (status) {
      case 'succeeded':
        return 'completed';
      case 'processing':
      case 'requires_payment_method':
      case 'requires_confirmation':
        return 'processing';
      case 'canceled':
        return 'cancelled';
      case 'requires_action':
        return 'pending';
      default:
        return 'failed';
    }
  }
}