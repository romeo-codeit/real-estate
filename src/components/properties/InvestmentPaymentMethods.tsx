'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, CreditCard, DollarSign, Landmark, Loader2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { paymentService } from '@/services/payments/payment.service';
import { PaymentMethod } from '@/services/payments/base-payment.service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface InvestmentPaymentMethodsProps {
  amount: number;
  propertyId: string;
  propertyName: string;
  onPaymentInitiated: (paymentId: string, method: string) => void;
  onPaymentCompleted: () => void;
  transactionId?: string;
}

export function InvestmentPaymentMethods({
  amount,
  propertyId,
  propertyName,
  onPaymentInitiated,
  onPaymentCompleted,
  transactionId
}: InvestmentPaymentMethodsProps) {
  const { toast } = useToast();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [cryptoAddress] = useState("0x9834fA77cC029fC8bC1AAdDe03D43d9134e412a7"); // USDT address

  // Load payment methods on component mount
  useState(() => {
    const loadMethods = async () => {
      const methods = await paymentService.getSupportedMethods();
      setPaymentMethods(methods);
    };
    loadMethods();
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cryptoAddress);
      toast({
        title: "Copied!",
        description: "USDT address copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the address manually",
        variant: "destructive",
      });
    }
  };

  const handleConfirmCryptoPayment = async () => {
    if (!transactionId) return;

    try {
      const { data: { session }, error: sessionError } = await import('@/services/supabase/supabase').then(m => m.supabase.auth.getSession());
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          transactionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm payment');
      }

      toast({
        title: "Payment Confirmed!",
        description: "Your investment is now active.",
      });

      onPaymentCompleted();
    } catch (error) {
      console.error('Confirm payment error:', error);
      toast({
        title: "Confirmation Failed",
        description: error instanceof Error ? error.message : "Failed to confirm payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async (methodId: string) => {
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid investment amount.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSelectedMethod(methodId);

    try {
      // Get user session for authentication
      const { data: { session }, error: sessionError } = await import('@/services/supabase/supabase').then(m => m.supabase.auth.getSession());
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      // Initiate investment with payment
      const response = await fetch('/api/invest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount,
          investmentType: 'property',
          targetId: propertyId,
          currency: 'USD',
          paymentMethod: methodId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate investment');
      }

      // Handle different payment methods
      if (data.payment?.redirectUrl) {
        // For redirect-based payments (Stripe, PayPal, etc.)
        onPaymentInitiated(data.transaction.id, methodId);
        window.location.href = data.payment.redirectUrl;
        return;
      } else if (methodId === 'crypto') {
        // For crypto payments, show wallet address
        onPaymentInitiated(data.transaction.id, methodId);
        toast({
          title: "Investment Initiated",
          description: "Please send the payment to the provided crypto address.",
        });
      } else {
        // For other payment methods
        onPaymentInitiated(data.transaction.id, methodId);
        toast({
          title: "Investment Initiated",
          description: "Your investment request has been submitted and is being processed.",
        });
      }

    } catch (error) {
      console.error('Investment error:', error);
      toast({
        title: "Investment Failed",
        description: error instanceof Error ? error.message : "Failed to process investment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedMethod('');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Choose Payment Method</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select your preferred payment method to complete your investment in {propertyName}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Crypto Payment - Primary */}
          {paymentMethods.filter(method => method.type === 'crypto' && method.enabled).map((method) => (
            <AlertDialog key={method.id}>
              <AlertDialogTrigger asChild>
                <Button
                  size="lg"
                  className="w-full justify-start py-6 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                  disabled={isLoading}
                >
                  {isLoading && selectedMethod === method.id ? (
                    <Loader2 className="mr-4 h-5 w-5 animate-spin" />
                  ) : (
                    <Wallet className="mr-4 h-5 w-5" />
                  )}
                  <div className="text-left">
                    <p className="font-semibold">{method.name} ⭐ SECURE & FAST</p>
                    <p className="text-sm font-normal text-primary-foreground/80">
                      Processing time: {method.processingTime} • Fee: {method.fees}%
                    </p>
                  </div>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Pay with {method.name}</AlertDialogTitle>
                  <AlertDialogDescription>
                    Send ${amount} worth of USDT to the following wallet address on the ERC20 network.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="my-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">USDT (ERC20) Address</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-sm font-mono break-all bg-background p-2 rounded border">{cryptoAddress}</p>
                    <Button variant="ghost" size="icon" onClick={handleCopy}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Network: ERC20 • Only send USDT on this network
                  </p>
                </div>
                <AlertDialogFooter className="flex-col gap-2">
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handlePayment(method.id)}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Send Payment & Continue'
                    )}
                  </AlertDialogAction>
                  {transactionId && (
                    <Button
                      variant="outline"
                      onClick={handleConfirmCryptoPayment}
                      className="w-full"
                      disabled={isLoading}
                    >
                      I Have Sent the Payment - Confirm
                    </Button>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ))}

          {/* Card Payments */}
          {paymentMethods.filter(method => method.type === 'card' && method.enabled).map((method) => (
            <Button
              key={method.id}
              size="lg"
              variant="outline"
              className="w-full justify-start py-6"
              disabled={isLoading}
              onClick={() => handlePayment(method.id)}
            >
              {isLoading && selectedMethod === method.id ? (
                <Loader2 className="mr-4 h-5 w-5 animate-spin" />
              ) : (
                <CreditCard className="mr-4 h-5 w-5" />
              )}
              <div className="text-left">
                <p className="font-semibold">{method.name}</p>
                <p className="text-sm font-normal text-muted-foreground">
                  Processing time: {method.processingTime} • Fee: {method.fees}%
                </p>
              </div>
            </Button>
          ))}

          {/* PayPal */}
          {paymentMethods.filter(method => method.type === 'paypal' && method.enabled).map((method) => (
            <Button
              key={method.id}
              size="lg"
              className="w-full justify-start py-6 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
              onClick={() => handlePayment(method.id)}
            >
              {isLoading && selectedMethod === method.id ? (
                <Loader2 className="mr-4 h-5 w-5 animate-spin" />
              ) : (
                <DollarSign className="mr-4 h-5 w-5" />
              )}
              <div className="text-left">
                <p className="font-semibold">{method.name}</p>
                <p className="text-sm font-normal text-primary-foreground/80">
                  Processing time: {method.processingTime} • Fee: {method.fees}%
                </p>
              </div>
            </Button>
          ))}

          {/* Paystack */}
          {paymentMethods.filter(method => method.type === 'bank_transfer' && method.enabled && method.id === 'paystack').map((method) => (
            <Button
              key={method.id}
              size="lg"
              className="w-full justify-start py-6 bg-green-600 hover:bg-green-700"
              disabled={isLoading}
              onClick={() => handlePayment(method.id)}
            >
              {isLoading && selectedMethod === method.id ? (
                <Loader2 className="mr-4 h-5 w-5 animate-spin" />
              ) : (
                <Landmark className="mr-4 h-5 w-5" />
              )}
              <div className="text-left">
                <p className="font-semibold">{method.name}</p>
                <p className="text-sm font-normal text-primary-foreground/80">
                  Processing time: {method.processingTime} • Fee: {method.fees}%
                </p>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}