'use client';

import LoginModal from '@/components/shared/login-modal';
import { InvestmentPaymentMethods } from '@/components/properties/InvestmentPaymentMethods';
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
import useUserStore from '@/states/user-store';
import { motion } from 'framer-motion';
import { Check, Clock, Wallet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

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
          You've initiated an investment in the <strong>{planName}</strong> plan
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

const ConfirmInvestment = () => {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('id');

  const [plan, setPlan] = useState<null | ISingleProperty>();
  const [openModal, setOpenModal] = useState(false);
  const { userId, isAuthenticated } = useUserStore((state) => state);
  const [amount, setAmount] = useState('');
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const { setQueryParams, getQueryParams } = useQueryParams();
  const { success } = getQueryParams();

  useEffect(() => {
    (async () => {
      if (!propertyId) return;
      try {
        const response = await fetch(`/api/properties/single?id=${propertyId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch property');
        }
        const data = await response.json();
        const res: ISingleProperty = data.property;
        if (res) {
          setPlan(res);
          setAmount(res.price.toString());
        }
      } catch (error) {
        console.error('Error fetching property:', error);
      }
    })();
  }, [propertyId]);

  const handlePaymentInitiated = (txId: string, method: string) => {
    setTransactionId(txId);
    setPaymentMethod(method);
    setPaymentInitiated(true);
    setQueryParams({ success: 'true' });
  };

  const handlePaymentCompleted = () => {
    toast({
      title: 'Investment Confirmed!',
      description: 'Your investment is now active.',
    });
  };

  return (
    <div>
      <div className=" mx-auto p-8">
        <div className="max-w-4xl mx-auto py-12 px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between mb-6">
              <Link href="/properties">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">
                Review & Complete Investment
              </h1>
            </div>

            {success && paymentInitiated && (
              <PaymentPendingNotice
                amount={plan?.price || 0}
                currency="USD"
                planName={plan?.propertyType.title || "Property"}
              />
            )}

            {!success && (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Property Details */}
                <div className="space-y-4">
                  <Card className=" shadow-sm">
                    <CardHeader>
                      <h2 className="text-xl font-semibold">
                        {plan?.propertyType.title} Investment
                      </h2>
                      <p className="text-gray-500">
                        {formatAmount(plan?.price || 0)}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-medium mb-2">Property Details</h3>
                      <ul className="text-gray-600 list-disc ml-5 space-y-1">
                        {plan?.amenities.slice(0, 5).map((amenity, i) => (
                          <li key={i}>{amenity}</li>
                        ))}
                        {plan && plan.amenities.length > 5 && (
                          <li>And {plan.amenities.length - 5} more...</li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <h3 className="font-semibold">Investment Amount</h3>
                    </CardHeader>
                    <CardContent>
                      <label className="block text-sm font-medium mb-2">
                        Investment Amount (USD)
                      </label>
                      <Input
                        disabled
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Amount is fixed based on property value
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment Section */}
                <div className="space-y-4">
                  <InvestmentPaymentMethods
                    amount={parseFloat(amount) || 0}
                    onPaymentInitiated={handlePaymentInitiated}
                    onPaymentCompleted={handlePaymentCompleted}
                    propertyId={propertyId || ''}
                    propertyName={plan?.title || 'Property'}
                  />

                  <Card>
                    <CardHeader>
                      <h3 className="font-semibold">Review & Confirm</h3>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={paymentInitiated}
                          readOnly
                          className="mt-1"
                        />
                        <p className="text-sm text-gray-600">
                          I confirm that I have initiated the payment for the exact investment
                          amount to the wallet address above.
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        disabled={!paymentInitiated || !amount}
                        onClick={() => {
                          if (!isAuthenticated) {
                            setOpenModal(true);
                            return;
                          }
                          handlePaymentCompleted();
                        }}
                      >
                        {paymentInitiated ? 'Confirm Investment' : 'Complete Payment First'}
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
};

const ConfirmInvestmentPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmInvestment />
    </Suspense>
  );
};

export default ConfirmInvestmentPage;
