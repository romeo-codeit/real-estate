
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const referredUsers = [
    { id: 1, name: "John Smith", date: "2024-07-20", status: "Joined" },
    { id: 2, name: "Emily Johnson", date: "2024-07-18", status: "Joined" },
    { id: 3, name: "Michael Williams", date: "2024-07-15", status: "Pending" },
    { id: 4, name: "Jessica Brown", date: "2024-07-12", status: "Joined" },
];

export default function ReferralPage() {
  const router = useRouter();
  const { toast } = useToast();
  const referralLink = "https://realestate-explorer.com/signup?ref=USER123";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link Copied!",
      description: "Your referral link has been copied to your clipboard.",
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Return to previous page</span>
        </Button>
        <h1 className="text-3xl font-bold">Referral</h1>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Refer & Earn</CardTitle>
                <CardDescription>Share your referral link with friends and earn rewards when they join and invest.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm font-medium">Your Referral Link</p>
                <div className="flex items-center gap-2">
                    <Input value={referralLink} readOnly />
                    <Button size="icon" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center">
            <CardContent className="p-6">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold">3</h3>
                <p className="text-muted-foreground">Total Referred Users</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Referred Users</CardTitle>
            <CardDescription>A list of users you have referred.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {referredUsers.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.date}</TableCell>
                            <TableCell>
                                <Badge variant={user.status === 'Joined' ? 'default' : 'secondary'}>
                                    {user.status}
                                </Badge>
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
