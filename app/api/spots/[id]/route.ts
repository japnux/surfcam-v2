/**
 * API Route: GET /api/spots/[id]
 * Returns a single spot by ID
 */

import { NextResponse } from 'next/server';
import { getSpotBySlug } from '@/lib/data/spots';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const spot = await getSpotBySlug(params.id);
    
    if (!spot) {
      return NextResponse.json(
        { error: 'Spot not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(spot, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching spot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spot' },
      { status: 500 }
    );
  }
}
