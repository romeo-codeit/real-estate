import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { Testimonial } from '@/lib/types';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="flex flex-col h-full bg-background border border-border/50 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="p-6 pb-4">
        <div className="flex text-yellow-400 gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} fill="currentColor" className="w-5 h-5" />
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0 flex-grow flex flex-col">
        <blockquote className="text-lg text-foreground mb-6 flex-grow">
          &quot;{testimonial.comment}&quot;
        </blockquote>
        <div className="flex items-center">
          {/* <Avatar className="w-12 h-12 mr-4 border-2 border-primary/20">
            <AvatarImage src={testimonial.image} alt={testimonial.name} data-ai-hint={testimonial.data_ai_hint} />
            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
          </Avatar> */}
          <div>
            <h3 className="font-semibold text-base">{testimonial.name}</h3>
            <p className="text-sm text-muted-foreground">{testimonial.company}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
