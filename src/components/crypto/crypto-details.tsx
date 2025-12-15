'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, TrendingUp, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import Stepper from '@/components/crypto/stepper';
import CryptoPaymentStep from '@/components/crypto/crypto-payment';
import InvestmentProjectionStep from '@/components/crypto/investment-projection';
import InvestmentSummaryCard from '@/components/crypto/summary-card';
import { ICrypto, IInvestment } from '@/lib/types';
import investmentService from '@/services/supabase/investment.service';
import useUserStore from '@/states/user-store';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { formatAmount } from '@/lib/helpers';

export const investmentSchema = z.object({
  investmentAmount: z.number().min(15, { message: 'Minimum investment: $15' }),
  investmentPeriod: z.enum(['3_months', '6_months', '12_months', '24_months'], {
    errorMap: () => ({ message: 'Please select an investment period.' }),
  }),
});

export type InvestmentFormData = z.infer<typeof investmentSchema>;

type Props = {
  id: string;
  initialData?: ICrypto | null;
};

const CryptoDetails = ({ id, initialData }: Props) => {
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();
  const { userId } = useUserStore((state) => state);
  const [details, setDetails] = useState<ICrypto | null>(initialData || null);
  const [investmentId, setInvestmentId] = useState<string>('');

  const form = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      investmentAmount: 200,
      investmentPeriod: '12_months',
    },
    mode: 'onChange',
  });

  const onSubmit = (data: InvestmentFormData) => {
    handleNextStep();
  };

  const validateCurrentStep = async () => {
    const isValid = await form.trigger([
      'investmentAmount',
      'investmentPeriod',
    ]);
    return isValid;
  };

  const handleNextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  if (!details) {
    return (
      <div className="bg-card min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Return to previous page</span>
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-muted p-2 rounded-lg">
              <span className="font-bold text-lg">{details.symbol}</span>
            </div>
            <h1 className="text-3xl font-bold">{details.name}</h1>
          </div>
        </div>

        <Card className="shadow-lg max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Configure Your Investment</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Subtle crypto info section */}
            <div className="mb-6 p-4 bg-muted/30 rounded-lg border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Price</span>
                  <div className="font-medium">${details.price}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">24h Change</span>
                  <div className={`font-medium ${details.change24h && details.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {details.change24h}%
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Risk</span>
                  <div className="font-medium">
                    <Badge variant="secondary" className="text-xs">{details.riskLevel}</Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Min Invest</span>
                  <div className="font-medium">${details.minInvestment}</div>
                </div>
              </div>
            </div>

            <Stepper currentStep={currentStep} totalSteps={4} />

            {currentStep === 1 && (
              <div className="mt-8">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="investmentAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Investment Amount (USD)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                placeholder="e.g., 200"
                                className="pl-7"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                              />
                            </div>
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Minimum investment: ${details.minInvestment}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="investmentPeriod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Investment Period</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="w-full p-3 border border-input rounded-md bg-background"
                            >
                              <option value="3_months">3 Months</option>
                              <option value="6_months">6 Months</option>
                              <option value="12_months">12 Months</option>
                              <option value="24_months">24 Months</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-4 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-primary hover:bg-primary/90"
                      >
                        Review Investment
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            )}

            {currentStep === 2 && (
              <InvestmentProjectionStep
                initialInvestment={form.getValues('investmentAmount')}
                investmentPeriod={form.getValues('investmentPeriod')}
                onBack={() => setCurrentStep(1)}
                onConfirm={async () => {
                  const payload: IInvestment = {
                    amountInvested: form.getValues('investmentAmount'),
                    expectedROI: details.expectedROI ?? undefined,
                    riskLevel: details.riskLevel?.toLowerCase() ?? 'medium',
                    startDate: new Date().toISOString(),
                    type: 'crypto',
                    status: 'pending',
                    targetId: details._id,
                    userId: userId as string,
                  };

                  const insertPayload = {
                    amount_invested: payload.amountInvested,
                    roi_rate: payload.expectedROI || 0,
                    investment_type: 'crypto' as const,
                    user_id: payload.userId,
                    status: payload.status,
                    start_date: payload.startDate,
                  };

                  const result = await investmentService.createInvestment(insertPayload);
                  setInvestmentId(result.id);
                  setCurrentStep(3);
                }}
              />
            )}

            {currentStep === 3 && (
              <CryptoPaymentStep
                cryptoAddress="0x1234567890abcdef1234567890abcdef12345678"
                finalAmountUSD={form.getValues('investmentAmount')}
                cryptoSymbol={details.symbol}
                checkPaymentStatus={() => 'pending'}
                onBack={() => setCurrentStep(2)}
                onPaymentConfirmed={async () => {
                  // Update investment status to active
                  if (investmentId) {
                    await investmentService.updateInvestmentStatus(investmentId, 'active');
                  }
                  setCurrentStep(4);
                }}
              />
            )}

            {currentStep === 4 && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="bg-green-100 p-4 rounded-full">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-600 mb-2">Investment Successful!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your crypto investment in {details.name} has been activated.
                    You can track your investment progress in your dashboard.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Investment Amount:</strong> ${form.getValues('investmentAmount')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Expected ROI:</strong> +{details.expectedROI || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Investment Period:</strong> {form.getValues('investmentPeriod').replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => router.push('/dashboard')} className="bg-primary">
                    View Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/crypto')}>
                    Invest in More Crypto
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CryptoDetails;
