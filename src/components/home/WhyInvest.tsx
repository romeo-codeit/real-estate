import { ShieldCheck, Eye, TrendingUp, LifeBuoy } from 'lucide-react';

export function WhyInvest() {
  const features = [
    {
      icon: <ShieldCheck className="w-10 h-10 text-primary" />,
      title: 'Secure Investment',
      description: 'Rest assured with our secure investment solutions, your financial future is protected',
    },
    {
      icon: <Eye className="w-10 h-10 text-primary" />,
      title: 'Transparent Platform',
      description: 'Experience the confidence of a transparent platform for your peace of mind',
    },
    {
      icon: <TrendingUp className="w-10 h-10 text-primary" />,
      title: 'Passive Income',
      description: 'Explore opportunities for generating passive income streams',
    },
    {
      icon: <LifeBuoy className="w-10 h-10 text-primary" />,
      title: 'Support',
      description: 'Count on our dedicated support team for prompt and reliable assistance',
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Why Invest in Real Estate?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col items-center p-6 bg-background rounded-lg shadow-sm border">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
