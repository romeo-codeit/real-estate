
"use client";

import { useMemo, useRef } from 'react';

type LogoItem = {
  name: string;
  slug: string;
  href?: string;
};

const LOGOS: LogoItem[] = [
  { name: 'JPMorgan Chase & Co.', slug: 'jpmorgan-chase', href: 'https://www.jpmorganchase.com' },
  { name: 'Goldman Sachs', slug: 'goldman-sachs', href: 'https://www.goldmansachs.com' },
  { name: 'Morgan Stanley', slug: 'morgan-stanley', href: 'https://www.morganstanley.com' },
  { name: 'Citigroup', slug: 'citigroup', href: 'https://www.citigroup.com' },
  { name: 'Bank of America', slug: 'bank-of-america', href: 'https://www.bankofamerica.com' },
  { name: 'Blackstone', slug: 'blackstone', href: 'https://www.blackstone.com' },
  { name: 'Brookfield', slug: 'brookfield', href: 'https://www.brookfield.com' },
  { name: 'KKR', slug: 'kkr', href: 'https://www.kkr.com' },
  { name: 'CBRE', slug: 'cbre', href: 'https://www.cbre.com' },
  { name: 'JLL', slug: 'jll', href: 'https://www.jll.com' },
  { name: 'Cushman & Wakefield', slug: 'cushman-and-wakefield', href: 'https://www.cushmanwakefield.com' },
  { name: 'Prologis', slug: 'prologis', href: 'https://www.prologis.com' },
  { name: 'Hilton', slug: 'hilton', href: 'https://www.hilton.com' },
  { name: 'Marriott International', slug: 'marriott', href: 'https://www.marriott.com' },
  { name: 'Hyatt Hotels', slug: 'hyatt', href: 'https://www.hyatt.com' },
];

export function SponsorCarousel() {
  const loopLogos = useMemo(() => [...LOGOS, ...LOGOS, ...LOGOS], []);

  return (
    <section aria-label="Our trusted sponsors" className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Our Trusted Partners</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            We are proud to collaborate with leading companies in the finance and real estate sectors.
          </p>
        </div>
        <div className="relative overflow-hidden group">
          <div
            className="flex items-center gap-16 animate-infinite-scroll group-hover:[animation-play-state:paused]"
          >
            {loopLogos.map((item, idx) => {
              const src = `https://img.logoipsum.com/298.svg`; // Placeholder logo
              const img = (
                <img
                  src={`https://logo.clearbit.com/${new URL(item.href!).hostname}`}
                  alt={`${item.name} logo`}
                  loading="lazy"
                  className="h-12 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                />
              );
              return (
                <a
                  key={`${item.slug}-${idx}`}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                  aria-label={`Visit ${item.name}`}
                >
                  {img}
                </a>
              );
            })}
          </div>
          <div
            className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-background to-transparent"
            aria-hidden="true"
          />
          <div
            className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-background to-transparent"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
