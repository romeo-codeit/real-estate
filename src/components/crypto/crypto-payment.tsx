// components/CryptoPaymentStep.tsx
'use client';

import { WalletAddressCopy, PaymentStatusDisplay, type PaymentStatus } from '@/components/shared/payment';
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Clock,
  Copy,
  QrCode,
} from 'lucide-react';
import React, { useState } from 'react';

// shadcn/ui components (assuming these are configured)
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CryptoPaymentStepProps {
  finalAmountUSD: number;
  cryptoSymbol: string;
  cryptoAddress: string;
  onBack: () => void;
  // A simulated function to check payment status
  checkPaymentStatus: () => 'pending' | 'confirmed' | 'error';
  onPaymentConfirmed: () => void;
}

const CryptoPaymentStep: React.FC<CryptoPaymentStepProps> = ({
  finalAmountUSD,
  cryptoSymbol,
  cryptoAddress,
  onBack,
  checkPaymentStatus,
  onPaymentConfirmed,
}) => {
  const { toast } = useToast();
  // State for simulated payment status
  const [paymentStatus, setPaymentStatus] = useState<
    'pending' | 'confirmed' | 'waiting'
  >('waiting');
  const [checkCount, setCheckCount] = useState(0);

  // --- Mock Conversion (Assuming a fixed rate for display) ---
  const conversionRate = 1 / 0.89; // ~$0.89 per MATIC
  const finalAmountCrypto = finalAmountUSD * conversionRate;

  // --- Handlers ---
  const handleCopy = () => {
    navigator.clipboard.writeText(cryptoAddress);
    toast({
      title: 'Address Copied!',
      description: 'Wallet address copied to clipboard.',
    });
  };

  const handleCheckStatus = () => {
    const newCheckCount = checkCount + 1;
    setCheckCount(newCheckCount);

    // Simulate payment confirmation after 2-3 checks
    if (newCheckCount >= 3) {
      setPaymentStatus('confirmed');
      onPaymentConfirmed();
    } else {
      setPaymentStatus('pending');
    }
  };

  // --- Display logic based on status ---
  let statusMessage;
  let StatusIcon;
  let statusClass;

  if (paymentStatus === 'confirmed') {
    statusMessage = 'Payment Confirmed! Your investment is now active.';
    StatusIcon = CheckCircle;
    statusClass = 'border-green-400 bg-green-50 text-green-700';
  } else if (paymentStatus === 'pending') {
    statusMessage = 'Transaction Pending. Waiting for network confirmations.';
    StatusIcon = Clock;
    statusClass = 'border-yellow-400 bg-yellow-50 text-yellow-700';
  } else {
    statusMessage = 'Deposit required to confirm your investment.';
    StatusIcon = Clock;
    statusClass = 'border-blue-400 bg-blue-50 text-blue-700';
  }

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      {/* Status Bar */}
      <PaymentStatusDisplay status={paymentStatus as PaymentStatus} />

      {/* Payment Details Card */}
      <div className="bg-card border border-border p-6 rounded-xl shadow-lg space-y-6">
        <h3 className="text-xl font-bold text-foreground border-b pb-4 mb-4">
          Deposit Your Payment
        </h3>

        {/* Amount Section */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Amount to Deposit (USD)</p>
            <p className="text-2xl font-bold text-foreground">
              ${finalAmountUSD}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              Amount to Deposit ({cryptoSymbol})
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {finalAmountCrypto.toFixed(2)} {cryptoSymbol}
            </p>
          </div>
        </div>

        {/* Address and QR Code */}
        <div className="flex flex-col md:flex-row items-center justify-between bg-card p-4 rounded-lg border border-border">
          {/* QR Code Placeholder (Visual Element) */}
          <div className="p-2 bg-card border border-border rounded-lg shadow-sm mb-4 md:mb-0">
            <QrCode className="h-20 w-20 text-muted-foreground" />
          </div>

          {/* Address Details */}
          <div className="flex-1 md:ml-6 w-full">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Deposit Wallet Address (MATIC Network)
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-mono break-all bg-card p-2 rounded-md border border-dashed border-blue-300 flex-1">
                {cryptoAddress}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="hover:bg-blue-50 text-blue-600 border-blue-300 flex-shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Network Warning */}
        <Alert
          variant="default"
          className="bg-red-50 border-l-4 border-red-500 text-red-800 p-3"
        >
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-base font-semibold">
            CRITICAL: Use the Polygon (MATIC) Network only!
          </AlertTitle>
          <AlertDescription className="text-sm mt-1">
            Depositing from any other network (e.g., Ethereum Mainnet, BSC) will
            result in permanent loss of funds.
          </AlertDescription>
        </Alert>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end space-x-4 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={onBack}
          className="px-6 py-3 rounded-xl text-base text-muted-foreground hover:bg-card/5"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleCheckStatus}
          disabled={paymentStatus === 'confirmed'}
          className={`px-6 py-3 rounded-xl text-base text-white font-semibold ${paymentStatus === 'confirmed' ? 'opacity-70 cursor-not-allowed' : ''}`}
          style={{
            background: 'linear-gradient(to right, #10B981, #059669)', // Green gradient for "Check Status"
            boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.4)',
          }}
        >
          {paymentStatus === 'confirmed'
            ? 'Investment Active'
            : checkCount === 0
            ? 'Check Payment Status'
            : `Checking... (${checkCount}/3)`}
        </Button>
      </div>
    </div>
  );
};

export default CryptoPaymentStep;
