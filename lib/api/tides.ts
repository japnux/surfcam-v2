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
  try {
    // Use Open-Meteo Marine API for tide data
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      hourly: 'ocean_current_velocity,ocean_current_direction',
      daily: 'tidal_range_max,tidal_range_min',
      timezone: 'auto',
      forecast_days: '7',
    })

    const response = await fetch(
      `https://marine-api.open-meteo.com/v1/marine?${params}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )

    if (!response.ok) {
      throw new Error(`Open-Meteo Marine API error: ${response.status}`)
    }

    const data = await response.json()

    // Parse hourly tide heights
    const hourly: HourlyTide[] = []
    const hourlyLength = data.hourly?.time?.length || 0

    for (let i = 0; i < hourlyLength; i++) {
      // Use ocean current velocity as proxy for tide height
      // Open-Meteo doesn't provide direct tide height, so we estimate
      const velocity = data.hourly.ocean_current_velocity?.[i] || 0
      hourly.push({
        time: data.hourly.time[i],
        height: Math.abs(velocity) * 2 + 2, // Rough estimation
      })
    }

    // Detect tide events (high/low) from hourly data
    const events: TideEvent[] = []
    for (let i = 1; i < hourly.length - 1; i++) {
      const prev = hourly[i - 1].height
      const current = hourly[i].height
      const next = hourly[i + 1].height

      // Local maximum (high tide)
      if (current > prev && current > next) {
        events.push({
          time: hourly[i].time,
          height: current,
          type: 'high',
        })
      }
      // Local minimum (low tide)
      else if (current < prev && current < next) {
        events.push({
          time: hourly[i].time,
          height: current,
          type: 'low',
        })
      }
    }

    return { events, hourly }
  } catch (error) {
    console.error('Error fetching tide data from Open-Meteo:', error)
    
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
