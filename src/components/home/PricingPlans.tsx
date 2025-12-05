import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Check, Star, ArrowRight, DollarSign } from 'lucide-react';

export async function PricingPlans() {
  const benefits = [
    "No hidden fees",
    "24/7 customer support",
    "Secure blockchain payments",
    "Flexible investment terms",
  ];

  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium">
            <DollarSign className="w-4 h-4 mr-2" />
            Investment Plans
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Investment Plan</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Start your real estate journey with the perfect plan. Scale as you grow with our flexible pricing options.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 max-w-2xl mx-auto">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-0 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-medium">{benefit}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-md mx-auto border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-8">
              <Star className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-4">Ready to Invest?</h3>
              <p className="text-muted-foreground mb-6">Explore our detailed pricing plans and find the perfect match for your goals.</p>
              <Button asChild size="lg" className="w-full">
                <Link href="/pricing" className="flex items-center justify-center gap-2">
                  View Pricing Plans
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
