"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, ArrowUpRight, ArrowDownRight, Building2, Wallet } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth-rbac";
import userService from "@/services/supabase/user.service";
import transactionService from "@/services/supabase/transaction.service";
import investmentService from "@/services/supabase/investment.service";
import { formatAmount } from "@/lib/helpers";
import Link from "next/link";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Investment {
  id: string;
  amount_invested: number;
  roi_rate: number;
  status: string | null;
  created_at: string | null;
}

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        const [profile, txns, invs] = await Promise.all([
          userService.getUserById(user.id),
          transactionService.getUserTransactions(user.id),
          investmentService.getInvestments(user.id)
        ]);

        setUserProfile(profile);
        setTransactions(txns || []);
        setInvestments(invs || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

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

  const totalInvest = investments
    .filter(i => i.status === 'active')
    .reduce((acc, i) => acc + i.amount_invested, 0);

  const recentTransactions = transactions.slice(0, 5);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
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
            Here's an overview of your investment activity
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/invest">
            <Building2 className="mr-2 h-4 w-4" />
            Invest Now
          </Link>
        </Button>
      </div>

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
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
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
                      <div className={`p-2 rounded-full ${
                        txn.type === 'deposit' ? 'bg-green-100 text-green-600' :
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
                          {new Date(txn.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        txn.type === 'deposit' ? 'text-green-600' :
                        txn.type === 'withdrawal' ? 'text-red-600' :
                        'text-blue-600'
                      }`}>
                        {txn.type === 'deposit' ? '+' : '-'}{formatAmount(txn.amount)}
                      </p>
                      <Badge variant={txn.status === 'completed' ? 'default' : 'secondary'}>
                        {txn.status}
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
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/dashboard/invested-properties">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Investments
              </Link>
            </Button>
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
