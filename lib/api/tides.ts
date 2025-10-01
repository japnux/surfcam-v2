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
  // Open-Meteo doesn't provide tide data directly
  // We'll use a simplified calculation based on location and time
  // For production, you would integrate with a real tide API like NOAA or similar
  
  const now = new Date()
  const events: TideEvent[] = []
  const hourly: HourlyTide[] = []
  
  // Generate mock tide data (simplified sinusoidal pattern)
  // In production, replace with actual tide API
  const baseHeight = 2.5 // meters
  const amplitude = 2.0 // meters
  const periodHours = 12.42 // semi-diurnal tide period
  
  // Generate events for next 7 days
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
  
  // Generate hourly data for next 7 days
  for (let hour = 0; hour < 168; hour++) {
    const date = new Date(now)
    date.setHours(date.getHours() + hour)
    
    const hoursSinceStart = hour
    const radians = (hoursSinceStart / periodHours) * 2 * Math.PI
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
