import { Button } from '@/components/ui/button';
import { IProperty } from '@/lib/types';
import { getPropertiesFeatured } from '@/services/sanity/properties.sanity';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PropertyCard } from '../properties/PropertyCard';

export async function FeaturedProperties() {
  let properties: IProperty[] = [];

  try {
    properties = await getPropertiesFeatured();
  } catch (error) {
    console.error('Failed to fetch featured properties:', error);
    // Return empty array to prevent build failure
    properties = [];
  }

  if (!properties || properties.length === 0) {
    return (
      <section className="py-20 sm:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Featured Properties</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Handpicked properties by our team of experts, representing the best in the market.
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-lg mb-6">No featured properties available at the moment.</p>
            <Button asChild size="lg">
              <Link href="/properties">Explore All Properties</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">Featured Properties</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Handpicked properties by our team of experts, representing the best in the market.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <PropertyCard key={property._id} property={property} />
          ))}
        </div>
        <div className="text-center mt-16">
          <Button asChild size="lg" variant="outline">
            <Link href="/properties">View All Properties</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
