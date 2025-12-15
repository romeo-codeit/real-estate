import { NextResponse } from 'next/server';
import { getPropertyById } from '@/services/sanity/properties.sanity';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const property = await getPropertyById(id);

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ property });
  } catch (error) {
    console.error('API /properties/single failed:', error);
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 });
  }
}