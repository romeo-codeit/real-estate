
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatAmount } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

const investments = [
    { id: 'INV001', userId: '2', propertyId: '1', amount: 50000, date: '2024-07-20', status: 'Active' },
    { id: 'INV002', userId: '3', propertyId: '2', amount: 75000, date: '2024-07-18', status: 'Active' },
    { id: 'INV003', userId: '4', propertyId: '5', amount: 25000, date: '2024-07-15', status: 'Completed' },
    { id: 'INV004', userId: '5', propertyId: '3', amount: 150000, date: '2024-07-12', status: 'Active' },
];


export default function AdminInvestmentsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Manage Investments</h1>
       <Card>
        <CardHeader>
          <CardTitle>All Investments</CardTitle>
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
                  <TableCell>{investment.userId}</TableCell>
                  <TableCell>{investment.propertyId}</TableCell>
                  <TableCell>{formatAmount(investment.amount)}</TableCell>
                  <TableCell>{investment.date}</TableCell>
                   <TableCell>
                    <Badge variant={investment.status === 'Active' ? 'secondary' : 'default'}>
                        {investment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
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
