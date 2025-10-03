import { Spot } from './spots'
import { getStormglassForecastCached } from '@/lib/api/stormglass-cache'
import { getForecast as getOpenMeteoForecast, ForecastData as OpenMeteoForecastData, HourlyForecast, DailyData } from '@/lib/api/forecast'
import { TideEvent } from '@/lib/api/tides'

export interface ForecastData extends OpenMeteoForecastData {
  tides?: TideEvent[]
  meta: {
    source: 'stormglass' | 'open-meteo'
    fromCache?: boolean
    callsRemaining?: number
    cached_at?: string
  }
}

/**
 * Get forecast source name for display
 */
export function getForecastSourceName(source: 'stormglass' | 'open-meteo'): string {
  return source === 'stormglass' ? 'Stormglass' : 'Open-Meteo'
}

/**
 * Get unified forecast data for display (compatible with existing components)
 * Automatically chooses Stormglass or Open-Meteo and converts to unified format
 */
export async function getForecast(spot: Spot): Promise<ForecastData> {
  // If spot has daily forecast enabled, try Stormglass first
  if (spot.has_daily_forecast) {
    try {
      const result = await getStormglassForecastCached(
        spot.id,
        spot.latitude,
        spot.longitude
      )

      if (result) {
        // Convert Stormglass format to OpenMeteo format
        const hourly: HourlyForecast[] = result.data.forecast.map((item: any) => ({
          time: item.time,
          windSpeed: item.windSpeed || 0,
          windGust: item.gust || 0,
          windDirection: item.windDirection || 0,
          airTemp: item.airTemperature || 0,
          waterTemp: item.waterTemperature || 0,
          waveHeight: item.waveHeight || 0,
          wavePeriod: item.wavePeriod || 0,
          waveDirection: item.waveDirection || 0,
        }))

        // Fetch sunrise/sunset from Open-Meteo (Stormglass doesn't provide it)
        let daily: DailyData[] = []
        try {
          const openMeteoData = await getOpenMeteoForecast(spot.latitude, spot.longitude)
          daily = openMeteoData.daily
        } catch (err) {
          console.warn('Failed to fetch daily data from Open-Meteo:', err)
        }

        return {
          hourly,
          daily,
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
      ...openMeteoData,
      tides: [], // Open-Meteo doesn't provide tides
      meta: {
        source: 'open-meteo',
      },
    }
  } catch (error) {
    console.error(`❌ Open-Meteo error for ${spot.name}:`, error)
    throw new Error('Failed to fetch forecast from any source')
  }
}
