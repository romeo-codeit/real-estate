'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Wallet, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/services/supabase/supabase';

export default function WithdrawPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cryptoType, setCryptoType] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState('');

  const handleWithdraw = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive",
      });
      return;
    }

    if (!cryptoType) {
      toast({
        title: "Missing Crypto Type",
        description: "Please select a cryptocurrency.",
        variant: "destructive",
      });
      return;
    }

    if (!walletAddress.trim()) {
      toast({
        title: "Missing Wallet Address",
        description: "Please enter your wallet address.",
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

      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          cryptoType,
          walletAddress: walletAddress.trim(),
          currency: 'USD',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process withdrawal');
      }

      toast({
        title: 'Withdrawal Request Submitted',
        description: 'Your withdrawal request has been received and is being processed.',
      });

      // Reset form
      setAmount('');
      setCryptoType('');
      setWalletAddress('');

    } catch (error) {
      console.error('Withdraw error:', error);
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "Failed to process withdrawal. Please try again.",
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
        <h1 className="text-3xl font-bold">Withdraw</h1>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Withdraw Funds</CardTitle>
          <CardDescription>
            Select your preferred withdrawal method and fill in the details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <form onSubmit={handleWithdraw}>
            <div className="">
              {/* Wire Transfer */}

              {/* Crypto and International */}
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Wallet className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-xl">
                          Cryptocurrency
                        </CardTitle>
                        <CardDescription>
                          To your crypto wallet.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="cryptoType">Cryptocurrency</Label>
                      <Select value={cryptoType} onValueChange={setCryptoType}>
                        <SelectTrigger id="cryptoType">
                          <SelectValue placeholder="Select crypto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="btc">Bitcoin (BTC)</SelectItem>
                          <SelectItem value="eth">Ethereum (ETH)</SelectItem>
                          <SelectItem value="usdt">Tether (USDT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="walletAddress">Wallet Address</Label>
                      <Input
                        id="walletAddress"
                        placeholder="Your wallet address"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <Label htmlFor="amount" className="text-lg">
                  Amount to Withdraw ($)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 500.00"
                  className="h-12 text-xl"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Withdrawal...
                  </>
                ) : (
                  'Submit Withdrawal Request'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
