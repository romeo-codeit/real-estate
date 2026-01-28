'use client';

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { NotificationsDropdown } from '@/components/dashboard/NotificationsDropdown';

export function DashboardMobileMenu() {
  return (
    <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="flex flex-col h-full">
            <Sidebar />
          </div>
        </SheetContent>
      </Sheet>
      <NotificationsDropdown />
    </div>
  );
}
