'use client';

import { useEffect, useState } from 'react';
import { suggestSimilarProperties, SuggestSimilarPropertiesInput, SuggestSimilarPropertiesOutput } from '@/ai/flows/suggest-similar-properties';
import { PropertyCard } from './PropertyCard';
import type { IProperty } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '../ui/card';

interface SimilarPropertiesProps {
  propertyDetails: SuggestSimilarPropertiesInput['propertyDetails'];
}

export function SimilarProperties({ propertyDetails }: SimilarPropertiesProps) {
  const [similarProperties, setSimilarProperties] = useState<SuggestSimilarPropertiesOutput>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        setLoading(true);
        setError(null);
        const suggestions = await suggestSimilarProperties({ propertyDetails, numberOfSuggestions: 3 });
        setSimilarProperties(suggestions);
      } catch (e) {
        console.error(e);
        setError('Could not fetch similar properties at this time.');
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [propertyDetails]);

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: 3 }).map((_, i) => (
         <Card key={i} className="overflow-hidden shadow-lg">
            <Skeleton className="h-56 w-full" />
            <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-around pt-2 border-t">
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-5 w-1/4" />
                </div>
            </div>
         </Card>
      ))}
    </div>
  )


  if (loading) {
    return (
       <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Similar Properties</h2>
          <LoadingSkeleton />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Similar Properties</h2>
          <p className="text-destructive">{error}</p>
        </div>
      </section>
    );
  }

  if (similarProperties.length === 0) {
    return null;
  }

  const mapToIProperty = (suggested: any, index: number): IProperty => ({
    _id: `similar-${index}-${Math.random()}`,
    title: `${suggested.bedrooms} Bed ${suggested.propertyType} in ${suggested.location}`,
    price: suggested.price,
    address: suggested.location,
    bedrooms: suggested.bedrooms,
    bathrooms: suggested.bathrooms,
    area: suggested.squareFootage,
    mainImage: { asset: { url: `https://placehold.co/600x400.png?text=${encodeURIComponent(suggested.propertyType)}` } },
    isFeatured: false,
    propertyType: { title: suggested.propertyType as string },
    agent: {
      _id: '1',
      name: 'Unknown Agent',
      profilePhoto: null,
      title: ''
    }
  } as unknown as IProperty);

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Similar Properties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {similarProperties.map((prop, index) => (
            <PropertyCard key={index} property={mapToIProperty(prop, index)} />
          ))}
        </div>
      </div>
    </section>
  );
}
