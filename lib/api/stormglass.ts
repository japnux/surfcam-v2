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

/**
 * Fetch weather and wave forecast from Stormglass API
 */
export async function getStormglassForecast(
  lat: number,
  lng: number
): Promise<StormglassForecast | null> {
  const apiKey = config.stormglass.apiKey

  if (!apiKey) {
    console.error('Stormglass API key is not configured')
    return null
  }

  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      params: [
        'airTemperature',
        'waterTemperature',
        'windSpeed',
        'windDirection',
        'gust',
        'waveHeight',
        'waveDirection',
        'wavePeriod',
      ].join(','),
      source: 'sg', // Use only Stormglass data
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

    if (!response.ok) {
      console.error('Stormglass API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching Stormglass forecast:', error)
    return null
  }
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
  }))
}
