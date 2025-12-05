
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Wallet, ArrowDown, ArrowUp, BarChart, Bell, ArrowLeft, LineChart } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import Link from "next/link";
import { useRouter } from "next/navigation";

const initialChartData = [
  { month: "January", total: 0 },
  { month: "February", total: 0 },
  { month: "March", total: 0 },
  { month: "April", total: 0 },
  { month: "May", total: 0 },
  { month: "June", total: 0 },
];

const investedChartData = [
  { month: "January", total: 1200 },
  { month: "February", total: 1800 },
  { month: "March", total: 1500 },
  { month: "April", total: 2200 },
  { month: "May", total: 2500 },
  { month: "June", total: 1900 },
];

const initialTransactions: any[] = [];

const investedTransactions = [
    { id: "TRZ1234", date: "2024-07-22", amount: 2500, type: "Deposit", status: "Completed" },
    { id: "TRZ5678", date: "2024-07-21", amount: 500, type: "Investment", status: "Pending" },
    { id: "TRZ9101", date: "2024-07-20", amount: 150, type: "Withdrawal", status: "Completed" },
    { id: "TRZ1121", date: "2024-07-19", amount: 3000, type: "Deposit", status: "Completed" },
];

const chartConfig = {
  total: {
    label: "Total Invest",
    color: "hsl(var(--chart-1))",
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const [hasInvested, setHasInvested] = useState(false);
  const [userName, setUserName] = useState("John Doe");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const { firstName, lastName } = JSON.parse(user);
      setUserName(`${firstName} ${lastName}`);
    }
  }, []);

  const stats = {
    balance: hasInvested ? 15231.89 : 0,
    totalInvest: hasInvested ? 10500.00 : 0,
    totalDeposit: hasInvested ? 25350.00 : 0,
    totalWithdraw: hasInvested ? 8125.00 : 0,
  };

  const chartData = hasInvested ? investedChartData : initialChartData;
  const transactions = hasInvested ? investedTransactions : initialTransactions;

  return (
    <div className="space-y-8">
        <header className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Return to previous page</span>
                </Button>
                <h1 className="text-3xl font-bold">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="font-bold text-lg">{userName}</p>
                    <p className="text-sm text-muted-foreground">${stats.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <Button variant="ghost" size="icon">
                    <Bell className="h-6 w-6" />
                </Button>
            </div>
        </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            {hasInvested && <p className="text-xs text-muted-foreground">+20.1% from last month</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invest</CardTitle>
            <BarChart className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalInvest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
             {hasInvested && <p className="text-xs text-muted-foreground">+15% from last month</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposit</CardTitle>
            <ArrowDown className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalDeposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            {hasInvested && <p className="text-xs text-muted-foreground">+180.1% from last month</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdraw</CardTitle>
            <ArrowUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalWithdraw.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
             {hasInvested && <p className="text-xs text-muted-foreground">+35% from last month</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Investment Statistics</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <RechartsBarChart accessibilityLayer data={chartData}>
                    <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `$${value / 1000}k`}
                    />
                    <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Latest Transactions</CardTitle>
            <CardDescription>A summary of your most recent transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.slice(0, 4).map((transaction) => (
                        <TableRow key={transaction.id}>
                            <TableCell>
                                <div className="font-medium">{transaction.type}</div>
                                <div className="text-sm text-muted-foreground">{transaction.date}</div>
                            </TableCell>
                            <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge variant={transaction.status === 'Completed' ? 'default' : 'secondary'} className={`${transaction.status === 'Completed' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'}`}>
                                    {transaction.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-10">
                    <LineChart className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="font-medium">No transactions yet.</p>
                    <p className="text-sm text-muted-foreground mb-6">Start investing to see your transaction history.</p>
                    <Button onClick={() => setHasInvested(true)}>
                        Make Your First Investment
                    </Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
