'use client';

import { Button } from '@/components/ui/button';
import authService from '@/services/supabase/auth.service';
import { useAuth } from '@/hooks/use-auth-rbac';
import useUserStore from '@/states/user-store';
import {
  ArrowLeftRight,
  Bell,
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
      // Admin gets all links
      return [
        ...baseLinks,
        { href: '/properties', label: 'Properties', icon: Building2 },
        { href: '/dashboard/invest', label: 'Investment', icon: FileText },
        { href: '/dashboard/invested-properties', label: 'Invested Properties', icon: Briefcase },
        { href: '/dashboard/deposit', label: 'Deposit', icon: Landmark },
        { href: '/dashboard/withdraw', label: 'Withdraw', icon: ArrowLeftRight },
        { href: '/dashboard/transactions', label: 'Transaction', icon: FileText },
        { href: '/dashboard/referral', label: 'Referral', icon: User },
        { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
        { href: '/admin', label: 'Admin Panel', icon: Shield },
      ];
    }

    // Regular User Logic - Platform specific navigation
    links = [...baseLinks];

    if (dashboardMode === 'overview') {
      // Show all options
      return [
        ...links,
        { href: '/properties', label: 'Properties', icon: Building2 },
        { href: '/dashboard/invest', label: 'Investment', icon: FileText },
        { href: '/dashboard/invested-properties', label: 'Invested Properties', icon: Briefcase },
        { href: '/dashboard/deposit', label: 'Deposit', icon: Landmark },
        { href: '/dashboard/withdraw', label: 'Withdraw', icon: ArrowLeftRight },
        { href: '/dashboard/transactions', label: 'Transaction', icon: FileText },
        { href: '/dashboard/referral', label: 'Referral', icon: User },
        { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
      ];
    } else if (dashboardMode === 'real-estate') {
      // Real Estate Platform - Property investment focused
      return [
        ...links,
        { href: '/properties', label: 'Browse Properties', icon: Building2 },
        { href: '/dashboard/invest', label: 'Invest in Property', icon: FileText },
        { href: '/dashboard/invested-properties', label: 'My Properties', icon: Briefcase },
        { href: '/dashboard/deposit', label: 'Deposit Funds', icon: Landmark },
        { href: '/dashboard/transactions', label: 'Transaction History', icon: FileText },
        { href: '/dashboard/referral', label: 'Referral Program', icon: User },
        { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
      ];
    } else if (dashboardMode === 'crypto') {
      // Crypto & Wallet Platform - Crypto investment focused
      return [
        ...links,
        { href: '/dashboard/invest', label: 'Crypto Investment', icon: Wallet },
        { href: '/dashboard/deposit', label: 'Deposit (Crypto)', icon: Landmark },
        { href: '/dashboard/withdraw', label: 'Withdraw (Crypto)', icon: ArrowLeftRight },
        { href: '/dashboard/transactions', label: 'Transaction History', icon: FileText },
        { href: '/dashboard/referral', label: 'Referral Program', icon: User },
        { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
      ];
    }

    return links;
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

        {/* Dashboard Mode Toggle - Show for everyone */}
        <div className="w-full">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Platform Mode
          </label>
          <Select value={dashboardMode} onValueChange={(v: any) => setDashboardMode(v)}>
            <SelectTrigger className="w-full h-9 text-sm bg-background border">
              <SelectValue placeholder="Select Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>All Platforms</span>
                </div>
              </SelectItem>
              <SelectItem value="real-estate">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>Real Estate</span>
                </div>
              </SelectItem>
              <SelectItem value="crypto">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span>Crypto & Wallet</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
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
