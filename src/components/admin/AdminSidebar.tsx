"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, LayoutDashboard, Landmark, ArrowLeftRight, FileText, Users, BarChart, Settings, ShieldCheck, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/properties', label: 'Properties', icon: Building2 },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/investments', label: 'Investments', icon: BarChart },
  { href: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/admin/reports', label: 'Reports/Flags', icon: ShieldCheck },
];

const settingsLinks = [
  { href: '/admin/settings/roles', label: 'Roles & Permissions', icon: Settings },
  { href: '/admin/settings/rules', label: 'Automation Rules', icon: Settings },
  { href: '/admin/audit', label: 'Audit Logs', icon: FileText },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className="hidden md:flex flex-col w-72 bg-card text-card-foreground border-r border-border">
       <div className="flex items-center justify-center h-16 border-b px-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold">Admin Panel</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
            <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Moderation</h3>
            <ul className="space-y-1">
                {navLinks.map((link) => (
                    <li key={link.href}>
                    <Link href={link.href}>
                        <Button
                        variant={isActive(link.href) ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-base py-6"
                        >
                        <link.icon className="mr-3 h-5 w-5" />
                        {link.label}
                        </Button>
                    </Link>
                    </li>
                ))}
            </ul>
        </div>
        <div>
            <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">System</h3>
            <ul className="space-y-1">
                {settingsLinks.map((link) => (
                    <li key={link.href}>
                    <Link href={link.href}>
                        <Button
                        variant={isActive(link.href) ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-base py-6"
                        >
                        <link.icon className="mr-3 h-5 w-5" />
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
        <Link href="/admin">
            <Button variant="ghost" className="w-full justify-center">
                <LogOut className="mr-2 h-5 w-5" />
                Logout
            </Button>
        </Link>
      </div>
    </aside>
  );
}
