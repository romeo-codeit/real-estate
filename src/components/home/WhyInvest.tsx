import { ShieldCheck, Eye, TrendingUp, LifeBuoy } from 'lucide-react';

export function WhyInvest() {
  const features = [
    {
      icon: ShieldCheck,
      title: 'Secure Investment',
      description: 'Rest assured with our secure investment solutions, your financial future is protected.',
    },
    {
      icon: Eye,
      title: 'Transparent Platform',
      description: 'Experience the confidence of a transparent platform for your peace of mind.',
    },
    {
      icon: TrendingUp,
      title: 'Passive Income',
      description: 'Explore opportunities for generating passive income streams.',
    },
    {
      icon: LifeBuoy,
      title: 'Dedicated Support',
      description: 'Count on our dedicated support team for prompt and reliable assistance.',
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Why Invest with Us?</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            We provide a secure and transparent platform to grow your wealth through real estate.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group p-8 bg-card border border-border/50 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-center h-16 w-16 mb-6 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
