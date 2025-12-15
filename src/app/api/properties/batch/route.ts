import { NextResponse } from 'next/server';
import { getPropertyById } from '@/services/sanity/properties.sanity';

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: 'IDs must be an array' }, { status: 400 });
    }

    const properties = await Promise.all(
      ids.map(async (id: string) => {
        try {
          return await getPropertyById(id);
        } catch (error) {
          console.error(`Failed to fetch property ${id}:`, error);
          return null;
        }
      })
    );

    // Filter out null values
    const validProperties = properties.filter(p => p !== null);

    return NextResponse.json({ properties: validProperties });
  } catch (error) {
    console.error('API /properties/batch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}