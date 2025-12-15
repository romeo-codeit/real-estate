
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { PropertyCard } from '@/components/properties/PropertyCard';
import type { IProperty } from "@/lib/types";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth-rbac";
import investmentService from "@/services/supabase/investment.service";

export default function InvestedPropertiesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [investedProperties, setInvestedProperties] = useState<IProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioSummary, setPortfolioSummary] = useState<any>(null);

  useEffect(() => {
    const fetchInvestedProperties = async () => {
      if (!user?.id) return;

      try {
        // Get portfolio summary with ROI calculations
        const summary = await investmentService.getPortfolioSummary(user.id);
        setPortfolioSummary(summary);

        if (summary.investments && summary.investments.length > 0) {
          // Get unique property IDs (filter out null/undefined)
          const propertyIds = [...new Set(summary.investments
            .filter(inv => inv.investment_type === 'property' && inv.sanity_id)
            .map(inv => inv.sanity_id)
          )];

          // Fetch property details from Sanity for each investment
          if (propertyIds.length > 0) {
            const response = await fetch('/api/properties/batch', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ ids: propertyIds }),
            });

            if (!response.ok) {
              throw new Error('Failed to fetch properties');
            }

            const data = await response.json();
            const properties = data.properties.filter((p: any): p is IProperty => p !== null);
            setInvestedProperties(properties);
          }
        }
      } catch (error) {
        console.error('Error fetching invested properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestedProperties();
  }, [user?.id]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Return to previous page</span>
            </Button>
            <h1 className="text-3xl font-bold">Invested Properties</h1>
        </div>
        <Card className="inline-block">
            <CardContent className="p-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Properties:</span>
                    <Badge variant="secondary">{investedProperties.length}</Badge>
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Total Invested:</span>
                    <Badge variant="default" className="bg-green-500/20 text-green-700">
                      ${portfolioSummary?.totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                    </Badge>
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Current Value:</span>
                    <Badge variant="default" className="bg-blue-500/20 text-blue-700">
                      ${portfolioSummary?.totalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                    </Badge>
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Total ROI:</span>
                    <Badge variant="default" className="bg-purple-500/20 text-purple-700">
                      ${portfolioSummary?.totalROI.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                    </Badge>
                  </div>
                </div>
            </CardContent>
        </Card>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
                <PropertyCard key={index} property={null} />
            ))}
        </div>
      ) : investedProperties.length > 0 ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {investedProperties.map((property) => (
                <PropertyCard key={property._id} property={property} />
            ))}
        </div>
      ) : (
        <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-2">No Investments Yet</h2>
            <p className="text-muted-foreground mb-6">You have not invested in any properties.</p>
            <Button onClick={() => router.push('/properties')}>
              Browse Properties
            </Button>
        </div>
      )}
    </div>
  );
}
