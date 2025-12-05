import { PropertyDetails } from '@/components/properties/PropertyDetails';
import { getSingleProperty } from '@/services/sanity/properties.sanity';
import { notFound } from 'next/navigation';

export default async function PropertyDetailsPage({ params }: { params: any }) {
  const resolvedParams = await Promise.resolve(params);
  const property = await getSingleProperty({ id: resolvedParams.id });

  if (!property) {
    notFound();
  }

  return <PropertyDetails property={property} />;
}
