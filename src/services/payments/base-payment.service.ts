export interface PaymentMethod {
  id: string;
  name: string;
  type: 'crypto' | 'card' | 'paypal' | 'bank_transfer';
  enabled: boolean;
  minAmount: number;
  maxAmount?: number;
  fees?: number;
  processingTime: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  userId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  redirectUrl?: string;
  error?: string;
  status: string;
}

export abstract class BasePaymentService {
  abstract createPaymentIntent(
    amount: number,
    currency: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentResult>;

  abstract confirmPayment(paymentId: string): Promise<PaymentResult>;

  abstract getPaymentStatus(paymentId: string): Promise<PaymentIntent | null>;

  abstract processWebhook(payload: any, signature?: string): Promise<boolean>;

  abstract getSupportedMethods(): PaymentMethod[];
}