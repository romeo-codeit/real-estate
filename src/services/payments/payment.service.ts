import { BasePaymentService, PaymentResult, PaymentIntent, PaymentMethod } from './base-payment.service';
import { StripePaymentService } from './stripe.service';
import { PayPalPaymentService } from './paypal.service';
import { PaystackPaymentService } from './paystack.service';
import { CryptoPaymentService } from './crypto.service';

export class PaymentService {
  private services: Map<string, BasePaymentService> = new Map();

  constructor() {
    // Initialize all payment services
    this.services.set('stripe', new StripePaymentService());
    this.services.set('paypal', new PayPalPaymentService());
    this.services.set('paystack', new PaystackPaymentService());
    this.services.set('crypto', new CryptoPaymentService());
  }

  async createPayment(
    method: string,
    amount: number,
    currency: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentResult> {
    const service = this.services.get(method.toLowerCase());
    if (!service) {
      return {
        success: false,
        error: `Payment method '${method}' not supported`,
        status: 'failed',
      };
    }

    return await service.createPaymentIntent(amount, currency, userId, metadata);
  }

  async confirmPayment(method: string, paymentId: string): Promise<PaymentResult> {
    const service = this.services.get(method.toLowerCase());
    if (!service) {
      return {
        success: false,
        error: `Payment method '${method}' not supported`,
        status: 'failed',
      };
    }

    return await service.confirmPayment(paymentId);
  }

  async getPaymentStatus(method: string, paymentId: string): Promise<PaymentIntent | null> {
    const service = this.services.get(method.toLowerCase());
    if (!service) {
      return null;
    }

    return await service.getPaymentStatus(paymentId);
  }

  async processWebhook(method: string, payload: any, signature?: string): Promise<boolean> {
    const service = this.services.get(method.toLowerCase());
    if (!service) {
      return false;
    }

    return await service.processWebhook(payload, signature);
  }

  getSupportedMethods(): PaymentMethod[] {
    const allMethods: PaymentMethod[] = [];

    for (const service of this.services.values()) {
      allMethods.push(...service.getSupportedMethods());
    }

    return allMethods;
  }

  getMethodsByType(type: PaymentMethod['type']): PaymentMethod[] {
    return this.getSupportedMethods().filter(method => method.type === type && method.enabled);
  }

  isMethodSupported(methodId: string): boolean {
    return this.getSupportedMethods().some(method => method.id === methodId && method.enabled);
  }

  getMethodById(methodId: string): PaymentMethod | undefined {
    return this.getSupportedMethods().find(method => method.id === methodId);
  }
}

// Export singleton instance
export const paymentService = new PaymentService();