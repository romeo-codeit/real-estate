import { NextResponse } from 'next/server';
import { getAllProperties } from '@/services/sanity/properties.sanity';

export async function GET() {
  try {
    const properties = await getAllProperties();
    return NextResponse.json({ properties });
  } catch (error) {
    console.error('API /properties failed:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}
