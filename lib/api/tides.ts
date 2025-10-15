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

// Stormglass API keys with fallback
const STORMGLASS_API_KEYS = [
  process.env.STORMGLASS_API_KEY,
  process.env.STORMGLASS_API_KEY_2,
].filter(Boolean) as string[]

export async function getTides(
  latitude: number,
  longitude: number,
  spotId?: string
): Promise<TideData> {
  if (STORMGLASS_API_KEYS.length === 0) {
    console.warn('⚠️  No Stormglass API keys configured, using fallback tide data')
    return getFallbackTides(spotId)
  }

  const now = new Date()
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
  // Fetch tide extremes (high/low events)
  const extremesParams = new URLSearchParams({
    lat: latitude.toString(),
    lng: longitude.toString(),
    start: now.toISOString(),
    end: end.toISOString(),
  })

  // Try each API key
  for (let i = 0; i < STORMGLASS_API_KEYS.length; i++) {
    const apiKey = STORMGLASS_API_KEYS[i]
    console.log(`🔑 [Tides] Trying API key ${i + 1}/${STORMGLASS_API_KEYS.length}`)
    
    try {
      const extremesResponse = await fetch(
        `https://api.stormglass.io/v2/tide/extremes/point?${extremesParams}`,
        {
          headers: { Authorization: apiKey },
          next: { revalidate: 3600 }, // Cache 1h
        }
      )

      if (extremesResponse.status === 402) {
        console.warn(`⚠️  [Tides] API key ${i + 1} quota exceeded (402), trying next...`)
        continue
      }
      
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

      if (seaLevelResponse.status === 402) {
        console.warn(`⚠️  [Tides] API key ${i + 1} sea level quota exceeded (402), trying next...`)
        continue
      }
      
      if (!seaLevelResponse.ok) {
        throw new Error(`Stormglass Sea Level API error: ${seaLevelResponse.status}`)
      }

      const seaLevelData = await seaLevelResponse.json()

      // Parse hourly tide heights
      const hourly: HourlyTide[] = (seaLevelData.data || []).map((item: any) => ({
        time: item.time,
        height: item.sg || 0, // Stormglass sea level in meters
      }))

      console.log(`✅ [Tides] Success with API key ${i + 1}: ${events.length} events, ${hourly.length} hourly points`)

      return { events, hourly }
    } catch (error) {
      console.error(`❌ [Tides] Error with API key ${i + 1}:`, error)
      if (i === STORMGLASS_API_KEYS.length - 1) {
        // Last key failed, use fallback
        console.warn('⚠️  All Stormglass Tides API keys failed, using fallback data')
        return getFallbackTides(spotId)
      }
      // Try next key
      continue
    }
  }
  
  // Should never reach here, but just in case
  return getFallbackTides(spotId)
}

async function getFallbackTides(spotId?: string): Promise<TideData> {
  // Try to get real tide data from mareespeche.com cache (2 days for 48h forecast)
  if (spotId) {
    try {
      const { getTidesForSpotMultipleDays } = await import('@/lib/data/tides')
      const allTides = await getTidesForSpotMultipleDays(spotId, 3) // Get 3 days to ensure coverage
      
      if (allTides && allTides.length > 0) {
        // Convert mareespeche data to TideEvent format
        const events: TideEvent[] = allTides.map((t: any, index) => {
          const [hours, minutes] = t.time.split('h').map(Number)
          const date = new Date()
          
          // Distribute tides across days based on their order
          const dayOffset = Math.floor(index / 4) // Assuming 4 tides per day
          date.setDate(date.getDate() + dayOffset)
          date.setHours(hours, minutes, 0, 0)
          
          return {
            time: date.toISOString(),
            height: t.type === 'high' ? 4.8 : 1.2, // Estimated heights for Atlantic coast
            type: t.type
          }
        }).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
        
        const allEvents = events
        
        // Generate hourly data from all events (including next day)
        const hourly = generateHourlyFromEvents(allEvents)
        
        console.log('✅ [Tides] Using mareespeche.com data as fallback')
        return { events, hourly }
      }
    } catch (error) {
      console.warn('⚠️  Could not load mareespeche.com data')
    }
  }
  
  // No tide data available - return empty
  console.warn('⚠️  No tide data available')
  return { events: [], hourly: [] }
}

function generateHourlyFromEvents(events: TideEvent[]): HourlyTide[] {
  const hourly: HourlyTide[] = []
  const now = new Date()
  
  for (let hour = 0; hour < 168; hour++) {
    const date = new Date(now)
    date.setHours(date.getHours() + hour)
    
    // Find surrounding tide events
    const currentTime = date.getTime()
    let prevEvent = events[0]
    let nextEvent = events[1]
    
    for (let i = 0; i < events.length - 1; i++) {
      const eventTime = new Date(events[i].time).getTime()
      const nextEventTime = new Date(events[i + 1].time).getTime()
      
      if (currentTime >= eventTime && currentTime <= nextEventTime) {
        prevEvent = events[i]
        nextEvent = events[i + 1]
        break
      }
    }
    
    // Linear interpolation between tide events
    const prevTime = new Date(prevEvent.time).getTime()
    const nextTime = new Date(nextEvent.time).getTime()
    const timeDiff = nextTime - prevTime
    const timeProgress = (currentTime - prevTime) / timeDiff
    
    const height = prevEvent.height + (nextEvent.height - prevEvent.height) * timeProgress
    
    hourly.push({
      time: date.toISOString(),
      height: Math.max(0, height),
    })
  }
  
  return hourly
}

export function getNextTideEvents(tides: TideData, count: number = 2): TideEvent[] {
  const now = new Date()
  return tides.events
    .filter(event => new Date(event.time) > now)
    .slice(0, count)
}

export function getCurrentTideHeight(tides: TideData): number {
  if (!tides.hourly.length) return 0
  
  const now = new Date()
  const nowTimestamp = now.getTime()
  
  // Filter out past data (older than 1 hour ago)
  const oneHourAgo = nowTimestamp - (60 * 60 * 1000)
  const recentData = tides.hourly.filter(h => {
    const hourTime = new Date(h.time)
    return hourTime.getTime() >= oneHourAgo
  })
  
  if (recentData.length === 0) {
    // No recent data, return 0
    return 0
  }
  
  // Find the closest hour to now
  let closest = recentData[0]
  let smallestDiff = Math.abs(new Date(recentData[0].time).getTime() - nowTimestamp)
  
  for (const hour of recentData) {
    const hourTime = new Date(hour.time).getTime()
    const diff = Math.abs(hourTime - nowTimestamp)
    
    if (diff < smallestDiff) {
      smallestDiff = diff
      closest = hour
    }
  }
  
  return closest.height
}
