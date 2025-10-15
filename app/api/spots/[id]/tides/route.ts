/**
 * API Route: GET /api/spots/[id]/tides
 * Returns tide data for a spot
 */

import { NextResponse } from 'next/server';
import { getSpotBySlug } from '@/lib/data/spots';
import { getTidesForSpotMultipleDays } from '@/lib/data/tides';

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
    
    const tides = await getTidesForSpotMultipleDays(spot.id, 3);
    
    return NextResponse.json(tides, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    console.error('Error fetching tides:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tides' },
      { status: 500 }
    );
  }
}
