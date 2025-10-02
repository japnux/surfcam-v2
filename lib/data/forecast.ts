import { Spot } from './spots'
import { getStormglassForecastCached } from '@/lib/api/stormglass-cache'
import { getForecast as getOpenMeteoForecast } from '@/lib/api/forecast'

export interface ForecastData {
  forecast: any[]
  tides?: any[]
  meta: {
    source: 'stormglass' | 'open-meteo'
    fromCache?: boolean
    callsRemaining?: number
    cached_at?: string
  }
}

/**
 * Get forecast for a spot - automatically chooses best source
 * 
 * Priority:
 * 1. Stormglass (if spot.has_daily_forecast = true and API limit not reached)
 * 2. Open-Meteo (fallback or for non-premium spots)
 */
export async function getSpotForecast(spot: Spot): Promise<ForecastData> {
  // If spot has daily forecast enabled, try Stormglass first
  if (spot.has_daily_forecast) {
    try {
      console.log(`🎯 Attempting Stormglass for spot: ${spot.name}`)
      
      const result = await getStormglassForecastCached(
        spot.id,
        spot.latitude,
        spot.longitude
      )

      if (result) {
        console.log(`✅ Stormglass data ${result.fromCache ? 'from cache' : 'fresh'} for: ${spot.name}`)
        return {
          forecast: result.data.forecast,
          tides: result.data.tides,
          meta: {
            source: 'stormglass',
            fromCache: result.fromCache,
            callsRemaining: result.callsRemaining,
            cached_at: result.data.meta?.cached_at,
          },
        }
      }

      console.warn(`⚠️ Stormglass unavailable for ${spot.name}, falling back to Open-Meteo`)
    } catch (error) {
      console.error(`❌ Stormglass error for ${spot.name}:`, error)
    }
  }

  // Fallback to Open-Meteo
  console.log(`🌤️ Using Open-Meteo for spot: ${spot.name}`)
  
  try {
    const openMeteoData = await getOpenMeteoForecast(
      spot.latitude,
      spot.longitude
    )

    return {
      forecast: openMeteoData.hourly || [],
      meta: {
        source: 'open-meteo',
      },
    }
  } catch (error) {
    console.error(`❌ Open-Meteo error for ${spot.name}:`, error)
    throw new Error('Failed to fetch forecast from any source')
  }
}

/**
 * Check if a spot should use Stormglass
 */
export function shouldUseStormglass(spot: Spot): boolean {
  return spot.has_daily_forecast === true
}

/**
 * Get forecast source name for display
 */
export function getForecastSourceName(source: 'stormglass' | 'open-meteo'): string {
  return source === 'stormglass' ? 'Stormglass (Premium)' : 'Open-Meteo'
}
