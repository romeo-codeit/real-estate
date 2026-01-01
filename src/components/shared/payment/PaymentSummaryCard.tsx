import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatAmount } from '@/lib/helpers';

interface PaymentSummaryCardProps {
  title: string;
  price: number | { minPrice: number; maxPrice: number };
  features?: string[];
  amenities?: string[];
  type?: 'plan' | 'property';
  className?: string;
}

export function PaymentSummaryCard({
  title,
  price,
  features = [],
  amenities = [],
  type = 'plan',
  className = ""
}: PaymentSummaryCardProps) {
  const displayPrice = typeof price === 'number'
    ? formatAmount(price)
    : `${formatAmount(price.minPrice)} - ${formatAmount(price.maxPrice)}`;

  const items = type === 'plan' ? features : amenities;
  const itemsLabel = type === 'plan' ? 'Features' : 'Amenities';

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardHeader>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted-foreground">{displayPrice}</p>
      </CardHeader>
      {items.length > 0 && (
        <CardContent>
          <h3 className="font-medium mb-2">{itemsLabel}</h3>
          <ul className="text-muted-foreground list-disc ml-5 space-y-1">
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}