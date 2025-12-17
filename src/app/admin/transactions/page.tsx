
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatAmount } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Check, X, RotateCcw, Wrench, Search, RefreshCcw, Send } from 'lucide-react';
import transactionService from '@/services/supabase/transaction.service';
import { supabase } from '@/services/supabase/supabase';
import { useToast } from '@/hooks/use-toast';
import { SendCryptoDialog } from '@/components/admin/SendCryptoDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'all' | 'disputes' | 'crypto'>('all');
  const [sendCryptoDialogOpen, setSendCryptoDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const highlightedId = searchParams.get('id');

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        // Get all transactions (admin view)
        const allTransactions = await transactionService.getAllTransactions();
        setTransactions(allTransactions || []);
      } catch (error) {
        console.error('Error loading transactions:', error);
        toast({
          title: 'Error',
          description: 'Failed to load transactions.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [toast]);

  const refreshTransactions = async () => {
    try {
      const allTransactions = await transactionService.getAllTransactions();
      setTransactions(allTransactions || []);
    } catch (error) {
      console.error('Error refreshing transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh transactions.',
        variant: 'destructive',
      });
    }
  };

  const handleReconcileAction = async (
    txn: any,
    action: 'refund' | 'adjust',
    options?: { direction?: 'credit' | 'debit' }
  ) => {
    setUpdatingId(txn.id);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Unable to retrieve admin session');
      }

      const accessToken = session.access_token;

      let body: any = { transactionId: txn.id, action };

      if (action === 'refund') {
        const input = window.prompt(
          'Enter refund amount (leave empty to refund full amount):',
          String(txn.amount)
        );
        if (input === null) {
          setUpdatingId(null);
          return;
        }
        const amount = input.trim() === '' ? undefined : Number(input);
        if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
          throw new Error('Refund amount must be a positive number');
        }
        const note = window.prompt('Optional note for this refund (reason / context):') || undefined;
        if (amount !== undefined) body.amount = amount;
        if (note) body.note = note;
      }

      if (action === 'adjust') {
        const direction = options?.direction;
        const input = window.prompt('Enter adjustment amount (absolute value):', '0');
        if (input === null) {
          setUpdatingId(null);
          return;
        }
        const amount = Number(input);
        if (!direction) {
          throw new Error('Adjustment direction is required');
        }
        if (!amount || isNaN(amount) || amount <= 0) {
          throw new Error('Adjustment amount must be a positive number');
        }
        const note = window.prompt('Optional note for this adjustment (reason / context):') || undefined;
        body.amount = amount;
        body.direction = direction;
        if (note) body.note = note;
      }

      const res = await fetch('/api/admin/transactions/reconcile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reconcile transaction');
      }

      toast({
        title: action === 'refund' ? 'Refund Recorded' : 'Adjustment Created',
        description:
          action === 'refund'
            ? 'A refund transaction has been recorded in the ledger.'
            : 'An adjustment transaction has been recorded in the ledger.',
      });

      await refreshTransactions();
    } catch (error: any) {
      console.error('Reconcile action error:', error);
      toast({
        title: 'Action Failed',
        description: error?.message || 'Unable to reconcile transaction.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      !searchTerm ||
      txn.tx_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !typeFilter || txn.type === typeFilter;
    const matchesStatus = !statusFilter || txn.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const isDisputeOrCorrection = (txn: any) => {
    if (!txn) return false;
    if (txn.status && txn.status.toLowerCase() !== 'completed') return true;
    if (txn.type === 'refund' || txn.type === 'fee') return true;
    if ((txn.metadata as any)?.adjustment || (txn.metadata as any)?.refund_reason) return true;
    return false;
  };

  const displayedTransactions =
    viewMode === 'all'
      ? filteredTransactions
      : viewMode === 'disputes'
      ? filteredTransactions.filter((txn) => isDisputeOrCorrection(txn))
      : filteredTransactions.filter((txn) => txn.provider === 'crypto' && txn.status === 'pending' && (txn.type === 'deposit' || txn.type === 'withdrawal'));

  const handleWithdrawalAction = async (txn: any, action: 'approve' | 'reject') => {
    setUpdatingId(txn.id);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Unable to retrieve admin session');
      }

      const accessToken = session.access_token;

      const body: any = { transactionId: txn.id, action };

      const res = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update withdrawal');
      }

      toast({
        title: action === 'approve' ? 'Withdrawal Approved' : 'Withdrawal Rejected',
        description:
          action === 'approve'
            ? 'The withdrawal has been marked as completed.'
            : 'The withdrawal has been marked as failed.',
      });

      await refreshTransactions();
    } catch (error: any) {
      console.error('Withdrawal action error:', error);
      toast({
        title: 'Action Failed',
        description: error?.message || 'Unable to update withdrawal status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendCrypto = async (txHash: string, notes?: string) => {
    if (!selectedWithdrawal) return;

    setUpdatingId(selectedWithdrawal.id);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Unable to retrieve admin session');
      }

      const accessToken = session.access_token;

      const body = {
        transactionId: selectedWithdrawal.id,
        action: 'send',
        txHash,
        note: notes,
      };

      const res = await fetch('/api/admin/withdrawals', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send crypto');
      }

      toast({
        title: 'Crypto Sent Successfully',
        description: 'The withdrawal has been completed and recorded on the blockchain.',
      });

      setSendCryptoDialogOpen(false);
      setSelectedWithdrawal(null);
      await refreshTransactions();
    } catch (error: any) {
      console.error('Send crypto error:', error);
      toast({
        title: 'Send Failed',
        description: error?.message || 'Unable to send crypto.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openSendCryptoDialog = (txn: any) => {
    setSelectedWithdrawal(txn);
    setSendCryptoDialogOpen(true);
  };

  const handleCryptoApproval = async (txn: any) => {
    const confirmed = window.confirm(
      `Are you sure you want to approve this crypto payment of ${formatAmount(txn.amount, txn.currency)}?\n\nThis will mark the transaction as completed and credit the user's account.`
    );

    if (!confirmed) return;

    const adminNotes = window.prompt('Optional notes for this approval (e.g., blockchain confirmation details):');

    setUpdatingId(txn.id);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Unable to retrieve admin session');
      }

      const accessToken = session.access_token;

      const response = await fetch('/api/admin/transactions/approve-crypto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          transactionId: txn.id,
          adminNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve crypto payment');
      }

      toast({
        title: 'Success',
        description: 'Crypto payment approved successfully.',
      });

      // Refresh transactions
      await refreshTransactions();
    } catch (error: any) {
      console.error('Crypto approval error:', error);
      toast({
        title: 'Approval Failed',
        description: error?.message || 'Unable to approve crypto payment.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Manage Transactions</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Transactions</h1>
        <Button variant="outline" onClick={refreshTransactions} disabled={loading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={viewMode === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('all')}
        >
          All Transactions
        </Button>
        <Button
          variant={viewMode === 'disputes' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('disputes')}
        >
          Disputes & Corrections
        </Button>
        <Button
          variant={viewMode === 'crypto' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('crypto')}
        >
          Crypto Approvals
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Search by tx ref, user, type"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="investment">Investment</option>
                <option value="payout">Payout</option>
                <option value="fee">Fee</option>
                <option value="refund">Refund</option>
              </select>
            </div>
            <div>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === 'all'
              ? `All Transactions (${displayedTransactions.length})`
              : viewMode === 'disputes'
              ? `Disputes & Corrections (${displayedTransactions.length})`
              : `Pending Crypto Approvals (${displayedTransactions.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedTransactions.map((txn) => (
                <TableRow
                  key={txn.id}
                  className={highlightedId === txn.id ? 'bg-muted/70' : ''}
                >
                  <TableCell className="font-medium">{txn.tx_ref}</TableCell>
                  <TableCell>{txn.user_id}</TableCell>
                  <TableCell>
                     <Badge variant={txn.type === 'deposit' ? 'secondary' : txn.type === 'withdrawal' ? 'outline' : 'default'}>
                        {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatAmount(txn.amount)}</TableCell>
                  <TableCell>{new Date(txn.created_at).toLocaleDateString()}</TableCell>
                   <TableCell>
                    <Badge variant={
                        txn.status === 'Completed' || txn.status === 'Approved' ? 'default' 
                        : txn.status === 'Pending' ? 'destructive' : 'secondary'
                    }>
                        {txn.status}
                    </Badge>
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
                          <Link href={`/admin/transactions?id=${txn.id}`}>
                            <span className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" />
                              View Transaction
                            </span>
                          </Link>
                        </DropdownMenuItem>
                        {txn.provider === 'crypto' && txn.status === 'pending' && txn.type === 'deposit' && (
                          <DropdownMenuItem
                            disabled={updatingId === txn.id}
                            onClick={() => handleCryptoApproval(txn)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve Crypto Payment
                          </DropdownMenuItem>
                        )}
                        {txn.status === 'completed' && (
                          <>
                            <DropdownMenuItem
                              disabled={updatingId === txn.id}
                              onClick={() => handleReconcileAction(txn, 'adjust', { direction: 'credit' })}
                            >
                              <Wrench className="mr-2 h-4 w-4" />
                              Credit Adjustment
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={updatingId === txn.id}
                              onClick={() => handleReconcileAction(txn, 'adjust', { direction: 'debit' })}
                            >
                              <Wrench className="mr-2 h-4 w-4" />
                              Debit Adjustment
                            </DropdownMenuItem>
                          </>
                        )}
                        {txn.type === 'withdrawal' && txn.status === 'pending' && (
                          <>
                            <DropdownMenuItem
                              disabled={updatingId === txn.id}
                              onClick={() => openSendCryptoDialog(txn)}
                            >
                              <Send className="mr-2 h-4 w-4 text-blue-600" />
                              Send Crypto
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={updatingId === txn.id}
                              onClick={() => handleWithdrawalAction(txn, 'approve')}
                            >
                              <Check className="mr-2 h-4 w-4 text-green-600" />
                              Approve (No Send)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={updatingId === txn.id}
                              onClick={() => handleWithdrawalAction(txn, 'reject')}
                            >
                              <X className="mr-2 h-4 w-4 text-red-600" />
                              Reject Withdrawal
                            </DropdownMenuItem>
                          </>
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

      {/* Send Crypto Dialog */}
      {selectedWithdrawal && (
        <SendCryptoDialog
          open={sendCryptoDialogOpen}
          onOpenChange={setSendCryptoDialogOpen}
          transaction={selectedWithdrawal}
          onSendCrypto={handleSendCrypto}
          loading={updatingId === selectedWithdrawal.id}
        />
      )}
    </div>
  );
}
