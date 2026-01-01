
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Users, DollarSign, TrendingUp, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth-rbac";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ReferralService } from "@/services/supabase/referral.service";
import { Referral, ReferralStats } from "@/lib/types";
import { useEffect, useState } from "react";

export default function ReferralPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [stats, userReferrals] = await Promise.all([
        ReferralService.getReferralStats(user.id),
        ReferralService.getUserReferrals(user.id)
      ]);

      setReferralStats(stats);
      setReferrals(userReferrals);
    } catch (error) {
      console.error('Error loading referral data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load referral data. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (referralStats?.referralLink) {
      navigator.clipboard.writeText(referralStats.referralLink);
      toast({
        title: "Link Copied!",
        description: "Your referral link has been copied to your clipboard.",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'invested':
        return 'secondary';
      case 'registered':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Referral</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading referral data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Return to previous page</span>
        </Button>
        <h1 className="text-3xl font-bold">Referral</h1>
      </div>
      
      <div className="grid gap-8 md:grid-cols-3">
        <Card>
            <CardHeader>
                <CardTitle>Refer & Earn</CardTitle>
                <CardDescription>Share your referral link with friends and earn 5% commission when they invest.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm font-medium">Your Referral Link</p>
                <div className="flex items-center gap-2">
                    <Input value={referralStats?.referralLink || ''} readOnly />
                    <Button size="icon" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center">
            <CardContent className="p-6">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold">{referralStats?.totalReferrals || 0}</h3>
                <p className="text-muted-foreground">Total Referred Users</p>
            </CardContent>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center">
            <CardContent className="p-6">
                <DollarSign className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold">${(referralStats?.totalCommissionEarned || 0).toFixed(2)}</h3>
                <p className="text-muted-foreground">Total Commission Earned</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Referred Users</CardTitle>
            <CardDescription>A list of users you have referred and their current status.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Commission</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {referrals.length > 0 ? referrals.map((referral) => (
                        <TableRow key={referral.id}>
                            <TableCell>
                                {referral.referee?.first_name} {referral.referee?.last_name}
                                {referral.referee?.email && (
                                  <div className="text-sm text-muted-foreground">
                                    {referral.referee.email}
                                  </div>
                                )}
                            </TableCell>
                            <TableCell>{formatDate(referral.created_at)}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusBadgeVariant(referral.status)}>
                                    {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {referral.commission_amount > 0 ? (
                                    <span className={referral.commission_paid ? 'text-green-600' : 'text-orange-600'} title={referral.commission_paid ? 'Commission paid' : 'Pending'}>
                                        ${referral.commission_amount.toFixed(2)}
                                        {referral.commission_paid && <CheckCircle2 className="inline h-4 w-4 ml-1" />}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                No referrals yet. Share your referral link to start earning commissions!
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
