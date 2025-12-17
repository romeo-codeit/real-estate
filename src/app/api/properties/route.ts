import { NextResponse } from 'next/server';
import { getAllProperties } from '@/services/sanity/properties.sanity';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(request: Request) {
  const limit = checkRateLimit(request as any, { windowMs: 60_000, max: 100 }, 'properties_get');
  if (!limit.ok && limit.response) return limit.response;

  try {
    const properties = await getAllProperties();
    return NextResponse.json({ properties });
  } catch (error) {
    console.error('API /properties failed:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}
