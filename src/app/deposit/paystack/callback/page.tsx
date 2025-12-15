"use client";

import { Suspense, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

function PaystackCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyPaystackPayment = async () => {
      try {
        const reference = searchParams.get('reference');

        if (!reference) {
          setStatus('error');
          setMessage('Missing payment reference');
          return;
        }

        // Verify payment with Paystack
        const response = await fetch('/api/deposit/paystack/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reference }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          setMessage('Your Paystack payment has been processed successfully!');
          toast({
            title: "Payment Successful",
            description: "Your account has been credited with the payment amount.",
          });
        } else {
          setStatus('error');
          setMessage(data.error || 'Payment verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Failed to verify payment');
      }
    };

    verifyPaystackPayment();
  }, [searchParams, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
          )}
          {status === 'success' && (
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
          )}
          {status === 'error' && (
            <XCircle className="h-12 w-12 mx-auto text-red-500" />
          )}
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying Payment...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'error' && 'Payment Failed'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'success' && (
            <p className="text-sm text-muted-foreground">
              Your account balance has been updated. You can now use these funds to invest in properties or cryptocurrencies.
            </p>
          )}
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaystackCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <PaystackCallbackContent />
    </Suspense>
  );
}