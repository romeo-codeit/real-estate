import Image from 'next/image';

export function AboutRealvest() {
  return (
    <section className="py-8 md:py-12 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-extrabold text-primary mb-2">About RealVest</h2>
            <h3 className="text-lg md:text-2xl font-bold text-primary mb-4">Your Trusted Real Estate Partner</h3>
            <p className="text-muted-foreground text-base md:text-lg">
              Finding great properties for investment, we specialize in providing a streamlined platform for real estate investors to discover lucrative opportunities. Our user-friendly interface offers access to a diverse range of properties, complete with detailed analytics and expert guidance to help you make informed decisions. Whether you're a seasoned investor or just getting started, RealVest is your trusted partner for success in the real estate market.
            </p>
          </div>
          <div className="relative flex justify-center items-center">
            <div className="group relative">
              <Image
                src="/images/about-us.jpg"
                alt="Modern building exterior"
                width={600}
                height={400}
                className="rounded-lg shadow-xl w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105 animate-fade-in"
                data-ai-hint="modern building"
              />
              <div className="absolute top-4 left-4 bg-primary text-white p-3 rounded-lg shadow-lg backdrop-blur-sm flex flex-col items-center animate-fade-in">
                <p className="text-2xl font-bold leading-none">20%</p>
                <p className="text-xs font-medium">Avg. Profit Upto</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
