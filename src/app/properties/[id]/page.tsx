import type { Metadata } from 'next';
import { PropertyDetails } from '@/components/properties/PropertyDetails';
import { getPropertyById } from '@/services/sanity/properties.sanity';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  const property = await getPropertyById(params.id);
  if (!property) return { title: 'Property - Real Estate Invest' };

  return {
    title: `${property.title} - Real Estate Invest`, 
    description: property.description ? property.description.substring(0, 160) : property.address || 'View this property on Real Estate Invest'
  };
}

export default async function PropertyDetailsPage({ params }: { params: any }) {
  const resolvedParams = await Promise.resolve(params);
  const property = await getPropertyById(resolvedParams.id);

  if (!property) {
    notFound();
  }

  return <PropertyDetails property={property} />;
}
