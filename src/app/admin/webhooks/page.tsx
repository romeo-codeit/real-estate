'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Play, Activity, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase/supabase';
import Link from 'next/link';

interface WebhookEvent {
  id: string;
  provider: string;
  event_id: string | null;
  event_type: string | null;
  status: string | null;
  transaction_id: string | null;
  provider_txn_id: string | null;
  target_status: string | null;
  created_at: string;
}

export default function AdminWebhooksPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Unable to retrieve admin session');
      }

      const accessToken = session.access_token;

      const params = new URLSearchParams();
      if (providerFilter) params.set('provider', providerFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/webhooks/events?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load webhook events');
      }

      setEvents(data.events || []);
    } catch (error: any) {
      console.error('Error loading webhook events:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load webhook events.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerFilter, statusFilter]);

  const handleReprocess = async (event: WebhookEvent) => {
    setReprocessingId(event.id);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Unable to retrieve admin session');
      }

      const accessToken = session.access_token;

      const res = await fetch('/api/admin/webhooks/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id: event.id, action: 'reprocess' }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reprocess webhook event');
      }

      toast({
        title: 'Reprocessed',
        description: 'Webhook event was reprocessed and the linked transaction updated.',
      });

      await loadEvents();
    } catch (error: any) {
      console.error('Reprocess error:', error);
      toast({
        title: 'Action Failed',
        description: error?.message || 'Unable to reprocess webhook event.',
        variant: 'destructive',
      });
    } finally {
      setReprocessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhook Diagnostics</h1>
          <p className="text-muted-foreground">Inspect and reprocess payment gateway webhook events</p>
        </div>
        <Button variant="outline" onClick={loadEvents} disabled={loading}>
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
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All providers</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="paystack">Paystack</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="reprocessed">Reprocessed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Webhook Events ({events.length})</CardTitle>
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
                  <TableHead>Provider</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Txn Ref</TableHead>
                  <TableHead>Target Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium capitalize">{event.provider}</TableCell>
                    <TableCell className="text-xs">{event.event_type || event.event_id}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          event.status === 'reprocessed'
                            ? 'secondary'
                            : event.status === 'processed'
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {event.status || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{event.provider_txn_id || '-'}</TableCell>
                    <TableCell>{event.target_status || '-'}</TableCell>
                    <TableCell>{new Date(event.created_at).toLocaleString()}</TableCell>
                    <TableCell className="space-x-2">
                      {event.transaction_id && (
                        <Link href={`/admin/transactions?id=${event.transaction_id}`}>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-3 w-3 mr-1" />
                            View Txn
                          </Button>
                        </Link>
                      )}
                      {event.provider_txn_id && event.target_status && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reprocessingId === event.id}
                          onClick={() => handleReprocess(event)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Reprocess
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
