/**
 * API Route: GET /api/spots
 * Returns all active spots for the mobile app
 */

import { NextResponse } from 'next/server';
import { getActiveSpots } from '@/lib/data/spots';

export async function GET() {
  try {
    const spots = await getActiveSpots();
    
    return NextResponse.json(spots, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error fetching spots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch spots' },
      { status: 500 }
    );
  }
}
