'use client';
import { useParams } from 'next/navigation';

import { WalletAddressCopy, PaymentAmountInput, PaymentSummaryCard } from '@/components/shared/payment';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAmount } from '@/lib/helpers';
import { IPlan } from '@/lib/types';
import { getPlans } from '@/services/sanity/plans.sanity';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';

const walletAddress = '0x9834fA77cC029fC8bC1AAdDe03D43d9134e412a7';

export default function PlanDetailPage() {
  const { planId } = useParams();
  const [plan, setPlan] = useState<null | IPlan>();

  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    (async () => {
      const res: IPlan[] = await getPlans();
      if (Array.isArray(res) && res.length > 0) {
        const selectedPlan = res.find((item) => item._id === planId);
        setPlan(selectedPlan);
      }
    })();
  }, []);

  //   if (!plan) return <div>Plan not found</div>;

  const handleInvest = async () => {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, amount }),
    });

    const data = await res.json();
    if (data.url) window.location.href = data.url; // redirect to Paystack or crypto gateway
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className=" mx-auto p-8">
      <div className="max-w-3xl mx-auto py-12 px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h1 className="text-3xl font-bold text-center mb-4">
            Review & Complete Investment
          </h1>

          {/* Plan Summary */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-4">
              <Card className=" shadow-sm">
                <CardHeader>
                  <h2 className="text-xl font-semibold">{plan?.name} Plan</h2>
                  <p className="text-muted-foreground">
                    {formatAmount(plan?.priceRange.minPrice || 0)} -
                    {formatAmount(plan?.priceRange.maxPrice || 0)}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="text-muted-foreground list-disc ml-5 space-y-1">
                    {/* <li>{plan.sqft}</li>
              <li>{plan.bedrooms}</li> */}
                    {plan?.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Investment Input */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Investment Details</h3>
                </CardHeader>
                <CardContent>
                  <label className="block text-sm font-medium mb-2">
                    Enter Investment Amount (USD)
                  </label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Ensure your amount is within
                    {formatAmount(plan?.priceRange.minPrice || 0)} -
                    {formatAmount(plan?.priceRange.maxPrice || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Wallet Info */}
            <div className="flex-1 flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Send Payment</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground">
                    Send your investment amount to the wallet address below:
                  </p>

                  <div className="flex items-center justify-between border rounded-lg p-3 bg-card">
                    <code className="text-sm font-mono text-muted-foreground">
                      6774747t38t684748484
                    </code>
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                  </div>

                  <WalletAddressCopy
                    address="6774747t38t684748484"
                    label="Crypto Wallet Address"
                    className="mt-4"
                  />

                  <div className="mt-2 text-sm text-gray-500">
                    Network: <span className="font-medium">ERC20 (USDT)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Confirmation */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Review & Confirm</h3>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-600">
                      I confirm that I’ve transferred the exact investment
                      amount to the wallet address above.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    disabled={!confirmed || !amount || isSending}
                    //   onClick={handleConfirm}
                  >
                    {isSending ? 'Verifying Payment...' : 'Confirm Payment'}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
