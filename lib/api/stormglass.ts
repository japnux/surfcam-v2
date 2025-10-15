import { config } from '@/lib/config'

export interface StormglassDataPoint {
  time: string
  airTemperature?: { sg: number }
  waterTemperature?: { sg: number }
  windSpeed?: { sg: number }
  windDirection?: { sg: number }
  gust?: { sg: number }
  waveHeight?: { sg: number }
  waveDirection?: { sg: number }
  wavePeriod?: { sg: number }
  swellPower?: { sg: number }
  waveEnergy?: { sg: number }
}

export interface StormglassTidePoint {
  time: string
  height: number
  type: 'high' | 'low'
}

export interface StormglassForecast {
  hours: StormglassDataPoint[]
  meta: {
    dailyQuota: number
    cost: number
    requestCount: number
    lat: number
    lng: number
  }
}

export interface StormglassTides {
  data: StormglassTidePoint[]
  meta: {
    datum: string
    lat: number
    lng: number
    station: {
      name: string
      distance: number
    }
  }
}

// Stormglass API keys with fallback
const STORMGLASS_API_KEYS = [
  config.stormglass.apiKey,
  process.env.STORMGLASS_API_KEY_2,
].filter(Boolean) as string[]

/**
 * Fetch weather and wave forecast from Stormglass API with fallback keys
 */
export async function getStormglassForecast(
  lat: number,
  lng: number
): Promise<StormglassForecast | null> {
  if (STORMGLASS_API_KEYS.length === 0) {
    console.error('No Stormglass API keys configured')
    return null
  }

  // Base parameters (available in all plans)
  const baseParams = [
    'airTemperature',
    'waterTemperature',
    'windSpeed',
    'windDirection',
    'gust',
    'waveHeight',
    'waveDirection',
    'wavePeriod',
  ]
  
  // Premium parameters (may not be available in all plans)
  const premiumParams = ['swellPower', 'waveEnergy']

  // Try each API key until one works
  for (let i = 0; i < STORMGLASS_API_KEYS.length; i++) {
    const apiKey = STORMGLASS_API_KEYS[i]
    console.log(`🔑 Trying Stormglass API key ${i + 1}/${STORMGLASS_API_KEYS.length}`)
    
    // Try with premium params first, then fallback to base params
    const paramSets = [
      [...baseParams, ...premiumParams],
      baseParams,
    ]
    
    for (const paramSet of paramSets) {
      try {
        const params = new URLSearchParams({
          lat: lat.toString(),
          lng: lng.toString(),
          params: paramSet.join(','),
          source: 'sg',
        })
        
        const response = await fetch(
          `${config.stormglass.baseUrl}/weather/point?${params.toString()}`,
        {
          headers: {
            Authorization: apiKey,
          },
          next: {
            revalidate: 86400, // Cache for 24 hours
          },
        }
      )

        if (response.status === 402) {
          console.warn(`⚠️  API key ${i + 1} quota exceeded (402), trying next key...`)
          if (i === STORMGLASS_API_KEYS.length - 1) {
            throw new Error('HTTP 402: All API keys quota exceeded')
          }
          break // Try next API key
        }
        
        if (response.status === 422 && paramSet.length > baseParams.length) {
          console.warn(`⚠️  API key ${i + 1} doesn't support premium params, retrying with base params...`)
          continue // Try with base params
        }
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText)
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        const data = await response.json()
        console.log(`✅ Successfully fetched data with API key ${i + 1} (${paramSet.length} params)`)
        return data
      } catch (error) {
        console.error(`❌ Error with API key ${i + 1} (${paramSet.length} params):`, error)
        if (paramSet.length === baseParams.length) {
          // Even base params failed, try next key
          break
        }
        // Try with base params
        continue
      }
    }
  }
  
  return null
}

/**
 * Fetch tide data from Stormglass API
 */
export async function getStormglassTides(
  lat: number,
  lng: number
): Promise<StormglassTides | null> {
  const apiKey = config.stormglass.apiKey

  if (!apiKey) {
    console.error('Stormglass API key is not configured')
    return null
  }

  try {
    const now = new Date()
    const end = new Date(now)
    end.setDate(end.getDate() + 7) // Get 7 days of tides

    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      start: Math.floor(now.getTime() / 1000).toString(),
      end: Math.floor(end.getTime() / 1000).toString(),
    })

    const response = await fetch(
      `${config.stormglass.baseUrl}/tide/extremes/point?${params.toString()}`,
      {
        headers: {
          Authorization: apiKey,
        },
        next: {
          revalidate: 86400, // Cache for 24 hours
        },
      }
    )

    if (!response.ok) {
      console.error('Stormglass Tides API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching Stormglass tides:', error)
    return null
  }
}

/**
 * Transform Stormglass data to a format compatible with our frontend
 */
export function transformStormglassData(forecast: StormglassForecast) {
  return forecast.hours.map((hour) => ({
    time: hour.time,
    airTemperature: hour.airTemperature?.sg,
    waterTemperature: hour.waterTemperature?.sg,
    windSpeed: hour.windSpeed?.sg ? hour.windSpeed.sg * 3.6 : undefined, // m/s to km/h
    windDirection: hour.windDirection?.sg,
    gust: hour.gust?.sg ? hour.gust.sg * 3.6 : undefined, // m/s to km/h
    waveHeight: hour.waveHeight?.sg,
    waveDirection: hour.waveDirection?.sg,
    wavePeriod: hour.wavePeriod?.sg,
    swellPower: hour.swellPower?.sg,
    waveEnergy: hour.waveEnergy?.sg,
  }))
}
