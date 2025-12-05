import { Card, CardContent } from '@/components/ui/card';
import type { Testimonial } from '@/lib/types';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="flex flex-col justify-between h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6 flex flex-col items-center text-center">
        {/* <Avatar className="w-20 h-20 mb-4 border-4 border-primary/20">
          <AvatarImage src={testimonial.image} alt={testimonial.name} data-ai-hint={testimonial.data_ai_hint} />
          <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
        </Avatar> */}

        <p className="text-muted-foreground mb-4 flex-grow">
          &quot;{testimonial.comment}&quot;
        </p>
        <div>
          <h3 className="font-semibold text-lg">{testimonial.name}</h3>
          <p className="text-sm text-primary">{testimonial.company}</p>
        </div>
        <div className="flex text-yellow-400 mb-4 mt-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} fill="currentColor" className="w-5 h-5" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
