
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/services/supabase/supabase';

export default function TwoFAPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [otpAuthUrl, setOtpAuthUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

  const getSessionToken = useCallback(async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      throw new Error('You must be logged in to manage 2FA');
    }
    return session.access_token;
  }, []);

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getSessionToken();
      const res = await fetch('/api/2fa/status', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch 2FA status');
      const data = await res.json();
      setIs2faEnabled(!!data.enabled);
      setIsConfiguring(false);
      setSecretKey('');
      setOtpAuthUrl('');
    } catch (err: any) {
      console.error('2FA status error:', err);
      toast({ title: 'Error', description: err.message || 'Could not load 2FA status', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [getSessionToken, toast]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const startSetup = async () => {
    setIsWorking(true);
    try {
      const token = await getSessionToken();
      const res = await fetch('/api/2fa/setup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start 2FA setup');

      setSecretKey(data.secret);
      setOtpAuthUrl(data.otpauthUrl);
      setIsConfiguring(true);
      setIs2faEnabled(false);

      toast({ title: '2FA setup started', description: 'Scan the QR or enter the key to continue.' });
    } catch (err: any) {
      console.error('2FA setup error:', err);
      toast({ title: 'Setup failed', description: err.message || 'Could not start 2FA', variant: 'destructive' });
    } finally {
      setIsWorking(false);
    }
  };

  const verifyCode = async () => {
    setIsWorking(true);
    try {
      const token = await getSessionToken();
      const res = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ token: verificationCode })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      setIs2faEnabled(true);
      setIsConfiguring(false);
      toast({ title: '2FA enabled', description: 'Two-factor authentication is now active.' });
    } catch (err: any) {
      toast({ title: 'Verification failed', description: err.message || 'Invalid code', variant: 'destructive' });
    } finally {
      setIsWorking(false);
    }
  };

  const disableTwoFA = async () => {
    setIsWorking(true);
    try {
      const token = await getSessionToken();
      const res = await fetch('/api/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ token: verificationCode || undefined })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to disable 2FA');

      setIs2faEnabled(false);
      setIsConfiguring(false);
      setSecretKey('');
      setOtpAuthUrl('');
      toast({ title: '2FA disabled', description: 'Two-factor authentication has been turned off.' });
    } catch (err: any) {
      toast({ title: 'Disable failed', description: err.message || 'Could not disable 2FA', variant: 'destructive' });
    } finally {
      setIsWorking(false);
    }
  };

  const handleToggleChange = async (checked: boolean) => {
    if (isLoading) return;
    if (checked) {
      await startSetup();
    } else {
      await disableTwoFA();
    }
  };

  const handleCopy = () => {
    if (!secretKey) return;
    navigator.clipboard.writeText(secretKey);
    toast({ title: 'Copied!', description: 'Secret key copied to clipboard.' });
  };

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
                    {(is2faEnabled || isConfiguring) ? 'Disable 2FA' : 'Enable 2FA'}
                </Label>
                <Switch 
                    id="2fa-toggle" 
                    checked={is2faEnabled || isConfiguring}
                    disabled={isWorking || isLoading}
                    onCheckedChange={handleToggleChange}
                />
            </div>

            {(isConfiguring || is2faEnabled) && (
                <div className="p-6 border rounded-lg bg-muted/50 space-y-6">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold">Configure Your App</h3>
                        <p className="text-sm text-muted-foreground">Scan the QR code or manually enter the key into your authenticator app.</p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="w-full md:w-1/2 flex justify-center">
                             <Image 
                                src={otpAuthUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}` : "https://placehold.co/200x200.png?text=QR+Code"} 
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
                                    <Input id="secret-key" value={secretKey} readOnly placeholder={is2faEnabled ? 'Hidden for security' : ''} />
                                    <Button size="icon" variant="ghost" onClick={handleCopy} disabled={!secretKey}>
                                        <Copy className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="verification-code">Enter Verification Code</Label>
                                <Input
                                  id="verification-code"
                                  placeholder="6-digit code"
                                  value={verificationCode}
                                  onChange={(e) => setVerificationCode(e.target.value)}
                                  maxLength={6}
                                />
                                <Button className="w-full" onClick={is2faEnabled ? disableTwoFA : verifyCode} disabled={isWorking}>
                                  {is2faEnabled ? 'Disable with Code' : 'Verify & Activate'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
