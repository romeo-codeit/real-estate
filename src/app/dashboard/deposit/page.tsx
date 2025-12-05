
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Landmark, Copy, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

export default function DepositPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isCryptoModalOpen, setCryptoModalOpen] = useState(false);
    const cryptoAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

    const handleCopy = () => {
        navigator.clipboard.writeText(cryptoAddress);
        toast({
            title: "Copied to clipboard!",
            description: "Crypto address has been copied.",
        });
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
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button size="lg" className="w-full justify-start py-8">
                            <Wallet className="mr-4 h-6 w-6" />
                            <div className="text-left">
                                <p className="font-semibold">Pay with Crypto</p>
                                <p className="text-sm font-normal text-primary-foreground/80">Use our secure wallet address</p>
                            </div>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Pay with Cryptocurrency</AlertDialogTitle>
                        <AlertDialogDescription>
                            Send your payment to the following wallet address. Please ensure you send the correct cryptocurrency.
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
                        <AlertDialogAction>Done</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Card className="bg-secondary">
                     <CardContent className="p-6">
                         <div className="flex items-center">
                            <Landmark className="mr-4 h-6 w-6 text-secondary-foreground" />
                            <div className="text-left">
                                 <p className="font-semibold text-secondary-foreground">Wire Transfer</p>
                                 <p className="text-sm text-secondary-foreground/80">Use your mobile banking app</p>
                            </div>
                         </div>
                         <div className="mt-4 space-y-2 text-sm text-secondary-foreground/90">
                             <p><strong>Bank Name:</strong> RealVest Bank</p>
                             <p><strong>Account Number:</strong> 1234567890</p>
                             <p><strong>Routing Number:</strong> 0987654321</p>
                             <p><strong>Reference:</strong> Your Full Name</p>
                         </div>
                     </CardContent>
                </Card>

            </CardContent>
        </Card>
    </div>
  );
}
