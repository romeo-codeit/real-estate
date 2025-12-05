
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export default function TwoFAPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const secretKey = "K3V4I2H3G4F5D6S7"; // Mock secret key

  const handleCopy = () => {
    navigator.clipboard.writeText(secretKey);
    toast({
      title: "Copied!",
      description: "Secret key copied to clipboard.",
    });
  };

  const handleToggleChange = (checked: boolean) => {
    setIs2faEnabled(checked);
    toast({
        title: `2FA has been ${checked ? 'enabled' : 'disabled'}.`,
        description: `Two-factor authentication is now ${checked ? 'active' : 'inactive'}.`,
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Return to previous page</span>
        </Button>
        <h1 className="text-3xl font-bold">2FA Security</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <Label htmlFor="2fa-toggle" className="text-lg font-medium">
                    {is2faEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </Label>
                <Switch 
                    id="2fa-toggle" 
                    checked={is2faEnabled}
                    onCheckedChange={handleToggleChange}
                />
            </div>
            
            {is2faEnabled && (
                <div className="p-6 border rounded-lg bg-muted/50 space-y-6">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold">Configure Your App</h3>
                        <p className="text-sm text-muted-foreground">Scan the QR code or manually enter the key into your authenticator app.</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-full md:w-1/2 flex justify-center">
                             <Image 
                                src="https://placehold.co/200x200.png?text=QR+Code" 
                                alt="QR Code" 
                                width={200} 
                                height={200} 
                                className="rounded-lg"
                                data-ai-hint="qr code"
                             />
                        </div>
                        <div className="w-full md:w-1/2 space-y-4">
                            <div>
                                <Label htmlFor="secret-key">Secret Key</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="secret-key" value={secretKey} readOnly />
                                    <Button size="icon" variant="ghost" onClick={handleCopy}>
                                        <Copy className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                            <form className="space-y-4">
                                <Label htmlFor="verification-code">Enter Verification Code</Label>
                                <Input id="verification-code" placeholder="6-digit code" />
                                <Button className="w-full">Verify & Activate</Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
