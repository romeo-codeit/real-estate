import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function AboutRealvest() {
  return (
    <section className="py-20 sm:py-28 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="relative">
              <Image
                src="/images/about-us.jpg"
                alt="Modern building exterior"
                width={600}
                height={400}
                className="rounded-xl shadow-2xl w-full h-auto object-cover transform hover:scale-105 transition-transform duration-500"
                data-ai-hint="modern building"
              />
              <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-6 rounded-xl shadow-lg flex flex-col items-center justify-center w-40 h-40">
                <p className="text-5xl font-extrabold leading-none">20%</p>
                <p className="text-sm font-semibold tracking-wide uppercase">Avg. ROI</p>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
              Your Trusted Real Estate Partner
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We specialize in providing a streamlined platform for real estate investors to discover lucrative opportunities. Our user-friendly interface offers access to a diverse range of properties, complete with detailed analytics and expert guidance to help you make informed decisions.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Whether you're a seasoned investor or just getting started, RealVest is your trusted partner for success in the real estate market.
            </p>
            <div className="pt-4">
              <Button asChild size="lg">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
