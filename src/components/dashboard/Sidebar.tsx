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
} from 'lucide-react';
import { SiteLogo } from '@/components/ui/SiteLogo';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useUserStore();
  const { hasRole } = useAuth();

  const isActive = (href: string) => pathname === href;

  // Define navigation links based on user role
  const getNavLinks = () => {
    const baseLinks = [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/properties', label: 'Properties', icon: Building2 },
    ];

    if (hasRole('admin')) {
      // Admin gets additional admin-specific links
      return [
        ...baseLinks,
        { href: '/admin/users', label: 'User Management', icon: Users },
        { href: '/dashboard', label: 'Admin Panel', icon: Shield },
      ];
    } else {
      // Regular users get investment-related links
      return [
        ...baseLinks,
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
    }
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
      <div className="flex items-center justify-center h-16 border-b">
        <Link href="/" className="flex items-center gap-2">
          <SiteLogo showText={true} />
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
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
