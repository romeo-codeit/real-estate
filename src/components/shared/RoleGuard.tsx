import { ReactNode } from 'react';
import { Permission, UserRole } from '@/lib/types';
import { useRequirePermission, useRequireRole } from '@/hooks/use-auth-rbac';

interface PermissionGuardProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { hasAccess, loading } = useRequirePermission(permission);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface RoleGuardProps {
  role: UserRole;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ role, children, fallback = null }: RoleGuardProps) {
  const { hasAccess, loading } = useRequireRole(role);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  return <RoleGuard role="admin" fallback={fallback}>{children}</RoleGuard>;
}

interface AgentOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AgentOnly({ children, fallback = null }: AgentOnlyProps) {
  return <RoleGuard role="agent" fallback={fallback}>{children}</RoleGuard>;
}

interface InvestorOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function InvestorOnly({ children, fallback = null }: InvestorOnlyProps) {
  return <RoleGuard role="investor" fallback={fallback}>{children}</RoleGuard>;
}