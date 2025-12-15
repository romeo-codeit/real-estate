
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatAmount } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye } from 'lucide-react';
import investmentService from '@/services/supabase/investment.service';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdminInvestmentsPage() {
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadInvestments = async () => {
      try {
        // Get all investments (admin view - no user filter)
        const allInvestments = await investmentService.getInvestments();
        setInvestments(allInvestments || []);
      } catch (error) {
        console.error('Error loading investments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load investments.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadInvestments();
  }, [toast]);

  if (loading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Manage Investments</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading investments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Manage Investments</h1>
       <Card>
        <CardHeader>
          <CardTitle>All Investments ({investments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investment ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Property ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.map((investment) => (
                <TableRow key={investment.id}>
                  <TableCell className="font-medium">{investment.id}</TableCell>
                  <TableCell>{investment.user_id}</TableCell>
                  <TableCell>{investment.property_id}</TableCell>
                  <TableCell>{formatAmount(investment.amount_invested || 0)}</TableCell>
                  <TableCell>{new Date(investment.created_at).toLocaleDateString()}</TableCell>
                   <TableCell>
                    <Badge variant={investment.status === 'active' ? 'secondary' : 'default'}>
                        {investment.status || 'Active'}
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
