import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define protected routes and required permissions
const protectedRoutes = {
  // Admin routes
  '/admin': ['manage_users'],
  '/admin/users': ['manage_users'],
  '/admin/properties': ['manage_properties'],
  '/admin/investments': ['manage_investments'],
  '/admin/transactions': ['manage_transactions'],
  '/admin/reports': ['view_reports'],
  '/admin/crypto': ['manage_crypto'],
  '/admin/agents': ['manage_agents'],
  '/admin/audit': ['view_analytics'],
  '/admin/dashboard': ['view_analytics'],

  // Dashboard routes (require basic authentication)
  '/dashboard': [], // Empty array means authenticated but no specific permissions required
  '/dashboard/profile': [],
  '/dashboard/invested-properties': [],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const requiredPermissions = getRequiredPermissions(pathname);
  if (!requiredPermissions) {
    return NextResponse.next();
  }

  try {
    // Try to get session from Supabase (this should work with cookies)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return redirectToLogin(request);
    }

    if (!session?.user) {
      return redirectToLogin(request);
    }

    // Get user profile with role and permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, permissions, status')
      .eq('id', session.user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('Profile fetch error in middleware:', profileError);
      return redirectToLogin(request);
    }

    // Check if user is active
    if (userProfile.status !== 'Active') {
      return NextResponse.redirect(new URL('/login?error=account_suspended', request.url));
    }

    // Check permissions
    const userPermissions = userProfile.permissions || [];

    // If requiredPermissions is empty array, only authentication is required
    // If requiredPermissions has items, specific permissions are required
    const hasPermission = requiredPermissions.length === 0 ||
      requiredPermissions.some(permission => userPermissions.includes(permission));

    if (!hasPermission) {
      return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware auth error:', error);
    return redirectToLogin(request);
  }
}

function getRequiredPermissions(pathname: string): string[] | null {
  // Check exact matches first
  if (protectedRoutes[pathname as keyof typeof protectedRoutes]) {
    return protectedRoutes[pathname as keyof typeof protectedRoutes];
  }

  // Check if it's an admin route (starts with /admin/)
  if (pathname.startsWith('/admin/')) {
    return ['manage_users']; // Default admin permission
  }

  return null;
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
  ],
};