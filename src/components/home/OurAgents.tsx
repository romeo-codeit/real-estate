import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Check, Users, ArrowRight, UserCheck } from 'lucide-react';

export async function OurAgents() {
  const benefits = [
    "Licensed real estate professionals",
    "Local market expertise",
    "Personalized property guidance",
    "24/7 support throughout your journey",
  ];

  return (
    <section className="py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium">
            <Users className="w-4 h-4 mr-2" />
            Our Team
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Expert Agents</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Connect with our licensed real estate professionals who bring local market expertise and personalized guidance to help you find your perfect property.
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
              <UserCheck className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-4">Find Your Agent</h3>
              <p className="text-muted-foreground mb-6">Browse our complete team of experienced agents and find the perfect match for your real estate needs.</p>
              <Button asChild size="lg" className="w-full">
                <Link href="/agents" className="flex items-center justify-center gap-2">
                  View All Agents
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
