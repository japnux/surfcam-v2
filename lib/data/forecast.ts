import { Spot } from './spots'
import { getStormglassForecastCached } from '@/lib/api/stormglass-cache'
import { getForecast as getOpenMeteoForecast, ForecastData as OpenMeteoForecastData, HourlyForecast } from '@/lib/api/forecast'

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

export interface UnifiedForecastData extends OpenMeteoForecastData {
  meta: {
    source: 'stormglass' | 'open-meteo'
    fromCache?: boolean
    callsRemaining?: number
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

/**
 * Get unified forecast data for display (compatible with existing components)
 * Automatically chooses Stormglass or Open-Meteo and converts to unified format
 */
export async function getUnifiedForecast(spot: Spot): Promise<UnifiedForecastData> {
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
        
        // Convert Stormglass format to OpenMeteo format
        const hourly: HourlyForecast[] = result.data.forecast.map((item: any) => ({
          time: item.time,
          windSpeed: item.windSpeed?.sg || item.windSpeed || 0,
          windGust: item.gust?.sg || item.gust || 0,
          windDirection: item.windDirection?.sg || item.windDirection || 0,
          airTemp: item.airTemperature?.sg || item.airTemperature || 0,
          waterTemp: item.waterTemperature?.sg || item.waterTemperature || 0,
          waveHeight: item.waveHeight?.sg || item.waveHeight || 0,
          wavePeriod: item.wavePeriod?.sg || item.wavePeriod || 0,
          waveDirection: item.waveDirection?.sg || item.waveDirection || 0,
          secondaryWaveHeight: item.secondarySwellHeight?.sg || item.secondarySwellHeight || null,
          secondaryWavePeriod: item.secondarySwellPeriod?.sg || item.secondarySwellPeriod || null,
          secondaryWaveDirection: item.secondarySwellDirection?.sg || item.secondarySwellDirection || null,
          precipitation: item.precipitation?.sg || item.precipitation || 0,
          pressure: item.pressure?.sg || item.pressure || 0,
          uvIndex: item.uvIndex?.sg || item.uvIndex || 0,
          swellPower: item.swellPower?.sg || item.swellPower,
          waveEnergy: item.waveEnergy?.sg || item.waveEnergy,
        }))

        return {
          hourly,
          daily: [], // Stormglass doesn't provide daily data, keep empty
          meta: {
            source: 'stormglass',
            fromCache: result.fromCache,
            callsRemaining: result.callsRemaining,
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
      ...openMeteoData,
      meta: {
        source: 'open-meteo',
      },
    }
  } catch (error) {
    console.error(`❌ Open-Meteo error for ${spot.name}:`, error)
    throw new Error('Failed to fetch forecast from any source')
  }
}
