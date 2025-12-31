import { Card, CardContent } from '@/components/ui/card';
import type { Testimonial } from '@/lib/types';
import { Star } from 'lucide-react';

interface TestimonialCardProps {
  testimonial: Testimonial;
}

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <Card className="flex flex-col h-full rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6 flex flex-col h-full">
        <header className="flex items-center gap-4 mb-4">
          <Avatar className="w-14 h-14 ring-1 ring-border">
            <AvatarImage src={testimonial.image} alt={testimonial.name} data-ai-hint={testimonial.data_ai_hint} />
            <AvatarFallback className="bg-primary text-primary-foreground">{testimonial.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{testimonial.name}</h3>
            <p className="text-sm text-muted-foreground">{testimonial.company}</p>
          </div>
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} fill="currentColor" className="w-4 h-4" />
            ))}
          </div>
        </header>

        <blockquote className="text-muted-foreground flex-grow text-left leading-relaxed">“{testimonial.comment}”</blockquote>

        {/* optional metadata row (kept minimal for consistency) */}
        <div className="mt-6">
          <span className="text-xs text-muted-foreground">Verified client</span>
        </div>
      </CardContent>
    </Card>
  );
}
