"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase/supabase';

export default function AdminOnchainDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error('No active session');

        const res = await fetch('/api/admin/onchain/deposits', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch deposits');
        const data = await res.json();
        setDeposits(data.deposits || []);
      } catch (err) {
        console.error('Failed to load deposits:', err);
        toast({ title: 'Error', description: 'Failed to load deposits', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const verifyDeposit = async (txn: any) => {
    try {
      const tx = window.prompt('Enter the on-chain transaction hash (txHash) to mark this deposit completed:');
      if (!tx) throw new Error('txHash is required');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error('No active session');

      const res = await fetch('/api/admin/onchain/deposits', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ transactionId: txn.id, txHash: tx }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to verify deposit');

      toast({ title: 'Verified', description: 'Deposit marked as completed.' });
      setDeposits(deposits.filter(d => d.id !== txn.id));
    } catch (err: any) {
      console.error('Verify deposit error:', err);
      toast({ title: 'Error', description: err.message || 'Failed to verify deposit', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">On-chain Deposits</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pending Crypto Deposits ({deposits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : deposits.length === 0 ? (
            <p>No pending crypto deposits to verify.</p>
          ) : (
            <div className="space-y-3">
              {deposits.map(dep => (
                <div key={dep.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">User: {dep.user_id}</span>
                      {dep.status === 'waiting_confirmation' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          User Claimed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>Amount: {dep.amount} {dep.currency}</span>
                      <span>•</span>
                      <span>{new Date(dep.created_at).toLocaleDateString()}</span>
                    </div>
                    {dep.metadata?.note && (
                      <div className="text-xs text-muted-foreground italic">
                        Note: {dep.metadata.note}
                      </div>
                    )}
                  </div>
                  <Button onClick={() => verifyDeposit(dep)} size="sm">Verify on-chain</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
