'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RefreshCw, Activity, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase/supabase';

interface OnchainTransfer {
  id: string;
  chain: string | null;
  tx_hash: string | null;
  from_address: string | null;
  to_address: string | null;
  confirmations: number;
  status: string;
  metadata: any;
  created_at: string;
}

function getExplorerUrl(chain: string | null, tx: string | null): string | null {
  if (!chain || !tx) return null;
  const hash = tx;
  const lower = chain.toLowerCase();
  if (lower.includes('eth')) return `https://etherscan.io/tx/${hash}`;
  if (lower.includes('polygon')) return `https://polygonscan.com/tx/${hash}`;
  if (lower.includes('btc')) return `https://www.blockchain.com/btc/tx/${hash}`;
  return null;
}

export default function OnchainTransfersPage() {
  const { toast } = useToast();
  const [transfers, setTransfers] = useState<OnchainTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [chainFilter, setChainFilter] = useState<string>('');
  const [txSearch, setTxSearch] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Unable to retrieve admin session');
      }

      const accessToken = session.access_token;
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (chainFilter) params.set('chain', chainFilter);

      const res = await fetch(`/api/admin/onchain/transfers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load on-chain transfers');
      }
      setTransfers(data.transfers || []);
    } catch (error: any) {
      console.error('Error loading onchain transfers:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load on-chain transfers.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, chainFilter]);

  const handleUpdate = async (transfer: OnchainTransfer) => {
    setUpdatingId(transfer.id);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Unable to retrieve admin session');
      }

      const accessToken = session.access_token;

      const confStr = window.prompt('Update confirmations count:', String(transfer.confirmations));
      if (confStr === null) {
        setUpdatingId(null);
        return;
      }
      const confirmations = Number(confStr);
      if (isNaN(confirmations) || confirmations < 0) {
        throw new Error('Confirmations must be a non-negative number');
      }

      const status = window.prompt('Update status (pending/completed/failed):', transfer.status) || transfer.status;
      const note = window.prompt('Optional note about this update:') || undefined;

      const res = await fetch('/api/admin/onchain/transfers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id: transfer.id, confirmations, status, note }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update transfer');
      }

      toast({
        title: 'Updated',
        description: 'On-chain transfer was updated.',
      });

      await loadTransfers();
    } catch (error: any) {
      console.error('Update transfer error:', error);
      toast({
        title: 'Action Failed',
        description: error?.message || 'Unable to update on-chain transfer.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    if (txSearch && !(t.tx_hash || '').toLowerCase().includes(txSearch.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">On-chain Transfers</h1>
          <p className="text-muted-foreground">Monitor blockchain transfers linked to deposits and withdrawals</p>
        </div>
        <Button variant="outline" onClick={loadTransfers} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
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
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                placeholder="Filter by chain (e.g. polygon)"
                value={chainFilter}
                onChange={(e) => setChainFilter(e.target.value)}
              />
            </div>
            <div>
              <Input
                placeholder="Search by tx hash"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfers ({filteredTransfers.length})</CardTitle>
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
                  <TableHead>Chain</TableHead>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Confirmations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransfers.map((t) => {
                  const explorer = getExplorerUrl(t.chain, t.tx_hash);
                  return (
                    <TableRow key={t.id}>
                      <TableCell>{t.chain || '-'}</TableCell>
                      <TableCell className="text-xs break-all">{t.tx_hash || '-'}</TableCell>
                      <TableCell className="text-xs break-all">{t.from_address || '-'}</TableCell>
                      <TableCell className="text-xs break-all">{t.to_address || '-'}</TableCell>
                      <TableCell>{t.confirmations}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.status === 'completed'
                              ? 'default'
                              : t.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(t.created_at).toLocaleString()}</TableCell>
                      <TableCell className="space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === t.id}
                          onClick={() => handleUpdate(t)}
                        >
                          Update
                        </Button>
                        {explorer && (
                          <a href={explorer} target="_blank" rel="noreferrer">
                            <Button size="sm" variant="ghost">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
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
