"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LayoutDashboard, Landmark, ArrowLeftRight, FileText, Users, BarChart, Settings, ShieldCheck, LogOut, TrendingUp, Activity, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/shared/RoleGuard';
import authService from '@/services/supabase/auth.service';
import useUserStore from '@/states/user-store';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const navLinks = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    permission: 'view_analytics' as const
  },
  {
    href: '/admin/properties',
    label: 'Properties',
    icon: Building2,
    permission: 'manage_properties' as const
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: Users,
    permission: 'manage_users' as const
  },
  {
    href: '/admin/investments',
    label: 'Investments',
    icon: BarChart,
    permission: 'manage_investments' as const
  },
  {
    href: '/admin/investment-plans',
    label: 'Investment Plans',
    icon: TrendingUp,
    permission: 'manage_investments' as const
  },
  {
    href: '/admin/roi-management',
    label: 'ROI Management',
    icon: BarChart,
    permission: 'manage_investments' as const
  },
  {
    label: 'Finance',
    icon: Landmark,
    permission: 'manage_transactions' as const,
    items: [
      {
        href: '/admin/transactions',
        label: 'Transactions',
        icon: ArrowLeftRight,
        permission: 'manage_transactions' as const
      },
      {
        href: '/admin/onchain/transfers',
        label: 'On-chain Monitor',
        icon: Landmark,
        permission: 'manage_transactions' as const
      },
      {
        href: '/admin/onchain/deposits',
        label: 'On-chain Deposits',
        icon: Landmark,
        permission: 'manage_transactions' as const
      },
      {
        href: '/admin/payouts',
        label: 'Payouts',
        icon: Activity,
        permission: 'manage_transactions' as const
      },
      {
        href: '/admin/referrals',
        label: 'Referral Payouts',
        icon: Users,
        permission: 'manage_transactions' as const
      },
      {
        href: '/admin/webhooks',
        label: 'Webhooks',
        icon: FileText,
        permission: 'manage_transactions' as const
      },
    ]
  },
  {
    href: '/admin/reports',
    label: 'Reports/Flags',
    icon: ShieldCheck,
    permission: 'view_reports' as const
  },
  {
    href: '/admin/audit',
    label: 'Audit Logs',
    icon: FileText,
    permission: 'view_analytics' as const
  },
];

const settingsLinks = [
  {
    label: 'Configuration',
    icon: Settings,
    permission: 'manage_users' as const,
    items: [
      {
        href: '/admin/settings',
        label: 'General Settings',
        icon: Settings,
        permission: 'manage_users' as const
      },
      {
        href: '/admin/crypto-wallets',
        label: 'Crypto Wallets',
        icon: Wallet,
        permission: 'manage_transactions' as const
      },
    ]
  }
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useUserStore();

  const isActive = (href: string) => pathname.startsWith(href);

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

  const renderNavItem = (link: any) => {
    if (link.items) {
      return (
        <AccordionItem value={link.label} key={link.label} className="border-none">
          <PermissionGuard permission={link.permission}>
            <AccordionTrigger className="w-full justify-start text-base py-3 hover:no-underline px-4 hover:bg-accent hover:text-accent-foreground rounded-md data-[state=open]:bg-accent data-[state=open]:text-accent-foreground">
              <div className="flex items-center">
                <link.icon className="mr-3 h-5 w-5" />
                {link.label}
              </div>
            </AccordionTrigger>
          </PermissionGuard>
          <AccordionContent className="pb-0 pl-4 border-l ml-6 space-y-1 mt-1">
            {link.items.map((subLink: any) => (
              <PermissionGuard permission={subLink.permission} key={subLink.href}>
                <Link href={subLink.href}>
                  <Button
                    variant={isActive(subLink.href) ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-sm py-2 h-auto"
                  >
                    <subLink.icon className="mr-2 h-4 w-4" />
                    {subLink.label}
                  </Button>
                </Link>
              </PermissionGuard>
            ))}
          </AccordionContent>
        </AccordionItem>
      );
    }

    return (
      <div key={link.href} className="px-0">
        <PermissionGuard permission={link.permission}>
          <Link href={link.href}>
            <Button
              variant={isActive(link.href) ? 'secondary' : 'ghost'}
              className="w-full justify-start text-base py-3"
            >
              <link.icon className="mr-3 h-5 w-5" />
              {link.label}
            </Button>
          </Link>
        </PermissionGuard>
      </div>
    );
  };

  return (
    <aside className="flex flex-col w-72 h-screen sticky top-0 bg-card text-card-foreground border-r border-border">
      <div className="flex items-center justify-center h-16 border-b px-4 flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">Admin Panel</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] min-h-0">
        <Accordion type="multiple" className="space-y-6">
          <div>
            <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Moderation</h3>
            <div className="space-y-1">
              {navLinks.map((link) => renderNavItem(link))}
            </div>
          </div>
          <div>
            <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">System</h3>
            <div className="space-y-1">
              {settingsLinks.map((link) => renderNavItem(link))}
            </div>
          </div>
        </Accordion>
      </nav>
      <div className="p-4 border-t space-y-2 flex-shrink-0">
        <Link href="/">
          <Button variant="outline" className="w-full">
            Exit to Main Site
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-center"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
