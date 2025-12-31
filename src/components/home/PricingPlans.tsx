import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

export async function PricingPlans() {
  const benefits = [
    "No hidden fees",
    "24/7 customer support",
    "Secure blockchain payments",
    "Flexible investment terms",
  ];

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Choose Your Investment Plan
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start your real estate journey with the perfect plan. Scale as you grow with our flexible pricing options.
          </p>
        </div>

        <div className="mt-16 grid lg:grid-cols-2 items-center gap-12">
          {/* Benefits List */}
          <div className="space-y-8">
            <h3 className="text-3xl font-semibold">All Plans Include:</h3>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-4">
                  <div className="flex-shrink-0 bg-primary/10 text-primary rounded-full p-2">
                    <Check className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Card */}
          <div className="bg-card border border-border/50 rounded-2xl p-10 text-center shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
            <h3 className="text-3xl font-bold mb-4">Ready to Invest?</h3>
            <p className="text-muted-foreground text-lg mb-8">
              Explore our detailed pricing plans and find the perfect match for your financial goals.
            </p>
            <Button asChild size="lg" className="w-full md:w-auto">
              <Link href="/pricing">
                View All Pricing Plans
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
