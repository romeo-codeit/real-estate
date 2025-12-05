
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TransactionsPage() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Return to previous page</span>
        </Button>
        <h1 className="text-3xl font-bold">Transactions</h1>
      </div>
      <div className="text-center py-12">
        <h2 className="text-2xl">Transactions Page Content</h2>
        <p className="text-muted-foreground">This page is under construction.</p>
      </div>
    </div>
  );
}
