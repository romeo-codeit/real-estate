import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Check, ArrowRight, Users } from 'lucide-react';

export async function OurAgents() {
  const agentBenefits = [
    "Licensed real estate professionals",
    "Deep local market expertise",
    "Personalized property guidance",
    "24/7 support throughout your journey",
  ];

  return (
    <section className="py-20 sm:py-28 bg-card">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Meet Our Expert Agents
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Connect with our licensed real estate professionals who bring local market expertise and personalized guidance to help you find your perfect property.
          </p>
        </div>

        <div className="mt-16 grid lg:grid-cols-2 items-center gap-12">
          {/* CTA Card */}
          <div className="order-2 lg:order-1 bg-background border border-border/50 rounded-2xl p-10 text-center shadow-lg transform hover:-translate-y-2 transition-transform duration-300">
            <Users className="w-12 h-12 text-primary mx-auto mb-6" />
            <h3 className="text-3xl font-bold mb-4">Find Your Perfect Agent</h3>
            <p className="text-muted-foreground text-lg mb-8">
              Browse our complete team of experienced agents and find the perfect match for your real estate needs.
            </p>
            <Button asChild size="lg" className="w-full md:w-auto">
              <Link href="/agents">
                View All Agents
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Benefits List */}
          <div className="order-1 lg:order-2 space-y-8">
            <h3 className="text-3xl font-semibold">Why Work With Our Agents?</h3>
            <ul className="space-y-4">
              {agentBenefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-4">
                  <div className="flex-shrink-0 bg-primary/10 text-primary rounded-full p-2">
                    <Check className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
