import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Button } from '@/components/ui/button';

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-card via-card to-accent/20 border-t border-border/50">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />

      <div className="container mx-auto px-4 pt-16 pb-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand section */}
          <div className="space-y-5">
            <Link href="/" className="inline-block mb-3 hover:opacity-80 transition-opacity">
              <SiteLogo />
            </Link>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Your partner in finding the perfect property. We offer expert advice and a wide range of listings.
            </p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/properties">View Properties</Link>
            </Button>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-base mb-5 text-foreground tracking-wide uppercase text-sm">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/properties" className="text-muted-foreground hover:text-primary transition-colors text-sm inline-flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  All Properties
                </Link>
              </li>
              <li>
                <Link href="/agents" className="text-muted-foreground hover:text-primary transition-colors text-sm inline-flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  Our Agents
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm inline-flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors text-sm inline-flex items-center gap-2 group">
                  <span className="w-1 h-1 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-base mb-5 text-foreground tracking-wide uppercase text-sm">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                <span>123 Real Estate Ave, Suite 500<br />New York, NY 10001</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="mailto:contact@cardonecapvest.com">contact@cardonecapvest.com</a>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <a href="tel:+12345678900">+1 (234) 567-8900</a>
              </li>
            </ul>
          </div>

          {/* Social & Newsletter */}
          <div>
            <h3 className="font-bold text-base mb-5 text-foreground tracking-wide uppercase text-sm">Stay Connected</h3>
            <p className="text-muted-foreground text-sm mb-4">Follow us on social media for updates and listings.</p>
            <div className="flex gap-3">
              <a
                href="#"
                aria-label="Facebook"
                className="h-10 w-10 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center group"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="h-10 w-10 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center group"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="h-10 w-10 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center group"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="h-10 w-10 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center group"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Cardone Capvest. All Rights Reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
