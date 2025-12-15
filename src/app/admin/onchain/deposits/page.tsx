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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
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
                <div key={dep.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">User: {dep.user_id}</div>
                    <div className="text-sm text-muted-foreground">Amount: {dep.amount}</div>
                  </div>
                  <Button onClick={() => verifyDeposit(dep)}>Verify on-chain</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
