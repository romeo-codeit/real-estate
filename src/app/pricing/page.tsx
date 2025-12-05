
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { formatAmount } from '@/lib/helpers';
import { IPlan } from '@/lib/types';
import { getPlans } from '@/services/sanity/plans.sanity';
import { Check, Star, Zap, Crown } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const planIcons = {
  'Starter': Zap,
  'Growth': Star,
  'Enterprise': Crown,
};

export default async function PricingPage() {
  const plans: IPlan[] = await getPlans();

  if (!plans) {
    notFound();
  }

  // Fallback sample plans if none in Sanity
  const samplePlans: IPlan[] = plans.length > 0 ? plans : [
    {
      _id: 'starter',
      _createdAt: new Date().toISOString(),
      name: 'Starter',
      popular: false,
      priceRange: { minPrice: 1000, maxPrice: 5000 },
      features: ['Basic property listing', 'Email support', '1 user account', 'Basic analytics'],
      price: '1000',
    } as IPlan,
    {
      _id: 'growth',
      _createdAt: new Date().toISOString(),
      name: 'Growth',
      popular: true,
      priceRange: { minPrice: 5000, maxPrice: 20000 },
      features: ['Featured property listings', 'Priority support', '5 user accounts', 'Advanced analytics', 'Marketing tools'],
      price: '5000',
    } as IPlan,
    {
      _id: 'enterprise',
      _createdAt: new Date().toISOString(),
      name: 'Enterprise',
      popular: false,
      priceRange: { minPrice: 20000, maxPrice: 100000 },
      features: ['Unlimited listings', 'Dedicated support', 'Unlimited users', 'Custom integrations', 'White-label solution'],
      price: '20000',
    } as IPlan,
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Start your real estate journey with the perfect plan. Scale as you grow with our flexible pricing options.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              No setup fees
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              30-day money back
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {samplePlans.slice(0, 3).map((plan) => {
            const IconComponent = planIcons[plan.name as keyof typeof planIcons] || Star;
            return (
              <Card
                key={plan._id}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? 'border-primary shadow-lg ring-2 ring-primary/20 scale-105'
                    : 'hover:scale-102'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary/80 text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}

                <CardHeader className="text-center pb-4 pt-8">
                  <div className="flex justify-center mb-4">
                    <div className={`p-3 rounded-full ${plan.popular ? 'bg-primary/10' : 'bg-muted'}`}>
                      <IconComponent className={`h-8 w-8 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-base">
                    Perfect for {plan.name === 'Starter' ? 'getting started' : plan.name === 'Growth' ? 'growing businesses' : 'large enterprises'}
                  </CardDescription>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-primary">
                        ${plan.priceRange.minPrice.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Up to ${plan.priceRange.maxPrice.toLocaleString()} in value
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="px-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="px-6 pb-8 pt-6">
                  <Button
                    asChild
                    className={`w-full py-3 text-base font-semibold ${
                      plan.popular
                        ? 'bg-primary hover:bg-primary/90 shadow-lg'
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    <Link href={`/pricing/${plan._id}`}>
                      Get Started with {plan.name}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-card py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="fees" className="border-b border-border/50">
                  <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                    What are the fees?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-2">
                    Our fees vary depending on the services you use. All pricing is transparent with no hidden costs. Check individual plan details for specific fee structures.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="security" className="border-b border-border/50">
                  <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                    How is my investment secured?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-2">
                    We use a variety of security measures to protect your investment. All transactions are processed through secure channels, and we work with trusted partners to ensure the safety of your funds.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="change-plans" className="border-b border-border/50">
                  <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                    Can I change plans anytime?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-2">
                    Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="setup-fee" className="border-b border-border/50">
                  <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                    Is there a setup fee?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-2">
                    No setup fees! All plans include a 30-day money-back guarantee.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="enterprise">
                  <AccordionTrigger className="text-lg font-semibold hover:text-primary transition-colors">
                    Do you offer custom enterprise solutions?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-2">
                    Absolutely! Contact our sales team for custom pricing and features tailored to your needs.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
