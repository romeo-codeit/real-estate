/**
 * Crypto Wallet Service
 * Handles cryptocurrency transactions and wallet management
 * 
 * Note: This is a service layer that abstracts crypto wallet operations.
 * In production, integrate with actual wallet APIs like:
 * - Coinbase Commerce API
 * - BitPay API
 * - Web3 providers (ethers.js, web3.js)
 * - Bitcoin Core RPC
 */

export interface CryptoWalletConfig {
  BTC_WALLET_ADDRESS?: string;
  ETH_WALLET_ADDRESS?: string;
  USDT_WALLET_ADDRESS?: string;
}

export interface SendCryptoParams {
  cryptoType: string;
  amount: number;
  toAddress: string;
  userId: string;
  transactionId: string;
}

export interface SendCryptoResult {
  success: boolean;
  txHash?: string;
  error?: string;
  estimatedFee?: number;
  confirmationTime?: string;
  manualMode?: boolean;
  explorerUrl?: string;
}

export class CryptoWalletService {
  private config: CryptoWalletConfig;
  private manualMode: boolean;

  constructor() {
    this.config = {
      BTC_WALLET_ADDRESS: process.env.BTC_WALLET_ADDRESS,
      ETH_WALLET_ADDRESS: process.env.ETH_WALLET_ADDRESS,
      USDT_WALLET_ADDRESS: process.env.USDT_WALLET_ADDRESS,
    };

    // Default to manual mode unless explicitly disabled
    this.manualMode = (process.env.CRYPTO_MANUAL_MODE || 'true').toLowerCase() !== 'false';
  }

  /**
   * Send cryptocurrency to a user's wallet address
   * 
   * IMPORTANT: This is a stub implementation. In production, you need to:
   * 1. Connect to your actual crypto wallet/exchange API
   * 2. Verify sufficient balance before sending
   * 3. Handle gas fees and transaction confirmations
   * 4. Implement retry logic and error handling
   */
  async sendCrypto(params: SendCryptoParams): Promise<SendCryptoResult> {
    try {
      const { cryptoType, amount, toAddress, userId, transactionId } = params;

      // Validate wallet address format (basic validation)
      if (!this.isValidAddress(cryptoType, toAddress)) {
        return {
          success: false,
          error: 'Invalid wallet address format',
        };
      }

      console.log('[Crypto Send Request]', {
        cryptoType,
        amount,
        toAddress,
        userId,
        transactionId,
        manualMode: this.manualMode,
      });

      // Manual-first posture: do not attempt on-chain sends unless manualMode is disabled
      if (this.manualMode) {
        return {
          success: false,
          error: 'Manual crypto send required. Use your custodial wallet, then record the tx hash for tracking.',
          manualMode: true,
          explorerUrl: this.getExplorerUrl(cryptoType, ''),
        };
      }

      // If manual mode is off, this should be wired to a real wallet provider.
      // Intentionally throw until a provider is integrated to avoid silent failures.
      throw new Error('Automatic crypto send is not configured. Please integrate a wallet provider.');

    } catch (error: any) {
      console.error('Crypto send error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send cryptocurrency',
      };
    }
  }

  /**
   * Validate crypto wallet address format
   */
  private isValidAddress(cryptoType: string, address: string): boolean {
    const type = cryptoType.toUpperCase();

    // Basic validation - in production, use proper libraries
    if (type === 'BTC' || type === 'BITCOIN') {
      // Bitcoin address validation (simplified)
      return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
    }

    if (type === 'ETH' || type === 'ETHEREUM' || type === 'USDT') {
      // Ethereum address validation
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    // Add more crypto types as needed
    return true; // Default to true for other types
  }

  /**
   * Get wallet balance for a specific crypto type
   */
  async getWalletBalance(cryptoType: string): Promise<number> {
    if (this.manualMode) {
      // In manual mode we cannot know balances; return 0 to avoid misleading values
      console.warn(`Wallet balance requested for ${cryptoType} but manual mode is enabled.`);
      return 0;
    }

    throw new Error('Balance lookup not configured. Integrate a wallet API or disable manual mode.');
  }

  /**
   * Estimate transaction fee for sending crypto
   */
  async estimateFee(cryptoType: string, amount: number): Promise<number> {
    if (this.manualMode) {
      // Suggest the caller prompt the admin to estimate fees in their wallet UI
      console.warn(`Fee estimate requested for ${cryptoType} (${amount}) but manual mode is enabled.`);
      return 0;
    }

    throw new Error('Fee estimation not configured. Integrate network fee lookups or disable manual mode.');
  }

  /**
   * Get transaction status from blockchain
   */
  async getTransactionStatus(cryptoType: string, txHash: string): Promise<{
    confirmed: boolean;
    confirmations: number;
    status: string;
    manualMode?: boolean;
    explorerUrl?: string;
  }> {
    console.log(`Checking status for ${cryptoType} tx: ${txHash} (manualMode=${this.manualMode})`);

    if (this.manualMode) {
      return {
        confirmed: false,
        confirmations: 0,
        status: 'manual_review',
        manualMode: true,
        explorerUrl: this.getExplorerUrl(cryptoType, txHash),
      };
    }

    throw new Error('On-chain status lookup not configured. Integrate a blockchain explorer/client.');
  }

  /**
   * Get blockchain explorer URL for a transaction
   */
  getExplorerUrl(cryptoType: string, txHash: string): string {
    const type = cryptoType.toUpperCase();

    if (type === 'BTC' || type === 'BITCOIN') {
      return `https://www.blockchain.com/btc/tx/${txHash}`;
    }

    if (type === 'ETH' || type === 'ETHEREUM') {
      return `https://etherscan.io/tx/${txHash}`;
    }

    if (type === 'USDT') {
      return `https://etherscan.io/tx/${txHash}`; // USDT is ERC-20
    }

    return `#`;
  }
}

// Export singleton instance
export const cryptoWalletService = new CryptoWalletService();
