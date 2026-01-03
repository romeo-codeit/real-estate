'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth-rbac';
import { useToast } from '@/hooks/use-toast';
import useQueryParams from '@/hooks/useQueryParams';
import authService from '@/services/supabase/auth.service';
import userService from '@/services/supabase/user.service';
import useUserStore from '@/states/user-store';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' }),
});

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, loading, hasRole } = useAuth();
  const { setUser, setIsAuthenticated } = useUserStore();
  const { getQueryParams } = useQueryParams();

  const { redirect } = getQueryParams() || {};

  // Commented out console.log to prevent browser extension conflicts
  // console.log(redirect, 'redirect');

  const pathname = usePathname();
  // console.log(pathname, 'pathhname');

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Redirect to dashboard or original redirect URL
      router.push(redirect || '/dashboard');
    }
  }, [isAuthenticated, loading, redirect]);

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);

    try {
      const { data, error } = await authService.login(
        values.email,
        values.password
      );

      if (error) {
        // Check for email confirmation error
        const errorMessage = error.message?.toLowerCase() || '';
        const isEmailNotConfirmed = 
          errorMessage.includes('email not confirmed') ||
          errorMessage.includes('email_not_confirmed') ||
          errorMessage.includes('email is not confirmed');
        
        if (isEmailNotConfirmed) {
          toast({
            variant: 'destructive',
            title: 'Email Not Confirmed',
            description: 'Please check your email and click the confirmation link before logging in. If you didn\'t receive the email, please check your spam folder or sign up again.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Login Error',
            description: error.message || 'Invalid email or password. Please try again.',
          });
        }
        return;
      }

      if (!data) {
        toast({
          variant: 'destructive',
          title: 'Login Error',
          description: 'Login failed. Please try again.',
        });
        return;
      }

      // Get user profile with role and permissions
      const userProfile = await userService.getUserById(data.user.id);

      if (!userProfile) {
        toast({
          variant: 'destructive',
          title: 'Login Error',
          description: 'User profile not found.',
        });
        return;
      }

      // Check if user is active
      if (userProfile.status !== 'Active') {
        toast({
          variant: 'destructive',
          title: 'Account Suspended',
          description: 'Your account has been suspended. Please contact support.',
        });
        return;
      }

      // Set user data in store - this triggers useEffect redirect
      setUser(userProfile);
      setIsAuthenticated(true);

      toast({
        title: 'Login Successful',
        description: 'Welcome back! Redirecting you to your dashboard.',
      });

      // Let useEffect handle the redirect to avoid double redirects
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Login Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 min-h-screen items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="m@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="grid gap-2">
                    <div className="flex items-center">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="#"
                        className="ml-auto inline-block text-sm underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Login
              </Button>
              <Button variant="outline" className="w-full" type="button">
                Login with Google
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
