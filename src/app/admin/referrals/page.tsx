"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase/supabase';

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) throw new Error('No active session');

        const res = await fetch('/api/admin/referrals', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (!res.ok) throw new Error('Failed to fetch referrals');
        const data = await res.json();
        setReferrals(data.referrals || []);
      } catch (err) {
        console.error('Failed to load referrals:', err);
        toast({ title: 'Error', description: 'Failed to load referrals', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const processReferral = async (id: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error('No active session');

      const res = await fetch('/api/admin/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ referralId: id, action: 'process' }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to process referral');

      toast({ title: 'Processed', description: 'Referral commission processed.' });
      setReferrals(referrals.filter(r => r.id !== id));
    } catch (err: any) {
      console.error('Process referral error:', err);
      toast({ title: 'Error', description: err.message || 'Failed to process referral', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Referral Payouts</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pending Referral Commissions ({referrals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : referrals.length === 0 ? (
            <p>No pending referrals to process.</p>
          ) : (
            <div className="space-y-3">
              {referrals.map(ref => (
                <div key={ref.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">Referrer: {ref.referrer_id}</div>
                    <div className="text-sm text-muted-foreground">Commission: {ref.commission_amount}</div>
                  </div>
                  <Button onClick={() => processReferral(ref.id)}>Process Commission</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
