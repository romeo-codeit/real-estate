import { NextRequest } from 'next/server';
import { BasePaymentService, PaymentResult, PaymentIntent, PaymentMethod } from './base-payment.service';
// import { StripePaymentService } from './stripe.service'; // Removed - Stripe not available in Nigeria
// import { PayPalPaymentService } from './paypal.service'; // Commented out - restricted in Nigeria
import { PaystackPaymentService } from './paystack.service';
import { CryptoPaymentService } from './crypto.service';

export class PaymentService {
  private services: Map<string, BasePaymentService> = new Map();

  constructor() {
    // Initialize payment services (excluding Stripe - not available in Nigeria)
    // this.services.set('stripe', new StripePaymentService());
    // this.services.set('paypal', new PayPalPaymentService()); // Commented out - restricted in Nigeria
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

  async processWebhook(method: string, payload: any, request?: NextRequest): Promise<boolean> {
    const service = this.services.get(method.toLowerCase());
    if (!service) {
      return false;
    }

    return await service.processWebhook(payload, request);
  }

  async getSupportedMethods(): Promise<PaymentMethod[]> {
    const allMethods: PaymentMethod[] = [];

    for (const service of this.services.values()) {
      const methods = await service.getSupportedMethods();
      allMethods.push(...methods);
    }

    return allMethods;
  }

  async getMethodsByType(type: PaymentMethod['type']): Promise<PaymentMethod[]> {
    const methods = await this.getSupportedMethods();
    return methods.filter(method => method.type === type && method.enabled);
  }

  async isMethodSupported(methodId: string): Promise<boolean> {
    const methods = await this.getSupportedMethods();
    return methods.some(method => method.id === methodId && method.enabled);
  }

  async getMethodById(methodId: string): Promise<PaymentMethod | undefined> {
    const methods = await this.getSupportedMethods();
    return methods.find(method => method.id === methodId);
  }
}

// Export singleton instance
export const paymentService = new PaymentService();