'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Download, Activity, RotateCcw, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase/supabase';
import Link from 'next/link';
import { formatAmount } from '@/lib/helpers';

interface PayoutTxn {
  id: string;
  user_id: string | null;
  amount: number;
  currency: string | null;
  status: string;
  provider: string | null;
  provider_txn_id: string | null;
  related_object?: any;
  created_at: string;
}

export default function AdminPayoutsPage() {
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<PayoutTxn[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [exporting, setExporting] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Unable to retrieve admin session');
      }
      const accessToken = session.access_token;

      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/payouts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load payouts');
      }
      setPayouts(data.payouts || []);
    } catch (error: any) {
      console.error('Error loading payouts:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load payouts.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Unable to retrieve admin session');
      }
      const accessToken = session.access_token;

      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('format', 'csv');

      const res = await fetch(`/api/admin/payouts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to export CSV');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payouts.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Export CSV error:', error);
      toast({
        title: 'Export Failed',
        description: error?.message || 'Unable to export payouts CSV.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleRetryReferral = async (txn: PayoutTxn) => {
    setRetryingId(txn.id);
    try {
      const related: any = txn.related_object || {};
      if (related.type !== 'referral_commission') {
        throw new Error('Only referral commission payouts can be retried.');
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Unable to retrieve admin session');
      }
      const accessToken = session.access_token;

      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ transactionId: txn.id, action: 'retry_referral' }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to retry referral payout');
      }

      toast({
        title: 'Retry Triggered',
        description: 'Referral commission payout has been reprocessed.',
      });

      await loadPayouts();
    } catch (error: any) {
      console.error('Retry referral error:', error);
      toast({
        title: 'Action Failed',
        description: error?.message || 'Unable to retry referral payout.',
        variant: 'destructive',
      });
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payout History</h1>
          <p className="text-muted-foreground">Review and export payout transactions, and retry referral payouts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPayouts} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCsv} disabled={exporting || loading}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payouts ({payouts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Activity className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payout ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((txn) => {
                  const related: any = txn.related_object || {};
                  const isReferral = related.type === 'referral_commission';
                  return (
                    <TableRow key={txn.id}>
                      <TableCell className="font-medium">{txn.id}</TableCell>
                      <TableCell className="text-xs">{txn.user_id || '-'}</TableCell>
                      <TableCell>{formatAmount(txn.amount)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            txn.status === 'completed'
                              ? 'default'
                              : txn.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {txn.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{txn.provider || '-'}</TableCell>
                      <TableCell>{new Date(txn.created_at).toLocaleString()}</TableCell>
                      <TableCell className="space-x-2">
                        <Link href={`/admin/transactions?id=${txn.id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-3 w-3 mr-1" />
                            View Txn
                          </Button>
                        </Link>
                        {isReferral && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={retryingId === txn.id}
                            onClick={() => handleRetryReferral(txn)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Retry Referral Payout
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
