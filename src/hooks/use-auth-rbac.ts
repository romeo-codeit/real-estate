import { useEffect, useState } from 'react';
import useUserStore from '@/states/user-store';
import { Permission, UserRole } from '@/lib/types';
import authService from '@/services/supabase/auth.service';
import { useAuthContext } from '@/components/providers/AuthProvider';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    role,
    permissions,
    hasPermission,
    hasRole,
    logout
  } = useUserStore();

  const { loading: authLoading } = useAuthContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only set loading to false when auth context is done loading
    // The AuthProvider handles session persistence and auth state changes
    if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading]);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      logout(); // Clear local state after Supabase signOut
    } catch (error) {
      console.error('Error signing out:', error);
      logout(); // Clear local state even if Supabase signOut fails
    }
  };

  return {
    user,
    isAuthenticated,
    role,
    permissions,
    hasPermission,
    hasRole,
    loading: loading,
    isAuthenticating: loading, // Alias for compatibility
    handleLogout,
    logout: handleLogout, // Alias for compatibility
  };
}

export function usePermission(permission: Permission) {
  const { hasPermission, loading } = useAuth();
  return { hasPermission: hasPermission(permission), loading };
}

export function useRole(role: UserRole) {
  const { hasRole, loading } = useAuth();
  return { hasRole: hasRole(role), loading };
}

export function useRequireAuth() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return { loading: true, authenticated: false };
  }

  if (!isAuthenticated) {
    // Redirect to login would happen here, but we'll handle in components
    return { loading: false, authenticated: false };
  }

  return { loading: false, authenticated: true };
}

export function useRequirePermission(permission: Permission) {
  const { hasPermission, loading, isAuthenticated } = useAuth();

  if (loading) {
    return { loading: true, hasAccess: false };
  }

  if (!isAuthenticated) {
    return { loading: false, hasAccess: false };
  }

  return { loading: false, hasAccess: hasPermission(permission) };
}

export function useRequireRole(role: UserRole) {
  const { hasRole, loading, isAuthenticated } = useAuth();

  if (loading) {
    return { loading: true, hasAccess: false };
  }

  if (!isAuthenticated) {
    return { loading: false, hasAccess: false };
  }

  return { loading: false, hasAccess: hasRole(role) };
}