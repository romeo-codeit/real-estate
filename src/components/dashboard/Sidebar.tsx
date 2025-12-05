'use client';

import { Button } from '@/components/ui/button';
import authService from '@/services/supabase/auth.service';
import {
  ArrowLeftRight,
  Briefcase,
  Building2,
  FileText,
  Landmark,
  LayoutDashboard,
  Lock,
  LogOut,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/properties', label: 'Properties', icon: Building2 },
  { href: '/dashboard/invest', label: 'Investment', icon: FileText },
  {
    href: '/dashboard/invested-properties',
    label: 'Invested Properties',
    icon: Briefcase,
  },
  { href: '/dashboard/deposit', label: 'Deposit', icon: Landmark },
  { href: '/dashboard/withdraw', label: 'Withdraw', icon: ArrowLeftRight },
  { href: '/dashboard/transactions', label: 'Transaction', icon: FileText },
  { href: '/dashboard/referral', label: 'Referral', icon: User },
];

const accountLinks = [
  { href: '/dashboard/2fa', label: '2FA Security', icon: Lock },
  { href: '/dashboard/profile', label: 'Profile Setting', icon: User },
  { href: '/dashboard/password', label: 'Change Password', icon: Lock },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    try {
      const res = await authService.logout();
      if (res) {
        router.push('/login');
      }
    } catch (error) {}
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-card text-card-foreground border-r border-border">
      <div className="flex items-center justify-center h-16 border-b">
        <Link href="/" className="flex items-center gap-2">
          <Building2 className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">RealEstate Explorer</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Menu
          </h3>
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>
                  <Button
                    variant={isActive(link.href) ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                  >
                    <link.icon className="mr-2 h-5 w-5" />
                    {link.label}
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Account
          </h3>
          <ul className="space-y-1">
            {accountLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>
                  <Button
                    variant={isActive(link.href) ? 'secondary' : 'ghost'}
                    className="w-full justify-start"
                  >
                    <link.icon className="mr-2 h-5 w-5" />
                    {link.label}
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <div className="p-4 border-t">
        <Link href="/login">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </Link>
      </div>
    </aside>
  );
}
