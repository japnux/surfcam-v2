/**
 * API Route: GET /api/spots/[id]/forecast
 * Returns forecast data for a spot
 */

import { NextResponse } from 'next/server';
import { getSpotBySlug } from '@/lib/data/spots';
import { getForecast } from '@/lib/data/forecast';

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
    
    const forecast = await getForecast(spot);
    
    return NextResponse.json(forecast, {
      headers: {
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forecast' },
      { status: 500 }
    );
  }
}
