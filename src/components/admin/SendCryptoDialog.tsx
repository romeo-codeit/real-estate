'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { formatAmount } from '@/lib/helpers';

interface WithdrawalTransaction {
  id: string;
  amount: number;
  currency: string;
  provider: string;
  metadata?: {
    wallet_address?: string;
    crypto_type?: string;
  };
  user_id?: string;
}

interface SendCryptoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: WithdrawalTransaction;
  onSendCrypto: (txHash: string, notes?: string) => Promise<void>;
  loading?: boolean;
}

export function SendCryptoDialog({
  open,
  onOpenChange,
  transaction,
  onSendCrypto,
  loading = false,
}: SendCryptoDialogProps) {
  const [txHash, setTxHash] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);

  const walletAddress = transaction.metadata?.wallet_address || '';
  const cryptoType = transaction.metadata?.crypto_type || transaction.provider || 'BTC';

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash.trim()) {
      alert('Please enter the transaction hash');
      return;
    }
    await onSendCrypto(txHash.trim(), notes.trim() || undefined);
    setTxHash('');
    setNotes('');
  };

  const getExplorerUrl = (type: string) => {
    const upper = type.toUpperCase();
    if (upper === 'BTC' || upper === 'BITCOIN') {
      return 'https://www.blockchain.com/explorer';
    }
    if (upper === 'ETH' || upper === 'ETHEREUM') {
      return 'https://etherscan.io';
    }
    return 'https://www.blockchain.com/explorer';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Send Crypto Withdrawal</DialogTitle>
          <DialogDescription>
            Send cryptocurrency to the user's wallet and record the transaction hash.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Amount to Send */}
            <div className="space-y-2">
              <Label>Amount to Send</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-card/5 rounded-md font-mono font-semibold text-lg">
                  {formatAmount(transaction.amount, transaction.currency)}
                </div>
                <Badge variant="secondary">{cryptoType.toUpperCase()}</Badge>
              </div>
            </div>

            {/* User's Wallet Address */}
            <div className="space-y-2">
              <Label>Recipient Wallet Address</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={walletAddress}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyAddress}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Copy this address and send the crypto from your wallet
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-2">
              <h4 className="font-semibold text-sm text-blue-900">Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Copy the recipient wallet address above</li>
                <li>Open your crypto wallet (Coinbase, Binance, MetaMask, etc.)</li>
                <li>Send {formatAmount(transaction.amount, transaction.currency)} {cryptoType.toUpperCase()} to the copied address</li>
                <li>Wait for the transaction to be broadcast</li>
                <li>Copy the transaction hash from your wallet</li>
                <li>Paste the transaction hash below</li>
              </ol>
              <a
                href={getExplorerUrl(cryptoType)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 underline mt-2"
              >
                Open Block Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Transaction Hash Input */}
            <div className="space-y-2">
              <Label htmlFor="txHash">
                Transaction Hash <span className="text-red-500">*</span>
              </Label>
              <Input
                id="txHash"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="0x... or txid..."
                className="font-mono"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                The blockchain transaction hash/ID from your wallet
              </p>
            </div>

            {/* Notes (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this transaction..."
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> Make sure you've actually sent the crypto before submitting this form.
                This action will mark the withdrawal as completed.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !txHash.trim()}>
              {loading ? 'Recording...' : 'Confirm & Complete Withdrawal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}