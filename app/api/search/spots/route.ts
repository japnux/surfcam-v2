import { NextRequest, NextResponse } from 'next/server'
import { searchSpots } from '@/lib/data/spots'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const spots = await searchSpots(query)
    return NextResponse.json(spots)
  } catch (error) {
    console.error('Erreur lors de la recherche de spots:', error)
    return NextResponse.json([], { status: 500 })
  }
}
