'use client';

import authService from '@/services/supabase/auth.service';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useUserStore from '@/states/user-store';
import { Menu, LogOut, Settings } from 'lucide-react';
import { SiteLogo } from '@/components/ui/SiteLogo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  const { isAuthenticated, user, logout } = useUserStore((state) => state);

  // Show login/signup if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <header className="bg-card/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center py-3">
          <Link href="/" className="flex items-center" aria-label="Go to homepage">
            <SiteLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link, idx) => (
              idx === 0 ? null : (
                <Link key={link.href} href={link.href} className="text-sm relative font-medium text-muted-foreground hover:text-primary transition-colors">
                  {link.label}
                </Link>
              )
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>
    );
  }

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
    <header className="bg-card/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center py-3">
        <Link
          href="/"
          className="flex items-center"
          aria-label="Go to homepage"
        >
          <SiteLogo />
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href={'/'}
            className="text-sm relative font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Home
            <div
              className={`
                    ${
                      pathname === '/'
                        ? 'bg-primary h-[0.5px] w-full absolute -bottom-1 left-0'
                        : ''
                    }
                     
                  `}
            ></div>
          </Link>
          {navLinks.slice(1).map((link) => {
            const isActive = pathname.includes(link.href);
            const isHome = link.href === '/';

            return (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm relative font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}

                <div
                  className={`
                    ${
                      isActive
                        ? 'bg-primary h-[0.5px] w-full absolute -bottom-1 left-0'
                        : ''
                    }
                     
                  `}
                ></div>
              </Link>
            );
          })}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              {/* User Avatar and Menu */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={`${user.firstName} ${user.lastName}`} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.role === 'admin' ? 'Administrator' : user.role === 'agent' ? 'Agent' : 'User'}
                    </p>
                  </div>
                </div>
                
                {/* Profile/Settings Button */}
                <Button variant="ghost" size="icon" asChild className="hover:bg-accent">
                  <Link href={'/dashboard'} title="Dashboard">
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
                
                {/* Logout Button */}
                <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-accent">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </>
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
        </div>

        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-6 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-lg font-medium text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="flex flex-col gap-2 mt-8">
                {isAuthenticated && user ? (
                  <>
                    {/* Mobile User Info */}
                    <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg mb-4 border">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt={`${user.firstName} ${user.lastName}`} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.role === 'admin' ? 'Administrator' : user.role === 'agent' ? 'Agent' : 'User'}
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="outline" asChild className="w-full justify-start">
                      <Link href={'/dashboard'}>
                        <Settings className="mr-2 h-4 w-4" />
                        {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
                      </Link>
                    </Button>
                    
                    <Button variant="ghost" onClick={handleLogout} className="w-full justify-start">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </>
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
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
