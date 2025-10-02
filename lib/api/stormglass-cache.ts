import { createServiceClient } from '@/lib/supabase/server'
import { getStormglassForecast, getStormglassTides, transformStormglassData } from './stormglass'

const DAILY_LIMIT = 10
const CACHE_VALIDITY_HOURS = 24
const MIN_FORECAST_HOURS_AHEAD = 12 // Si moins de 12h de prévisions restantes, on rafraîchit

interface CachedForecast {
  id: string
  spot_id: string
  payload: any
  fetched_at: string
  source: string
  valid_until: string | null
  data_start: string | null
  data_end: string | null
}

/**
 * Get today's API call count from database
 */
async function getTodayCallCount(): Promise<number> {
  const supabase = await createServiceClient()
  
  const { data, error } = await supabase.rpc('get_stormglass_call_count')
  
  if (error) {
    console.error('Error getting call count:', error)
    return 0
  }
  
  return data || 0
}

/**
 * Increment the API call counter
 */
async function incrementCallCount(): Promise<number> {
  const supabase = await createServiceClient()
  
  const { data, error } = await supabase.rpc('increment_stormglass_calls')
  
  if (error) {
    console.error('Error incrementing call count:', error)
    throw error
  }
  
  return data || 0
}

/**
 * Check if cached forecast is still valid
 */
function isCacheValid(cache: CachedForecast | null): boolean {
  if (!cache || !cache.valid_until || !cache.data_end) {
    return false
  }

  const now = new Date()
  const validUntil = new Date(cache.valid_until)
  const dataEnd = new Date(cache.data_end)

  // Cache expired?
  if (now > validUntil) {
    return false
  }

  // Not enough forecast hours remaining?
  const hoursRemaining = (dataEnd.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (hoursRemaining < MIN_FORECAST_HOURS_AHEAD) {
    return false
  }

  return true
}

/**
 * Get cached forecast for a spot
 */
async function getCachedForecast(spotId: string): Promise<CachedForecast | null> {
  const supabase = await createServiceClient()
  
  const { data, error } = await supabase
    .from('spot_forecast_cache')
    .select('*')
    .eq('spot_id', spotId)
    .eq('source', 'stormglass')
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as CachedForecast
}

/**
 * Save forecast to cache
 */
async function saveForecastToCache(
  spotId: string,
  forecast: any,
  tides: any
): Promise<void> {
  const supabase = await createServiceClient()
  
  const now = new Date()
  const validUntil = new Date(now.getTime() + CACHE_VALIDITY_HOURS * 60 * 60 * 1000)
  
  // Find data range from forecast
  const hours = forecast.hours || []
  const dataStart = hours.length > 0 ? new Date(hours[0].time) : now
  const dataEnd = hours.length > 0 ? new Date(hours[hours.length - 1].time) : now

  const payload = {
    forecast: transformStormglassData(forecast),
    tides: tides?.data || [],
    meta: {
      ...forecast.meta,
      station: tides?.meta?.station,
      cached_at: now.toISOString(),
    },
  }

  const { error } = await supabase
    .from('spot_forecast_cache')
    .upsert({
      spot_id: spotId,
      payload,
      source: 'stormglass',
      fetched_at: now.toISOString(),
      valid_until: validUntil.toISOString(),
      data_start: dataStart.toISOString(),
      data_end: dataEnd.toISOString(),
    }, {
      onConflict: 'spot_id',
    })

  if (error) {
    console.error('Error saving to cache:', error)
    throw error
  }
}

/**
 * Main function: Get forecast with intelligent caching
 * Returns forecast data and indicates if it came from cache
 */
export async function getStormglassForecastCached(
  spotId: string,
  lat: number,
  lng: number
): Promise<{ data: any; fromCache: boolean; callsRemaining: number } | null> {
  try {
    // 1. Check cache first
    const cached = await getCachedForecast(spotId)
    
    if (cached && isCacheValid(cached)) {
      const callCount = await getTodayCallCount()
      console.log(`✅ Using cached Stormglass data for spot ${spotId}`)
      return {
        data: cached.payload,
        fromCache: true,
        callsRemaining: DAILY_LIMIT - callCount,
      }
    }

    // 2. Check daily limit
    const callCount = await getTodayCallCount()
    
    if (callCount >= DAILY_LIMIT) {
      console.warn(`⚠️ Stormglass daily limit reached (${callCount}/${DAILY_LIMIT})`)
      
      // Return cached data even if expired, better than nothing
      if (cached) {
        console.log(`📦 Returning expired cache for spot ${spotId}`)
        return {
          data: cached.payload,
          fromCache: true,
          callsRemaining: 0,
        }
      }
      
      // No cache available, return null to trigger fallback
      return null
    }

    // 3. Fetch fresh data from Stormglass
    console.log(`🌊 Fetching fresh Stormglass data for spot ${spotId} (${callCount + 1}/${DAILY_LIMIT})`)
    
    const [forecast, tides] = await Promise.all([
      getStormglassForecast(lat, lng),
      getStormglassTides(lat, lng),
    ])

    if (!forecast) {
      console.error('Failed to fetch Stormglass forecast')
      
      // Return cached data as fallback
      if (cached) {
        return {
          data: cached.payload,
          fromCache: true,
          callsRemaining: DAILY_LIMIT - callCount,
        }
      }
      
      return null
    }

    // 4. Increment call counter (2 calls: forecast + tides)
    await incrementCallCount() // Forecast call
    await incrementCallCount() // Tides call
    
    const newCallCount = callCount + 2

    // 5. Save to cache
    await saveForecastToCache(spotId, forecast, tides)

    // 6. Return fresh data
    const transformed = transformStormglassData(forecast)
    
    return {
      data: {
        forecast: transformed,
        tides: tides?.data || [],
        meta: {
          ...forecast.meta,
          station: tides?.meta?.station,
          cached_at: new Date().toISOString(),
        },
      },
      fromCache: false,
      callsRemaining: DAILY_LIMIT - newCallCount,
    }
  } catch (error) {
    console.error('Error in getStormglassForecastCached:', error)
    
    // Try to return cached data as last resort
    const cached = await getCachedForecast(spotId)
    if (cached) {
      return {
        data: cached.payload,
        fromCache: true,
        callsRemaining: 0,
      }
    }
    
    return null
  }
}

/**
 * Get API usage stats
 */
export async function getStormglassUsageStats() {
  const callCount = await getTodayCallCount()
  
  return {
    used: callCount,
    limit: DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - callCount),
    percentage: Math.round((callCount / DAILY_LIMIT) * 100),
  }
}
