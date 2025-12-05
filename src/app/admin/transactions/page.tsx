
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatAmount } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

const transactions = [
    { id: 'TRN001', userId: '2', type: 'Deposit', amount: 100000, date: '2024-07-20', status: 'Completed' },
    { id: 'TRN002', userId: '3', type: 'Deposit', amount: 150000, date: '2024-07-18', status: 'Completed' },
    { id: 'TRN003', userId: '4', type: 'Withdrawal', amount: 20000, date: '2024-07-15', status: 'Pending' },
    { id: 'TRN004', userId: '5', type: 'Deposit', amount: 200000, date: '2024-07-12', status: 'Completed' },
    { id: 'TRN005', userId: '2', type: 'Withdrawal', amount: 15000, date: '2024-07-22', status: 'Approved' },
];


export default function AdminTransactionsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Manage Transactions</h1>
       <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-medium">{txn.id}</TableCell>
                  <TableCell>{txn.userId}</TableCell>
                  <TableCell>
                     <Badge variant={txn.type === 'Deposit' ? 'secondary' : 'outline'}>
                        {txn.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatAmount(txn.amount)}</TableCell>
                  <TableCell>{txn.date}</TableCell>
                   <TableCell>
                    <Badge variant={
                        txn.status === 'Completed' || txn.status === 'Approved' ? 'default' 
                        : txn.status === 'Pending' ? 'destructive' : 'secondary'
                    }>
                        {txn.status}
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
