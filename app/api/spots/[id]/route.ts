/**
 * API Route: GET /api/spots/[id]
 * Returns a single spot by ID or slug
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
