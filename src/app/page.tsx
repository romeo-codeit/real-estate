import { AboutRealvest } from '@/components/home/AboutRealvest';
import { FeaturedProperties } from '@/components/home/FeaturedProperties';
import { LatestNews } from '@/components/home/LatestNews';
import { OurAgents } from '@/components/home/OurAgents';
import { PricingPlans } from '@/components/home/PricingPlans';
import { SponsorCarousel } from '@/components/home/SponsorCarousel';
import { Testimonials } from '@/components/home/Testimonials';
import { WhyInvest } from '@/components/home/WhyInvest';
import { SearchFilters } from '@/components/properties/SearchFilters';
import Image from 'next/image';

export default async function Home() {
  return (
    <>
      <section className="relative h-[70vh] min-h-[450px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/hero-img.jpg"
          alt="Luxury home with a pool at dusk"
          width={1920}
          height={1080}
          className="absolute z-0 w-full h-full object-cover"
          data-ai-hint="modern house exterior"
          priority
        />
        <div className="absolute inset-0 bg-black/75" />
        <div className="relative z-10 text-center p-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-lg">
            Find Your Dream Home
          </h1>
          <p className="text-lg md:text-xl mb-8 drop-shadow-md">
            We help you find the best properties in town, turning your dreams
            into reality.
          </p>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg animate-fade-in sticky top-8">
            <SearchFilters />
          </div>
        </div>
        {/* Animated scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
          <span className="animate-bounce text-white text-3xl">↓</span>
        </div>
      </section>

      <div className="bg-card py-4 md:py-6">
        <WhyInvest />
      </div>
      <div className="bg-background py-4 md:py-6">
        <FeaturedProperties />
      </div>
      <div className="bg-card py-4 md:py-6">
        <AboutRealvest />
      </div>
      <div className="bg-background py-4 md:py-6">
        <PricingPlans />
      </div>
      <div className="bg-card py-4 md:py-6">
        <Testimonials />
      </div>
      <div className="bg-background py-4 md:py-6">
        <SponsorCarousel />
      </div>
      <div className="bg-card py-4 md:py-6">
        <OurAgents />
      </div>
      <div className="bg-background py-4 md:py-6">
        <LatestNews />
      </div>
    </>
  );
}
