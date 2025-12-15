import axios from 'axios';
import { BasePaymentService, PaymentResult, PaymentIntent, PaymentMethod } from './base-payment.service';

export class PaystackPaymentService extends BasePaymentService {
  private baseUrl = 'https://api.paystack.co';
  private secretKey: string;

  constructor() {
    super();
    this.secretKey = process.env.PAYSTACK_SECRET_KEY!;
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentResult> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          amount: Math.round(amount * 100), // Convert to kobo
          currency: currency.toUpperCase(),
          email: metadata?.email || 'user@example.com',
          reference: `deposit_${userId}_${Date.now()}`,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/deposit/paystack/callback`,
          metadata: {
            userId,
            ...metadata,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status) {
        return {
          success: true,
          paymentId: response.data.data.reference,
          status: 'pending',
          redirectUrl: response.data.data.authorization_url,
        };
      } else {
        return {
          success: false,
          error: response.data.message,
          status: 'failed',
        };
      }
    } catch (error: any) {
      console.error('Paystack payment initialization failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: 'failed',
      };
    }
  }

  async confirmPayment(paymentId: string): Promise<PaymentResult> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      const transaction = response.data.data;

      return {
        success: transaction.status === 'success',
        paymentId: transaction.reference,
        transactionId: transaction.id.toString(),
        status: transaction.status === 'success' ? 'completed' : 'failed',
      };
    } catch (error: any) {
      console.error('Paystack payment confirmation failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: 'failed',
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentIntent | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      const transaction = response.data.data;

      return {
        id: transaction.reference,
        amount: transaction.amount / 100, // Convert from kobo
        currency: transaction.currency,
        method: 'paystack',
        status: this.mapPaystackStatus(transaction.status),
        userId: transaction.metadata?.userId || '',
        metadata: transaction.metadata,
        createdAt: new Date(transaction.created_at),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Paystack get payment status failed:', error);
      return null;
    }
  }

  async processWebhook(payload: any, signature?: string): Promise<boolean> {
    try {
      // Paystack webhook verification
      const expectedSignature = require('crypto')
        .createHmac('sha512', this.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid Paystack webhook signature');
        return false;
      }

      console.log('Paystack webhook verified:', payload);

      // Handle different webhook events
      if (payload.event === 'charge.success') {
        console.log('Paystack payment successful:', payload.data.reference);
        // Update database with successful payment
      } else if (payload.event === 'charge.failed') {
        console.log('Paystack payment failed:', payload.data.reference);
        // Handle failed payment
      }

      return true;
    } catch (error) {
      console.error('Paystack webhook processing failed:', error);
      return false;
    }
  }

  getSupportedMethods(): PaymentMethod[] {
    return [
      {
        id: 'paystack_card',
        name: 'Card Payment',
        type: 'card',
        enabled: true,
        minAmount: 100, // ₦100 minimum
        maxAmount: 10000000, // ₦10M maximum
        fees: 1.5, // 1.5% capped at ₦2,000
        processingTime: 'Instant',
      },
      {
        id: 'paystack_bank',
        name: 'Bank Transfer',
        type: 'bank_transfer',
        enabled: true,
        minAmount: 100,
        maxAmount: 10000000,
        fees: 0, // No fees for bank transfers
        processingTime: '1-5 minutes',
      },
    ];
  }

  private mapPaystackStatus(status: string): PaymentIntent['status'] {
    switch (status) {
      case 'success':
        return 'completed';
      case 'pending':
        return 'processing';
      case 'failed':
        return 'failed';
      case 'abandoned':
        return 'cancelled';
      default:
        return 'pending';
    }
  }
}