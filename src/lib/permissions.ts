import { UserRole, Permission, RolePermissions } from '@/lib/types';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'manage_users',
    'manage_properties',
    'manage_investments',
    'manage_transactions',
    'view_reports',
    'manage_crypto',
    'manage_agents',
    'view_analytics',
  ],
  agent: [],
  user: [],
};

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'admin',
    permissions: ROLE_PERMISSIONS.admin,
  },
  {
    role: 'agent',
    permissions: ROLE_PERMISSIONS.agent,
  },
  {
    role: 'user',
    permissions: ROLE_PERMISSIONS.user,
  },
];

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

export function hasAllPermissions(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}