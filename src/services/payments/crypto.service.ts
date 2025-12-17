import { NextRequest } from 'next/server';
import { BasePaymentService, PaymentResult, PaymentIntent, PaymentMethod } from './base-payment.service';
import cryptoWalletsService from '../supabase/crypto-wallets.service';

export class CryptoPaymentService extends BasePaymentService {

  async createPaymentIntent(
    amount: number,
    currency: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<PaymentResult> {
    try {
      // For crypto, we generate a unique deposit address or use a shared wallet
      // In production, you'd integrate with a crypto payment processor like CoinPayments, NOWPayments, etc.

      const depositId = `crypto_${userId}_${Date.now()}`;

      return {
        success: true,
        paymentId: depositId,
        status: 'pending',
        // No redirect for crypto - user stays on page to see wallet address
      };
    } catch (error: any) {
      console.error('Crypto payment creation failed:', error);
      return {
        success: false,
        error: error.message,
        status: 'failed',
      };
    }
  }

  async confirmPayment(paymentId: string): Promise<PaymentResult> {
    try {
      // For manual approval flow: admin can confirm after verifying blockchain
      // This allows manual approval without requiring webhooks
      return {
        success: true,
        paymentId,
        status: 'completed',
      };
    } catch (error: any) {
      console.error('Crypto payment confirmation failed:', error);
      return {
        success: false,
        error: error.message,
        status: 'failed',
      };
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentIntent | null> {
    try {
      // In production, query blockchain or payment processor API
      return {
        id: paymentId,
        amount: 0, // Would be retrieved from database
        currency: 'BTC',
        method: 'crypto',
        status: 'pending', // Would check actual blockchain status
        userId: paymentId.split('_')[1], // Extract user ID from payment ID
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Crypto get payment status failed:', error);
      return null;
    }
  }

  async processWebhook(payload: any, request?: NextRequest): Promise<boolean> {
    try {
      // For manual approval flow, we log webhooks but don't auto-process
      // Admin must manually verify and approve transactions
      console.log('Crypto webhook received (manual approval required):', payload);

      // Log to audit for admin review
      // Note: In production, you might want to store these for admin review

      // Return false to prevent automatic processing
      return false;
    } catch (error) {
      console.error('Crypto webhook processing failed:', error);
      return false;
    }
  }

  async getSupportedMethods(): Promise<PaymentMethod[]> {
    try {
      const wallets = await cryptoWalletsService.getEnabledCryptoWallets();

      return wallets.map(wallet => ({
        id: wallet.symbol.toLowerCase(),
        name: `${wallet.name} (${wallet.symbol})`,
        type: 'crypto',
        enabled: wallet.enabled,
        minAmount: 0.0001, // Could be made configurable per crypto
        maxAmount: 10000, // Could be made configurable per crypto
        fees: 0.001, // Could be made configurable per crypto
        processingTime: '5-60 minutes',
      }));
    } catch (error) {
      console.error('Error fetching crypto wallets:', error);
      // Fallback to empty array if DB fails
      return [];
    }
  }

  async getWalletAddress(crypto: string): Promise<string> {
    try {
      const wallet = await cryptoWalletsService.getWalletBySymbol(crypto.toUpperCase());
      return wallet?.wallet_address || '';
    } catch (error) {
      console.error('Error fetching wallet address:', error);
      return '';
    }
  }
}