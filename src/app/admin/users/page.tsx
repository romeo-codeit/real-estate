'use client';

import { useEffect, useState } from 'react';
import { User, UserRole } from '@/lib/types';
import { supabase } from '@/services/supabase/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatRelativeTime } from '@/lib/helpers';
import { MoreHorizontal, UserCheck, UserX, Shield, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableSkeleton } from '@/components/shared/skeletons';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Get session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to fetch users:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const userData = await response.json();
      setUsers(userData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load users.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Fetch CSRF token
      const csrfResponse = await fetch('/api/csrf', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get security token');
      }

      const { token: csrfToken } = await csrfResponse.json();

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      toast({
        title: 'Success',
        description: 'User role updated successfully.',
      });
      loadUsers(); // Reload users to reflect changes
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'Active' | 'Suspended' | 'Banned') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Fetch CSRF token
      const csrfResponse = await fetch('/api/csrf', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!csrfResponse.ok) {
        throw new Error('Failed to get security token');
      }

      const { token: csrfToken } = await csrfResponse.json();

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      toast({
        title: 'Success',
        description: `User ${newStatus.toLowerCase()} successfully.`,
      });
      loadUsers(); // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user status.',
        variant: 'destructive',
      });
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'agent':
        return <Users className="h-4 w-4" />;
      default:
        return <UserX className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'agent':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Active':
        return 'secondary';
      case 'Suspended':
        return 'destructive';
      case 'Banned':
        return 'destructive';
      default:
        return 'secondary';
    }
  };


  if (loading) {
    return <TableSkeleton />;
  }


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <div className="text-sm text-muted-foreground">
          Total users: {users.length}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatRelativeTime(user.lastLogin)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="investor">Investor</SelectItem>
                              <SelectItem value="agent">Agent</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(user.id, user.status === 'Active' ? 'Suspended' : 'Active')}
                        >
                          {user.status === 'Active' ? 'Suspend' : 'Activate'} User
                        </DropdownMenuItem>
                        {user.status !== 'Banned' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(user.id, 'Banned')}
                            className="text-red-600"
                          >
                            Ban User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
