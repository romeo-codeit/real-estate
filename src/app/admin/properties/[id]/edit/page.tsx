'use client';

import { PropertyForm } from '@/components/admin/PropertyForm';
import { getPropertyById } from '@/lib/data';
import type { Property } from '@/lib/types';
import { notFound } from 'next/navigation';
import { use, useEffect, useState } from 'react';

const EditPropertyPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  const { id } = use(params);

  useEffect(() => {
    if (!id) return;

    const fetchProperty = async () => {
      setLoading(true);
      const fetchedProperty = await getPropertyById(id);

      if (!fetchedProperty) {
        setLoading(false);
        return;
      }

      setProperty(fetchedProperty);
      setLoading(false);
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!property) {
    return notFound();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Edit Property</h1>
      <PropertyForm property={property} />
    </div>
  );
};

export default EditPropertyPage;
