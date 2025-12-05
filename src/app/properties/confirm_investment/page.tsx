'use client';

import LoginModal from '@/components/shared/login-modal';
import { WalletAddressCopy, PaymentStatusDisplay, PaymentAmountInput, PaymentSummaryCard } from '@/components/shared/payment';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import useQueryParams from '@/hooks/useQueryParams';
import { formatAmount } from '@/lib/helpers';
import { ISingleProperty } from '@/lib/types';
import { getSingleProperty } from '@/services/sanity/properties.sanity';
import investmentService from '@/services/supabase/investment.service';
import useUserStore from '@/states/user-store';
import { motion } from 'framer-motion';
import { Check, Clock, Copy, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const walletAddress = '0x9834fA77cC029fC8bC1AAdDe03D43d9134e412a7';

type Props = {
  planName: string;
  amount: number;
  currency: string;
};

const PaymentPendingNotice = ({ planName, amount, currency }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center space-y-6 bg-white/5 rounded-2xl p-8 shadow-xl max-w-md mx-auto mt-12"
    >
      {/* Icon */}
      <div className="flex flex-col items-center justify-center space-y-3">
        <Wallet className="h-10 w-10 text-yellow-400" />
        <h2 className="text-xl font-semibold text-white">
          Awaiting Payment Confirmation
        </h2>
        <p className=" text-sm max-w-sm">
          You’ve initiated an investment in the <strong>{planName}</strong> plan
          worth <strong>{formatAmount(amount)}</strong>. Once your payment is
          confirmed on the blockchain, your investment will become{' '}
          <span className="text-green-400 font-medium">active</span>.
        </p>
      </div>

      {/* Status Section */}
      <div className="bg-[#FFFFFF0A] border border-[#FFFFFF1A] rounded-xl w-full p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="text-yellow-500 h-5 w-5" />
          <p className=" text-sm">Status: Pending Confirmation</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full">
        <Link href="/dashboard" className="flex-1">
          <Button className="w-full ">View My Investments</Button>
        </Link>
      </div>

      {/* Footer hint */}
      <p className="text-xs text-gray-400 max-w-sm">
        ⚠️ It may take a few minutes for blockchain or bank transfers to be
        confirmed.
      </p>
    </motion.div>
  );
};

import { Suspense } from 'react';

function PropertyIdWrapper({ children }: { children: (propertyId: string | null) => React.ReactNode }) {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('id');
  return <>{children(propertyId)}</>;
}

const ConfirmInvestment = () => {
  const [plan, setPlan] = useState<null | ISingleProperty>();
  return (
    <Suspense fallback={<div>Loading investment...</div>}>
      <PropertyIdWrapper>
        {(propertyId) => {
          // ...existing code...
          // Move all state and logic inside this render function
          const [plan, setPlan] = useState<null | ISingleProperty>();
          const [openModal, setOpenModal] = useState(false);
          const { userId, isAuthenticated } = useUserStore((state) => state);
          const [amount, setAmount] = useState('');
          const [copied, setCopied] = useState(false);
          const [confirmed, setConfirmed] = useState(false);
          const [isSending, setIsSending] = useState(false);
          const { setQueryParams, getQueryParams } = useQueryParams();
          const { success } = getQueryParams();

          useEffect(() => {
            (async () => {
              if (!propertyId) return;
              const res: ISingleProperty = await getSingleProperty({
                id: propertyId,
              });
              if (res) {
                setPlan(res);
                setAmount(res.price.toString());
              }
            })();
          }, [propertyId]);

          const handleInvest = async () => {
            setIsSending(true);
            try {
              const res = await investmentService.createInvestment({
                user_id: userId,
                amount_invested: Number(amount),
                sanity_id: plan?._id,
                investment_type: 'property',
                roi_rate: 10,
                duration_months: 12,
                status: 'pending',
              });
              setQueryParams({ success: 'true' });
              console.log(res, 'res');
            } catch (error) {
              toast({
                title: 'Error',
                description: 'Something went wrong',
                variant: 'destructive',
              });
            }
          };

          const handleCopy = async () => {
            await navigator.clipboard.writeText(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          };

          return (
            <div>
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
                    {success && (
                      <PaymentPendingNotice
                        amount={plan?.price || 0}
                        currency="USD"
                        planName="Property"
                      />
                    )}
                    {!success && (
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 flex flex-col gap-4">
                          <Card className=" shadow-sm">
                            <CardHeader>
                              <h2 className="text-xl font-semibold">
                                {plan?.propertyType.title} Plan
                              </h2>
                              <p className="text-gray-500">
                                {formatAmount(plan?.price || 0)}
                              </p>
                            </CardHeader>
                            <CardContent>
                              <h2>Amenities</h2>
                              <ul className="text-gray-600 list-disc ml-5 space-y-1">
                                {plan?.amenities.map((f, i) => (
                                  <li key={i}>{f}</li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader>
                              <h3 className="font-semibold">Investment Details</h3>
                            </CardHeader>
                            <CardContent>
                              <label className="block text-sm font-medium mb-2">
                                Enter Investment Amount (USD)
                              </label>
                              <Input
                                disabled
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="e.g. 5000"
                                className="w-full"
                              />
                            </CardContent>
                          </Card>
                        </div>
                        <div className="flex-1 flex flex-col gap-4">
                          <Card>
                            <CardHeader>
                              <h3 className="font-semibold">Send Payment</h3>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <p className="text-gray-600">
                                Send your investment amount to the wallet address below:
                              </p>
                              <div className="flex items-center justify-between border rounded-lg p-3 bg-gray-50">
                                <code className="text-sm font-mono text-gray-700">
                                  6774747t38t684748484
                                </code>
                                <Button variant="ghost" size="sm" onClick={handleCopy}>
                                  {copied ? <Check size={16} /> : <Copy size={16} />}
                                </Button>
                              </div>
                              <div className="mt-2 text-sm text-gray-500">
                                Network:{' '}
                                <span className="font-medium">ERC20 (USDT)</span>
                              </div>
                            </CardContent>
                          </Card>
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
                                onClick={() => {
                                  if (!isAuthenticated) {
                                    setOpenModal(true);
                                    return;
                                  }
                                  handleInvest();
                                }}
                              >
                                {isSending ? 'Verifying Payment...' : 'Confirm Payment'}
                              </Button>
                            </CardFooter>
                          </Card>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
              <LoginModal open={openModal} onClose={() => setOpenModal(false)} />
            </div>
          );
        }}
      </PropertyIdWrapper>
    </Suspense>
  );
};

export default ConfirmInvestment;
