"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LayoutDashboard, Landmark, ArrowLeftRight, FileText, Users, BarChart, Settings, ShieldCheck, LogOut, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/shared/RoleGuard';
import authService from '@/services/supabase/auth.service';
import useUserStore from '@/states/user-store';

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
    href: '/admin/payouts',
    label: 'Payouts',
    icon: Activity,
    permission: 'manage_transactions' as const
  },
  {
    href: '/admin/webhooks',
    label: 'Webhooks',
    icon: FileText,
    permission: 'manage_transactions' as const
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
    href: '/admin/settings',
    label: 'Settings',
    icon: Settings,
    permission: 'manage_users' as const
  },
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

  return (
    <aside className="flex flex-col w-72 h-full bg-card text-card-foreground border-r border-border">
       <div className="flex items-center justify-center h-16 border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">Admin Panel</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        <div>
            <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Moderation</h3>
            <ul className="space-y-1">
                {navLinks.map((link) => (
                    <li key={link.href}>
                      <PermissionGuard permission={link.permission}>
                        <Link href={link.href}>
                            <Button
                            variant={isActive(link.href) ? 'secondary' : 'ghost'}
                            className="w-full justify-start text-base py-6"
                            >
                            <link.icon className="mr-3 h-5 w-5" />
                            {link.label}
                            </Button>
                        </Link>
                      </PermissionGuard>
                    </li>
                ))}
            </ul>
        </div>
        <div>
            <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">System</h3>
            <ul className="space-y-1">
                {settingsLinks.map((link) => (
                    <li key={link.href}>
                      <PermissionGuard permission={link.permission}>
                        <Link href={link.href}>
                            <Button
                            variant={isActive(link.href) ? 'secondary' : 'ghost'}
                            className="w-full justify-start text-base py-6"
                            >
                            <link.icon className="mr-3 h-5 w-5" />
                            {link.label}
                            </Button>
                        </Link>
                      </PermissionGuard>
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
