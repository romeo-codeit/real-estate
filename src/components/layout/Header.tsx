'use client';

'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth-rbac';
import useUserStore from '@/states/user-store';
import { Building2, Menu, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeSwitcher } from '../shared/ThemeSwitcher';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/properties', label: 'Properties' },
  { href: '/crypto', label: 'Crypto' },
  { href: '/blog', label: 'Blog' },
  { href: '/agents', label: 'Agents' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact Us' },
];

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated } = useUserStore((state) => state);
  const { isAuthenticating, handleLogout, user, hasRole } = useAuth();

  const getDashboardUrl = () => '/dashboard';

  return (
    <header className="bg-background/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        <Link href="/" className="flex items-center gap-2" aria-label="Go to homepage">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground hidden sm:inline">
            RealEstate Explorer
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = link.href === '/' ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Button key={link.href} variant={isActive ? "secondary" : "ghost"} asChild>
                <Link href={link.href}>
                  {link.label}
                </Link>
              </Button>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeSwitcher />
          {isAuthenticating ? null : (
            <>
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="" alt={`${user?.firstName} ${user?.lastName}`} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={getDashboardUrl()} title="Dashboard">
                      <Settings className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          <ThemeSwitcher />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Button key={link.href} variant="ghost" asChild className="justify-start">
                    <Link href={link.href}>
                      {link.label}
                    </Link>
                  </Button>
                ))}
              </nav>
              <div className="flex flex-col gap-2 mt-8 border-t pt-6">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 p-2 bg-muted rounded-lg mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt={`${user?.firstName} ${user?.lastName}`} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {hasRole('admin') ? 'Administrator' : 'Investor'}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" asChild className="w-full justify-start">
                      <Link href={getDashboardUrl()}>
                        <Settings className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
