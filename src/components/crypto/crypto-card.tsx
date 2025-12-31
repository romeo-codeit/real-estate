'use client';
import { formatAmount } from '@/lib/helpers';
import { ICrypto } from '@/lib/types';
import { Star, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';

const CryptoCard = ({ item }: { item: ICrypto }) => {
  const router = useRouter();

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 flex flex-col h-full">
      <CardHeader className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-card/5 text-muted-foreground font-bold p-2 px-3 rounded-lg text-sm">
              {item.symbol}
            </div>
            <div>
              <CardTitle className="text-xl font-semibold leading-none">
                {item.name}
              </CardTitle>
              <p className="text-muted-foreground text-base leading-none">${item.price}</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-yellow-500 transition-colors">
            <Star className="h-6 w-6" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 flex-grow">
        <p className="text-muted-foreground text-sm mb-6">{item.description}</p>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">24h Change</span>
            <div className="flex items-center font-medium">
              <TrendingUp className="h-4 w-4" />
              <span className="text-lg">↑</span> {item.change24h}%
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Expected ROI</span>
            <span className="font-medium">+{item.expectedROI}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Risk Level</span>
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {item.riskLevel}
            </Badge>
          </div>
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Min. Investment</span>
              <span className="font-semibold">
                {formatAmount(item.minInvestment || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Market Cap</span>
              <span className="font-semibold">
                {formatAmount(+item?.marketCap || 0)}B
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button onClick={() => router.push(`/crypto/${item._id}`)} className="w-full">
          Invest Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CryptoCard;
