
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth-rbac";
// import transactionService from "@/services/supabase/transaction.service";
import { supabase } from "@/services/supabase/supabase";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/shared/skeletons";

export default function TransactionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'investment'>('all');

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user?.id]);

  const filteredTransactions = filter === 'all'
    ? transactions
    : transactions.filter(t => t.type === filter);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Return to previous page</span>
        </Button>
        <h1 className="text-3xl font-bold">Transactions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>View all your deposits, withdrawals, and investments</CardDescription>
          <div className="flex gap-2 mt-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'deposit' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('deposit')}
            >
              Deposits
            </Button>
            <Button
              variant={filter === 'withdrawal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('withdrawal')}
            >
              Withdrawals
            </Button>
            <Button
              variant={filter === 'investment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('investment')}
            >
              Investments
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton />
          ) : filteredTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(transaction.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize font-medium">{transaction.type}</span>
                    </TableCell>
                    <TableCell>
                      <span className={transaction.type === 'deposit' ? 'text-green-600' : transaction.type === 'withdrawal' ? 'text-red-600' : ''}>
                        ${Number(transaction.amount).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={transaction.status === 'completed' ? 'default' : transaction.status === 'failed' ? 'destructive' : 'secondary'}
                        className={
                          transaction.status === 'completed' ? 'bg-green-500/20 text-green-700' :
                            transaction.status === 'failed' ? 'bg-red-500/20 text-red-700' :
                              'bg-yellow-500/20 text-yellow-700'
                        }
                      >
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {transaction.tx_ref}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8">
              <EmptyState
                title={filter === 'all' ? 'No transactions yet' : `No ${filter} transactions found`}
                description={filter === 'all'
                  ? "You haven't made any transactions yet. Getting started is easy!"
                  : `We couldn't find any ${filter} transactions in your history.`}
                actionLabel={filter === 'all' ? "Make a Deposit" : "Clear Filter"}
                actionLink={filter === 'all' ? "/dashboard/deposit" : undefined}
              // If actionLink is undefined, we can add a button manually or just let it render without action
              />
              {filter !== 'all' && (
                <div className="text-center mt-[-2rem] relative z-10">
                  <Button variant="outline" onClick={() => setFilter('all')}>
                    Clear Filter
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
