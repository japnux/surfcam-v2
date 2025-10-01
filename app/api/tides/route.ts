import { NextRequest, NextResponse } from 'next/server'
import { getTides } from '@/lib/api/tides'
import { config } from '@/lib/config'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    if (!lat || !lon) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lon)

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude' },
        { status: 400 }
      )
    }

    const tides = await getTides(latitude, longitude)

    return NextResponse.json(tides, {
      headers: {
        'Cache-Control': `public, s-maxage=${config.forecastCacheTTL}, stale-while-revalidate=${config.forecastCacheTTL * 2}`,
      },
    })
  } catch (error) {
    console.error('Tides error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tides' },
      { status: 500 }
    )
  }
}
