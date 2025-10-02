import { NextRequest, NextResponse } from 'next/server'
import { getStormglassForecastCached, getStormglassUsageStats } from '@/lib/api/stormglass-cache'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const spotId = searchParams.get('spotId')
  const lat = parseFloat(searchParams.get('lat') || '')
  const lng = parseFloat(searchParams.get('lng') || '')
  const stats = searchParams.get('stats') === 'true'

  // Return usage stats if requested
  if (stats) {
    try {
      const usageStats = await getStormglassUsageStats()
      return NextResponse.json(usageStats)
    } catch (error) {
      console.error('Error getting stats:', error)
      return NextResponse.json(
        { error: 'Failed to get usage stats' },
        { status: 500 }
      )
    }
  }

  // Validate parameters
  if (!spotId || !lat || !lng) {
    return NextResponse.json(
      { error: 'Missing required parameters: spotId, lat, lng' },
      { status: 400 }
    )
  }

  try {
    const result = await getStormglassForecastCached(spotId, lat, lng)

    if (!result) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch Stormglass forecast. Daily limit may be reached.',
          fallback: 'open-meteo'
        },
        { status: 503 } // Service Unavailable
      )
    }

    return NextResponse.json({
      ...result.data,
      _meta: {
        fromCache: result.fromCache,
        callsRemaining: result.callsRemaining,
        source: 'stormglass',
      },
    })
  } catch (error) {
    console.error('Stormglass API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
