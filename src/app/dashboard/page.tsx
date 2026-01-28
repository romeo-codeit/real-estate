"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, CreditCard, ArrowUpRight, ArrowDownRight, Building2, Wallet, Users, BarChart, AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth-rbac";
import userService from "@/services/supabase/user.service";
// import transactionService from "@/services/supabase/transaction.service";
import investmentService from "@/services/supabase/investment.service";
import { formatAmount } from "@/lib/helpers";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/services/supabase/supabase";
import useUserStore from "@/states/user-store";
import { PageSkeleton } from '@/components/shared/skeletons';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string | null;
  created_at: string | null;
}

interface Investment {
  id: string;
  amount_invested: number;
  roi_rate: number;
  status: string | null;
  created_at: string | null;
  investment_type: string | null;
}

function UserDashboardView() {
  const { user } = useAuth();
  const { dashboardMode } = useUserStore();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoPolling, setAutoPolling] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const [profile, txns, invs] = await Promise.all([
        userService.getUserById(user.id),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        investmentService.getInvestments(user.id)
      ]);

      setUserProfile(profile);
      setTransactions(txns.data || []);
      setInvestments((invs as any[]) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-poll for transaction/investment state changes when there are pending items
  useEffect(() => {
    const pendingCount =
      transactions.filter((t) => t.status === 'pending' || t.status === 'waiting_confirmation').length +
      investments.filter((i) => i.status === 'pending' || i.status === 'waiting_confirmation').length;

    if (pendingCount > 0 && !autoPolling) {
      setAutoPolling(true);
    } else if (pendingCount === 0 && autoPolling) {
      setAutoPolling(false);
    }
  }, [transactions, investments, autoPolling]);

  useEffect(() => {
    if (!autoPolling) return;

    const pollInterval = setInterval(() => {
      fetchData();
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(pollInterval);
  }, [autoPolling, fetchData]);

  // Calculate balance and stats
  const balance = transactions.reduce((acc, txn) => {
    if (txn.status === 'completed') {
      if (txn.type === 'deposit') return acc + txn.amount;
      if (txn.type === 'withdrawal' || txn.type === 'investment') return acc - txn.amount;
    }
    return acc;
  }, 0);

  const totalDeposit = transactions
    .filter(t => t.type === 'deposit' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalWithdraw = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  // Filter investments based on dashboard mode
  const totalInvest = investments
    .filter(i => i.status === 'active')
    .filter(i => {
      if (dashboardMode === 'crypto') return i.investment_type === 'crypto';
      if (dashboardMode === 'real-estate') return i.investment_type === 'property';
      return true;
    })
    .reduce((acc, i) => acc + i.amount_invested, 0);

  const recentTransactions = transactions.slice(0, 5);
  const pendingTransactions = transactions.filter(
    (t) => t.status === 'pending' || t.status === 'waiting_confirmation'
  );
  const pendingInvestments = investments.filter(
    (i) => i.status === 'pending' || i.status === 'waiting_confirmation'
  );


  if (loading) {
    return <PageSkeleton />;
  }


  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {userProfile?.firstName || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            {dashboardMode === 'crypto' ? 'Here is your crypto portfolio overview' :
              dashboardMode === 'real-estate' ? 'Here is your real estate portfolio overview' :
                "Here's an overview of your investment activity"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing' : 'Refresh'}
          </Button>
          <Button asChild>
            <Link href="/dashboard/invest">
              <Building2 className="mr-2 h-4 w-4" />
              Invest Now
            </Link>
          </Button>
        </div>
      </div>

      {(pendingTransactions.length > 0 || pendingInvestments.length > 0) && (
        <Card className="bg-muted/40 border-dashed">
          <CardContent className="py-4 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-sm text-muted-foreground">
                {pendingTransactions.length} transaction(s) and {pendingInvestments.length} investment(s) awaiting confirmation.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh status
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(balance)}</div>
            <p className="text-xs text-muted-foreground">
              Available funds
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {dashboardMode === 'crypto' ? 'Crypto Invested' :
                dashboardMode === 'real-estate' ? 'Properties Invested' :
                  'Total Invested'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalInvest)}</div>
            <p className="text-xs text-muted-foreground">
              Active investments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalDeposit)}</div>
            <p className="text-xs text-muted-foreground">
              Funds added
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalWithdraw)}</div>
            <p className="text-xs text-muted-foreground">
              Funds withdrawn
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest financial activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No transactions yet</p>
              ) : (
                recentTransactions.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${txn.type === 'deposit' ? 'bg-green-100 text-green-600' :
                        txn.type === 'withdrawal' ? 'bg-red-100 text-red-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                        {txn.type === 'deposit' ? <ArrowUpRight className="h-4 w-4" /> :
                          txn.type === 'withdrawal' ? <ArrowDownRight className="h-4 w-4" /> :
                            <CreditCard className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{txn.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {txn.created_at ? new Date(txn.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${txn.type === 'deposit' ? 'text-green-600' :
                        txn.type === 'withdrawal' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                        {txn.type === 'deposit' ? '+' : '-'}{formatAmount(txn.amount)}
                      </p>
                      <Badge
                        variant={
                          txn.status === 'completed'
                            ? 'default'
                            : txn.status === 'waiting_confirmation'
                            ? 'outline'
                            : 'secondary'
                        }
                      >
                        {txn.status || 'unknown'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentTransactions.length > 0 && (
              <div className="mt-4">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/dashboard/transactions">View All Transactions</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your account and investments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/dashboard/deposit">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Add Funds
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/dashboard/invest">
                <Building2 className="mr-2 h-4 w-4" />
                Make Investment
              </Link>
            </Button>
            {dashboardMode !== 'crypto' && (
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/dashboard/invested-properties">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Investments
                </Link>
              </Button>
            )}
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/dashboard/withdraw">
                <ArrowDownRight className="mr-2 h-4 w-4" />
                Withdraw Funds
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminDashboardView() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalInvestments: 0,
    openReports: 0,
    userGrowth: 0,
    propertyGrowth: 0,
    investmentGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          throw new Error('No active session');
        }

        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data.stats);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics.",
          variant: "destructive",
          // variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  const handleGenerateBlogPosts = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-blog-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger: 'manual-admin'
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success!",
          description: `Generated ${result.count} blog posts successfully.`,
        });
      } else {
        toast({
          title: "Generation Failed",
          description: result.error || "Failed to generate blog posts.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate blog posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Panel</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? '...' : `+${stats.userGrowth}% from last month`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.totalProperties.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? '...' : `+${stats.propertyGrowth} from last month`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
            <BarChart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `$${(stats.totalInvestments / 1000000).toFixed(1)}M`}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? '...' : `+${stats.investmentGrowth}% from last month`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Reports</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.openReports.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? '...' : '3 new reports today'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Blog Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Blog Content Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Generate Blog Posts</h3>
              <p className="text-sm text-muted-foreground">
                Create AI-generated blog posts about crypto, investments, and real estate
              </p>
            </div>
            <Button
              onClick={handleGenerateBlogPosts}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate Posts'}
            </Button>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Webhook Endpoint</h4>
            <p className="text-sm text-muted-foreground mb-2">
              News services can automatically trigger blog post generation:
            </p>
            <code className="text-xs bg-muted p-2 rounded block">
              POST {process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com'}/api/webhooks/blog-news
            </code>
          </div>
        </CardContent>
      </Card>

      <div className="text-center py-12">
        <h2 className="text-2xl">Moderation Queues Overview</h2>
        <p className="text-muted-foreground">This section is under construction. Queues will be displayed here.</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { hasRole, isAuthenticating } = useAuth();
  const isAdmin = hasRole('admin');

  if (isAuthenticating) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return isAdmin ? <AdminDashboardView /> : <UserDashboardView />;
}
