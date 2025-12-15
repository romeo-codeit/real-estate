
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Landmark, Copy, ArrowLeft, Loader2, CreditCard, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bankingConfig } from '@/constants/constants';
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
} from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase/supabase';
import { paymentService } from '@/services/payments/payment.service';
import { PaymentMethod } from '@/services/payments/base-payment.service';

export default function DepositPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isCryptoModalOpen, setCryptoModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [userEmail, setUserEmail] = useState('');
    const cryptoAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

    useEffect(() => {
        // Fetch available payment methods
        const methods = paymentService.getSupportedMethods();
        setPaymentMethods(methods);

        // Get user email for payment processing
        const getUserEmail = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setUserEmail(user.email);
            }
        };
        getUserEmail();
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(cryptoAddress);
        toast({
            title: "Copied to clipboard!",
            description: "Crypto address has been copied.",
        });
    };

    const handleDeposit = async (paymentMethod: string) => {
        if (!depositAmount || parseFloat(depositAmount) <= 0) {
            toast({
                title: "Invalid Amount",
                description: "Please enter a valid deposit amount.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            // Get the current session for authentication
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                throw new Error('No active session');
            }

            const response = await fetch('/api/deposit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    amount: parseFloat(depositAmount),
                    paymentMethod,
                    currency: 'USD',
                    email: userEmail,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process deposit');
            }

            // Handle different payment methods
            if (data.payment?.redirectUrl) {
                // Redirect to payment gateway
                window.location.href = data.payment.redirectUrl;
                return;
            }

            toast({
                title: "Deposit Initiated",
                description: "Your deposit request has been submitted and is being processed.",
            });

            // Reset form
            setDepositAmount('');
            setSelectedPaymentMethod('');

        } catch (error) {
            console.error('Deposit error:', error);
            toast({
                title: "Deposit Failed",
                description: error instanceof Error ? error.message : "Failed to process deposit. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="space-y-8">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Return to previous page</span>
            </Button>
            <h1 className="text-3xl font-bold">Deposit</h1>
        </div>
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
            <CardTitle className="text-3xl">Make a Deposit</CardTitle>
            <CardDescription>Choose your preferred payment method to fund your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Amount Input */}
                <div className="space-y-2">
                    <Label htmlFor="amount" className="text-lg font-medium">
                        Deposit Amount ($)
                    </Label>
                    <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount to deposit"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="h-12 text-xl"
                        min="0"
                        step="0.01"
                    />
                </div>

                {/* Payment Methods */}
                <div className="space-y-4">
                    <Label className="text-lg font-medium">Choose Payment Method</Label>
                    <div className="grid gap-4">
                        {/* Crypto Payment - Primary */}
                        {paymentMethods.filter(method => method.type === 'crypto' && method.enabled).map((method) => (
                            <AlertDialog key={method.id}>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        size="lg"
                                        className="w-full justify-start py-8 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                                        disabled={isLoading || !depositAmount}
                                        onClick={() => setSelectedPaymentMethod(method.id)}
                                    >
                                        {isLoading && selectedPaymentMethod === method.id ? (
                                            <Loader2 className="mr-4 h-6 w-6 animate-spin" />
                                        ) : (
                                            <Wallet className="mr-4 h-6 w-6" />
                                        )}
                                        <div className="text-left">
                                            <p className="font-semibold">{method.name} ⭐ PRIMARY</p>
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
                                        Send ${depositAmount || 'your amount'} to the following wallet address. Please ensure you send the correct cryptocurrency.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="my-4 p-4 bg-muted rounded-lg text-center">
                                        <p className="text-sm text-muted-foreground">BTC Address</p>
                                        <div className="flex items-center justify-center gap-2 mt-1">
                                            <p className="text-lg font-mono break-all">{cryptoAddress}</p>
                                            <Button variant="ghost" size="icon" onClick={handleCopy}>
                                                <Copy className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeposit(method.id)}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Confirm Deposit'
                                        )}
                                    </AlertDialogAction>
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
                                className="w-full justify-start py-8"
                                disabled={isLoading || !depositAmount}
                                onClick={() => handleDeposit(method.id)}
                            >
                                {isLoading && selectedPaymentMethod === method.id ? (
                                    <Loader2 className="mr-4 h-6 w-6 animate-spin" />
                                ) : (
                                    <CreditCard className="mr-4 h-6 w-6" />
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
                                className="w-full justify-start py-8 bg-blue-600 hover:bg-blue-700"
                                disabled={isLoading || !depositAmount}
                                onClick={() => handleDeposit(method.id)}
                            >
                                {isLoading && selectedPaymentMethod === method.id ? (
                                    <Loader2 className="mr-4 h-6 w-6 animate-spin" />
                                ) : (
                                    <DollarSign className="mr-4 h-6 w-6" />
                                )}
                                <div className="text-left">
                                    <p className="font-semibold">{method.name}</p>
                                    <p className="text-sm font-normal text-primary-foreground/80">
                                        Processing time: {method.processingTime} • Fee: {method.fees}%
                                    </p>
                                </div>
                            </Button>
                        ))}

                        {/* Bank Transfer */}
                        <Card className="bg-secondary">
                             <CardContent className="p-6">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Landmark className="mr-4 h-6 w-6 text-secondary-foreground" />
                                        <div className="text-left">
                                             <p className="font-semibold text-secondary-foreground">Wire Transfer</p>
                                             <p className="text-sm text-secondary-foreground/80">Use your mobile banking app</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        disabled={isLoading || !depositAmount}
                                        onClick={() => handleDeposit('wire_transfer')}
                                    >
                                        {isLoading && selectedPaymentMethod === 'wire_transfer' ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            'Deposit via Wire'
                                        )}
                                    </Button>
                                 </div>
                                 <div className="mt-4 space-y-2 text-sm text-secondary-foreground/90">
                                     <p><strong>Bank Name:</strong> {bankingConfig.bankName}</p>
                                     <p><strong>Account Number:</strong> {bankingConfig.accountNumber}</p>
                                     <p><strong>Routing Number:</strong> {bankingConfig.routingNumber}</p>
                                     <p><strong>Reference:</strong> {bankingConfig.reference}</p>
                                 </div>
                             </CardContent>
                        </Card>
                    </div>
                </div>

            </CardContent>
        </Card>
    </div>
  );
}
