import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { IProperty } from '@/lib/types';
import { Bath, BedDouble, SquareGanttChart } from 'lucide-react';
import { formatAmount } from '@/lib/helpers';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

interface PropertyCardProps {
  property: IProperty | null;
}

import PropertyCardPremium from './PropertyCardPremium';

export function PropertyCard({ property }: PropertyCardProps) {
  // Keep skeleton behavior for loading / placeholder use-cases
  if (!property) {
    return (
      <Card className="overflow-hidden shadow-lg flex flex-col h-full">
        <Skeleton className="h-56 w-full" />
        <CardContent className="p-6 flex-grow space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-10 w-full" />
          <div className="flex justify-around items-center border-t border-b py-3 text-sm">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/4" />
          </div>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  // For now render the premium card everywhere (replaces previous layout)
  return <PropertyCardPremium property={property} />;
}
