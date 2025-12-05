
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { getProperties } from '@/lib/data';
import { PropertyCard } from '@/components/properties/PropertyCard';
import type { Property, IProperty } from "@/lib/types";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function InvestedPropertiesPage() {
  const router = useRouter();
  const [investedProperties, setInvestedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvestedProperties = async () => {
      // In a real app, you'd fetch this data for the logged-in user.
      // For now, we'll mock it by taking a few properties.
      const allProperties = await getProperties();
      setInvestedProperties(allProperties.slice(0, 2)); // Mock: user invested in first 2 properties
      setLoading(false);
    };

    fetchInvestedProperties();
  }, []);

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
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>Total Invested:</span>
                  <Badge variant="secondary">{investedProperties.length}</Badge>
                </div>
            </CardContent>
        </Card>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 2 }).map((_, index) => (
                <PropertyCard key={index} property={null} />
            ))}
        </div>
      ) : investedProperties.length > 0 ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {investedProperties.map((property) => {
                const mapped: IProperty = {
                  _id: property.id || String(property.title),
                  title: property.title,
                  price: property.price,
                  address: property.address,
                  bedrooms: property.bedrooms,
                  bathrooms: property.bathrooms,
                  area: property.area,
                  mainImage: property.image ? { asset: { url: property.image } } : null,
                  isFeatured: !!property.featured,
                  propertyType: property.type ? { title: property.type } : null,
                  agent: {
                    _id: 'unknown',
                    name: 'Unknown Agent',
                    profilePhoto: null,
                    title: ''
                  }
                } as unknown as IProperty;
                return <PropertyCard key={property.id} property={mapped} />
            })}
        </div>
      ) : (
        <div className="text-center py-12">
            <h2 className="text-2xl">No Investments Yet</h2>
            <p className="text-muted-foreground">You have not invested in any properties.</p>
        </div>
      )}
    </div>
  );
}
