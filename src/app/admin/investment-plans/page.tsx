'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import investmentPlansService from '@/services/supabase/investment-plans.service';
import { useToast } from '@/hooks/use-toast';
import { formatAmount } from '@/lib/helpers';

interface InvestmentPlan {
  id: string;
  name: string;
  description: string | null;
  roi_rate: number;
  min_investment: number;
  max_investment: number | null;
  duration_months: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AdminInvestmentPlansPage() {
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const allPlans = await investmentPlansService.getAllPlans();
      setPlans(allPlans || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast({
        title: 'Error',
        description: 'Failed to load investment plans.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this investment plan?')) return;

    try {
      await investmentPlansService.deletePlan(planId);
      toast({
        title: 'Success',
        description: 'Investment plan deleted successfully.',
      });
      loadPlans(); // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete investment plan.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Manage Investment Plans</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading investment plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Investment Plans</h1>
        <Button>
          <PlusCircle className="mr-2 h-5 w-5" />
          Add New Plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Investment Plans ({plans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>ROI Rate</TableHead>
                <TableHead>Min Investment</TableHead>
                <TableHead>Max Investment</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length > 0 ? plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{plan.name}</div>
                      {plan.description && (
                        <div className="text-sm text-muted-foreground">{plan.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{plan.roi_rate}%</Badge>
                  </TableCell>
                  <TableCell>{formatAmount(plan.min_investment)}</TableCell>
                  <TableCell>
                    {plan.max_investment ? formatAmount(plan.max_investment) : 'Unlimited'}
                  </TableCell>
                  <TableCell>
                    {plan.duration_months ? `${plan.duration_months} months` : 'Flexible'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.status === 'active' ? 'default' : 'secondary'}>
                      {plan.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No investment plans found.
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