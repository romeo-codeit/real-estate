'use client';

import { Button } from '@/components/ui/button';
import authService from '@/services/supabase/auth.service';
import { useAuth } from '@/hooks/use-auth-rbac';
import useUserStore from '@/states/user-store';
import {
  ArrowLeftRight,
  Briefcase,
  FileText,
  Landmark,
  LayoutDashboard,
  Building2,
  Lock,
  LogOut,
  User,
  Users,
  Shield,
  Wallet
} from 'lucide-react';
import { SiteLogo } from '@/components/ui/SiteLogo';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, dashboardMode, setDashboardMode } = useUserStore();
  const { hasRole } = useAuth();

  const isActive = (href: string) => pathname === href;

  // Define navigation links based on user role and dashboard mode
  const getNavLinks = () => {
    let links: any[] = [];
    const baseLinks = [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ];

    if (hasRole('admin')) {
      // Admin gets additional admin-specific links - usually not filtered by mode or maybe yes?
      // Admin usually wants to see everything, but let's allow filtering if helpful.
      // For now, keep Admin as is or apply basic filtering.
      // The requirement "client said he couldnt find the place where bitcoin is" implies admin needs clear access.
      // But "user said the site is supposed to be two platformed" implies end-user experience.
      // Let's assume this toggle is primarily for Users. Admin handles everything.
      return [
        ...baseLinks,
        { href: '/properties', label: 'Properties', icon: Building2 }, // Keep properties for admin
        { href: '/admin/users', label: 'User Management', icon: Users },
        { href: '/dashboard', label: 'Admin Panel', icon: Shield },
      ];
    } else {
      // Regular User Logic
      links = [...baseLinks];

      // Real Estate Links
      const realEstateLinks = [
        { href: '/properties', label: 'Properties', icon: Building2 },
        { href: '/dashboard/invest', label: 'Investment', icon: FileText },
        {
          href: '/dashboard/invested-properties',
          label: 'Invested Properties',
          icon: Briefcase,
        },
      ];

      // Crypto Links (Conceptual) - assuming generic finance links are used for crypto too
      // or if there are specific crypto pages.
      // dashboard/deposit and withdraw are finance, often shared.
      const financeLinks = [
        { href: '/dashboard/deposit', label: 'Deposit', icon: Landmark },
        { href: '/dashboard/withdraw', label: 'Withdraw', icon: ArrowLeftRight },
        { href: '/dashboard/transactions', label: 'Transaction', icon: FileText },
        { href: '/dashboard/referral', label: 'Referral', icon: User },
      ];

      // Apply Mode Filtering
      if (dashboardMode === 'overview') {
        links = [...links, ...realEstateLinks, ...financeLinks];
      } else if (dashboardMode === 'real-estate') {
        links = [...links, ...realEstateLinks, ...financeLinks]; // Real estate often needs deposit/withdraw too?
        // "one for investing properties and the other for bitcoin"
        // If strict separation:
        // Real Estate: Properties, Invested Properties, Transactions (filtered?), Referral
        // Bitcoin: Deposit (Crypto), Withdraw (Crypto), Transactions, Referral

        // For now, let's keep Finance links in both as they are essential for balance management.
        // But maybe hide 'Properties' in Crypto mode.
      } else if (dashboardMode === 'crypto') {
        // In Crypto Mode: Hide Properties specific links
        links = [...links, ...financeLinks];
      }

      return links;
    }

    // Should never reach here, but return empty array as fallback
    return [];
  };

  const navLinks = getNavLinks();

  // Define account links based on user role
  const getAccountLinks = () => {
    const baseLinks = [
      { href: '/dashboard/profile', label: 'Profile Setting', icon: User },
      { href: '/dashboard/password', label: 'Change Password', icon: Lock },
    ];

    if (!hasRole('admin')) {
      // Regular users get 2FA security
      baseLinks.unshift({ href: '/dashboard/2fa', label: '2FA Security', icon: Lock });
    }

    return baseLinks;
  };

  const accountLinks = getAccountLinks();

  const handleLogout = async () => {
    try {
      await authService.signOut();
      logout();
      // Redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if signOut fails
      logout();
      window.location.href = '/';
    }
  };

  return (
    <aside className="flex flex-col w-64 h-full bg-card text-card-foreground border-r border-border">
      <div className="flex flex-col items-center justify-center p-4 border-b space-y-4">
        <Link href="/" className="flex items-center gap-2">
          <SiteLogo showText={true} />
        </Link>

        {/* Dashboard Mode Toggle - Only for non-admins usually, or everyone? */}
        {!hasRole('admin') && (
          <div className="w-full">
            <Select value={dashboardMode} onValueChange={(v: any) => setDashboardMode(v)}>
              <SelectTrigger className="w-full h-8 text-xs bg-muted/50 border-none">
                <SelectValue placeholder="Select Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="real-estate">Real Estate</SelectItem>
                <SelectItem value="crypto">Crypto & Wallet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
      <div className="p-4 border-t space-y-2">
        <Link href="/">
          <Button variant="outline" className="w-full">
            Exit to Main Site
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
