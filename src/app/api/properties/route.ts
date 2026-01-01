import { NextResponse } from 'next/server';
import { getAllProperties } from '@/services/sanity/properties.sanity';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(request: Request) {
  const limit = checkRateLimit(request as any, { windowMs: 60_000, max: 100 }, 'properties_get');
  if (!limit.ok && limit.response) return limit.response;

  try {
    const url = new URL(request.url);
    const location = url.searchParams.get('location') || undefined;
    const type = url.searchParams.get('type') || undefined;
    const priceRange = url.searchParams.get('priceRange') || undefined;

    // prefer server-side filtered properties when filters provided
    const properties = await getFilteredProperties({ location, type, priceRange });
    return NextResponse.json({ properties });
  } catch (error) {
    console.error('API /properties failed:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
} 
