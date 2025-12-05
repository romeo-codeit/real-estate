import Link from 'next/link';
import { Building2, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-white">RealEstate Explorer</span>
            </Link>
            <p className="text-gray-400">Your partner in finding the perfect property. We offer expert advice and a wide range of listings.</p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/properties" className="hover:text-primary transition-colors">All Properties</Link></li>
              <li><Link href="/agents" className="hover:text-primary transition-colors">Our Agents</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Contact Us</h3>
            <ul className="space-y-2 text-gray-400">
              <li>123 Real Estate Ave, Suite 500</li>
              <li>New York, NY 10001</li>
              <li>contact@realestate-explorer.com</li>
              <li>+1 (234) 567-8900</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-white">Follow Us</h3>
            <div className="flex gap-4">
              <a href="#" aria-label="Facebook" className="hover:text-primary transition-colors"><Facebook /></a>
              <a href="#" aria-label="Twitter" className="hover:text-primary transition-colors"><Twitter /></a>
              <a href="#" aria-label="Instagram" className="hover:text-primary transition-colors"><Instagram /></a>
              <a href="#" aria-label="LinkedIn" className="hover:text-primary transition-colors"><Linkedin /></a>
            </div>
          </div>
        </div>
        <Separator className="my-8 bg-gray-700" />
        <div className="text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} RealEstate Explorer. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
