export interface TideEvent {
  time: string
  height: number
  type: 'high' | 'low'
}

export interface HourlyTide {
  time: string
  height: number
}

export interface TideData {
  events: TideEvent[]
  hourly: HourlyTide[]
}

export async function getTides(
  latitude: number,
  longitude: number
): Promise<TideData> {
  const apiKey = process.env.STORMGLASS_API_KEY
  
  if (!apiKey) {
    console.warn('⚠️ STORMGLASS_API_KEY not found, using fallback tide data')
    return getFallbackTides()
  }

  try {
    const now = new Date()
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Fetch tide extremes (high/low events)
    const extremesParams = new URLSearchParams({
      lat: latitude.toString(),
      lng: longitude.toString(),
      start: now.toISOString(),
      end: end.toISOString(),
    })

    const extremesResponse = await fetch(
      `https://api.stormglass.io/v2/tide/extremes/point?${extremesParams}`,
      {
        headers: { Authorization: apiKey },
        next: { revalidate: 3600 }, // Cache 1h
      }
    )

    if (!extremesResponse.ok) {
      throw new Error(`Stormglass Tides API error: ${extremesResponse.status}`)
    }

    const extremesData = await extremesResponse.json()

    // Parse tide events
    const events: TideEvent[] = (extremesData.data || []).map((event: any) => ({
      time: event.time,
      height: event.height,
      type: event.type === 'high' ? 'high' : 'low',
    }))

    // Fetch hourly sea level
    const seaLevelParams = new URLSearchParams({
      lat: latitude.toString(),
      lng: longitude.toString(),
      start: now.toISOString(),
      end: end.toISOString(),
    })

    const seaLevelResponse = await fetch(
      `https://api.stormglass.io/v2/tide/sea-level/point?${seaLevelParams}`,
      {
        headers: { Authorization: apiKey },
        next: { revalidate: 3600 },
      }
    )

    if (!seaLevelResponse.ok) {
      throw new Error(`Stormglass Sea Level API error: ${seaLevelResponse.status}`)
    }

    const seaLevelData = await seaLevelResponse.json()

    // Parse hourly tide heights
    const hourly: HourlyTide[] = (seaLevelData.data || []).map((item: any) => ({
      time: item.time,
      height: item.sg || 0, // Stormglass sea level in meters
    }))

    console.log(`🌊 Stormglass Tides: ${events.length} events, ${hourly.length} hourly points`)

    return { events, hourly }
  } catch (error) {
    console.error('Error fetching tide data from Stormglass:', error)
    
    // Fallback to mock data if API fails
    return getFallbackTides()
  }
}

function getFallbackTides(): TideData {
  const now = new Date()
  const events: TideEvent[] = []
  const hourly: HourlyTide[] = []
  
  const baseHeight = 2.5
  const amplitude = 2.0
  const periodHours = 12.42
  
  for (let day = 0; day < 7; day++) {
    for (let tide = 0; tide < 4; tide++) {
      const date = new Date(now)
      date.setDate(date.getDate() + day)
      date.setHours(Math.floor(tide * periodHours / 2))
      date.setMinutes(25 * (tide % 2))
      
      events.push({
        time: date.toISOString(),
        height: baseHeight + (tide % 2 === 0 ? amplitude : -amplitude),
        type: tide % 2 === 0 ? 'high' : 'low',
      })
    }
  }
  
  for (let hour = 0; hour < 168; hour++) {
    const date = new Date(now)
    date.setHours(date.getHours() + hour)
    
    const radians = (hour / periodHours) * 2 * Math.PI
    const height = baseHeight + amplitude * Math.sin(radians)
    
    hourly.push({
      time: date.toISOString(),
      height: Math.max(0, height),
    })
  }
  
  return { events, hourly }
}

export function getNextTideEvents(tides: TideData, count: number = 2): TideEvent[] {
  const now = new Date()
  return tides.events
    .filter(event => new Date(event.time) > now)
    .slice(0, count)
}

export function getCurrentTideHeight(tides: TideData): number {
  const now = new Date()
  const currentHour = tides.hourly.find(h => {
    const hourTime = new Date(h.time)
    return hourTime.getHours() === now.getHours()
  })
  
  return currentHour?.height || 0
}
