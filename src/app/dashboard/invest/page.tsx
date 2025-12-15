
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Building2, Wallet, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/services/supabase/supabase";
import investmentPlansService from '@/services/supabase/investment-plans.service';
import { getCryptos } from '@/services/sanity/crypto.sanity';
import type { IProperty, ICrypto } from "@/lib/types";

interface InvestmentPlan {
  id: string;
  name: string;
  roi_rate: number;
  min_investment: number;
  max_investment: number | null;
  description: string | null;
}

export default function InvestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [cryptos, setCryptos] = useState<ICrypto[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [investmentType, setInvestmentType] = useState<'property' | 'plan' | 'crypto'>('property');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const fetchInvestmentOptions = async () => {
      try {
        // Fetch properties
        const propertiesRes = await fetch('/api/properties');
        const propertiesData = await propertiesRes.json();
        setProperties(propertiesData.properties || []);

        // Fetch investment plans using the service
        const plansData = await investmentPlansService.getActivePlans();
        setPlans(plansData || []);

        // Fetch crypto options
        const cryptosData = await getCryptos();
        setCryptos(cryptosData || []);
      } catch (error) {
        console.error('Error fetching investment options:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchInvestmentOptions();
  }, []);

  const handleInvest = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid investment amount.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTarget) {
      toast({
        title: "Selection Required",
        description: "Please select what you want to invest in.",
        variant: "destructive",
      });
      return;
    }

    // Validate minimum investment amounts
    const investmentAmount = parseFloat(amount);
    if (investmentType === 'plan') {
      const plan = plans.find(p => p.id === selectedTarget);
      if (plan && investmentAmount < plan.min_investment) {
        toast({
          title: "Minimum Investment Required",
          description: `This plan requires a minimum investment of $${plan.min_investment.toLocaleString()}.`,
          variant: "destructive",
        });
        return;
      }
    } else if (investmentType === 'crypto') {
      const crypto = cryptos.find(c => c._id === selectedTarget);
      if (crypto && investmentAmount < crypto.minInvestment) {
        toast({
          title: "Minimum Investment Required",
          description: `This cryptocurrency requires a minimum investment of $${crypto.minInvestment.toLocaleString()}.`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      // Get the current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No active session');
      }

      const response = await fetch('/api/invest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          investmentType,
          targetId: selectedTarget,
          currency: 'USD',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process investment');
      }

      toast({
        title: "Investment Successful",
        description: "Your investment has been processed successfully.",
      });

      // Reset form
      setAmount('');
      setSelectedTarget('');
      setInvestmentType('property');

      // Redirect to invested properties page
      router.push('/dashboard/invested-properties');

    } catch (error) {
      console.error('Investment error:', error);
      toast({
        title: "Investment Failed",
        description: error instanceof Error ? error.message : "Failed to process investment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedTargetName = () => {
    if (investmentType === 'property') {
      const property = properties.find(p => p._id === selectedTarget);
      return property?.title || '';
    } else if (investmentType === 'plan') {
      const plan = plans.find(p => p.id === selectedTarget);
      return plan?.name || '';
    } else if (investmentType === 'crypto') {
      const crypto = cryptos.find(c => c._id === selectedTarget);
      return crypto ? `${crypto.name} (${crypto.symbol})` : '';
    }
    return selectedTarget;
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading investment options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Return to previous page</span>
        </Button>
        <h1 className="text-3xl font-bold">Make an Investment</h1>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Choose Your Investment</CardTitle>
          <CardDescription>
            Select the type of investment and amount you want to invest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleInvest}>
            {/* Investment Type Selection */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Investment Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  className={`cursor-pointer transition-all ${investmentType === 'property' ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => {
                    setInvestmentType('property');
                    setSelectedTarget('');
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold">Real Estate</h3>
                    <p className="text-sm text-muted-foreground">Invest in properties</p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${investmentType === 'plan' ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => {
                    setInvestmentType('plan');
                    setSelectedTarget('');
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold">Investment Plans</h3>
                    <p className="text-sm text-muted-foreground">Structured investment plans</p>
                  </CardContent>
                </Card>

                <Card
                  className={`cursor-pointer transition-all ${investmentType === 'crypto' ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => {
                    setInvestmentType('crypto');
                    setSelectedTarget(cryptos.length > 0 ? cryptos[0]._id : '');
                  }}
                >
                  <CardContent className="p-4 text-center">
                    <Wallet className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h3 className="font-semibold">Cryptocurrency</h3>
                    <p className="text-sm text-muted-foreground">Direct crypto investment</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Target Selection */}
            <div className="space-y-2">
              <Label htmlFor="target">
                {investmentType === 'property' ? 'Select Property' :
                 investmentType === 'plan' ? 'Select Plan' : 'Select Cryptocurrency'}
              </Label>
              {investmentType === 'property' ? (
                <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a property to invest in" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property._id} value={property._id}>
                        {property.title} - ${property.price?.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : investmentType === 'plan' ? (
                <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an investment plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} - {plan.roi_rate}% ROI (Min: ${plan.min_investment})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose cryptocurrency" />
                  </SelectTrigger>
                  <SelectContent>
                    {cryptos.map((crypto) => (
                      <SelectItem key={crypto._id} value={crypto._id}>
                        {crypto.name} ({crypto.symbol}) - ${crypto.price?.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-lg font-medium">
                Investment Amount ($)
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter investment amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 text-xl"
                min="0"
                step="0.01"
              />
              {/* Show minimum investment hint */}
              {selectedTarget && (
                <p className="text-sm text-muted-foreground">
                  {investmentType === 'plan' && (() => {
                    const plan = plans.find(p => p.id === selectedTarget);
                    return plan ? `Minimum investment: $${plan.min_investment.toLocaleString()}` : '';
                  })()}
                  {investmentType === 'crypto' && (() => {
                    const crypto = cryptos.find(c => c._id === selectedTarget);
                    return crypto ? `Minimum investment: $${crypto.minInvestment.toLocaleString()}` : '';
                  })()}
                  {investmentType === 'property' && 'No minimum investment requirement'}
                </p>
              )}
            </div>

            {/* Selected Investment Summary */}
            {selectedTarget && amount && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Investment Summary</h4>
                  <p><strong>Type:</strong> {investmentType.charAt(0).toUpperCase() + investmentType.slice(1)}</p>
                  <p><strong>Investment:</strong> {getSelectedTargetName()}</p>
                  <p><strong>Amount:</strong> ${parseFloat(amount).toLocaleString()}</p>
                  
                  {/* Show additional details based on investment type */}
                  {investmentType === 'plan' && (() => {
                    const plan = plans.find(p => p.id === selectedTarget);
                    return plan ? (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p><strong>Expected ROI:</strong> {plan.roi_rate}% per year</p>
                        <p><strong>Minimum:</strong> ${plan.min_investment.toLocaleString()}</p>
                        {plan.max_investment && <p><strong>Maximum:</strong> ${plan.max_investment.toLocaleString()}</p>}
                      </div>
                    ) : null;
                  })()}
                  
                  {investmentType === 'crypto' && (() => {
                    const crypto = cryptos.find(c => c._id === selectedTarget);
                    return crypto ? (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {crypto.expectedROI && <p><strong>Expected ROI:</strong> {crypto.expectedROI}%</p>}
                        <p><strong>Minimum:</strong> ${crypto.minInvestment.toLocaleString()}</p>
                        {crypto.riskLevel && <p><strong>Risk Level:</strong> {crypto.riskLevel}</p>}
                      </div>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading || !selectedTarget || !amount}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Investment...
                </>
              ) : (
                'Make Investment'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
