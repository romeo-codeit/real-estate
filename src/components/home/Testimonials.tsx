import { getTestimonials } from '@/lib/data';
import { TestimonialCard } from './TestimonialCard';

export async function Testimonials() {
  const testimonials = await getTestimonials();

  return (
    <section className="py-20 sm:py-28 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">What Our Clients Say</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            We are trusted by our clients for our exceptional service and commitment to their success.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}
