'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { formatAmount } from '@/lib/helpers';
import { Button } from '../ui/button';

interface InvestmentDetailsProps {
  price: number;
  id: string;
}

export function InvestmentDetails({ price, id }: InvestmentDetailsProps) {
  const investmentPercentage = 0.2;
  const roi = price * investmentPercentage;

  return (
    <Card className="shadow-lg text-center">
      <CardHeader>
        <CardTitle>Investment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-muted-foreground">Investment Amount</p>
          <p className="text-3xl font-bold">{formatAmount(price)}</p>
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground">Return on Investment (ROI)</p>
          <p className="text-3xl font-bold text-green-600">
            +{formatAmount(roi)}
          </p>
        </div>

        <div className="bg-primary/10 p-4 rounded-lg">
          <p className="font-semibold text-primary">14-Day Profit Cashback</p>
          <p className="text-sm text-muted-foreground">
            A 20% cashback on your profit is guaranteed within 14 days.
          </p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href={`/properties/confirm_investment?id=${id}`}>
            Invest Now
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
