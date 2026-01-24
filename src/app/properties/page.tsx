'use client';

import { PropertyCard } from '@/components/properties/PropertyCard';
import { SearchFilters } from '@/components/properties/SearchFilters';
import { Button } from '@/components/ui/button';
import type { IProperty } from '@/lib/types';
// NOTE: We now proxy property requests through our own API to avoid
// client-side Sanity CORS/security issues. Use `/api/properties`.
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';

import { Suspense } from 'react';

function PropertiesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<IProperty[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<IProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndFilterProperties = async () => {
      setLoading(true);
      const qs = searchParams.toString();
      const res = await fetch(`/api/properties${qs ? `?${qs}` : ''}`);
      if (!res.ok) {
        console.error('Failed to fetch properties from API', await res.text());
        setProperties([]);
        setFilteredProperties([]);
        setLoading(false);
        return;
      }
      const data = await res.json();
      const allProperties: IProperty[] = data.properties ?? [];
      const reversedProperties = allProperties.reverse(); // Show newest first
      setProperties(reversedProperties);
      setFilteredProperties(reversedProperties);
      setLoading(false);
    };

    fetchAndFilterProperties();
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Return to previous page</span>
        </Button>
      </div>
      <div className="bg-card text-foreground p-8 rounded-lg mb-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-4">Browse Properties</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Find the perfect property that fits your needs.
        </p>
        <SearchFilters />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <PropertyCard key={index} property={null} />
          ))}
        </div>
      ) : filteredProperties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((property) => (
            <PropertyCard key={property._id} property={property} />
          ))}
        </div>
      ) : (
        <div className="col-span-full py-8">
          <EmptyState
            title="No Properties Found"
            description="We couldn't find any properties matching your search. Try adjusting your filters."
            actionLabel="Reset Filters"
            actionLink="/properties"
          />
        </div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div>Loading properties...</div>}>
      <PropertiesPageContent />
    </Suspense>
  );
}
