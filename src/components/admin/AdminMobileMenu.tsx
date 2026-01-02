'use client';

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export function AdminMobileMenu() {
  return (
    <div className="md:hidden flex items-center p-4 border-b bg-card">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <SheetTitle className="sr-only">Admin Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            <AdminSidebar />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
