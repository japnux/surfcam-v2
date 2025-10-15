/**
 * API Route: GET /api/spots/[id]/forecast
 * Returns forecast data for a spot
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getForecast } from '@/lib/data/forecast';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Try to find by ID first (UUID format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id);
    
    let query = supabase
      .from('spots')
      .select('*')
      .eq('is_active', true);
    
    if (isUUID) {
      query = query.eq('id', params.id);
    } else {
      query = query.eq('slug', params.id);
    }
    
    const { data: spot, error } = await query.single();
    
    if (error || !spot) {
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
