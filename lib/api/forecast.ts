import { config } from '@/lib/config'

export interface HourlyForecast {
  time: string
  windSpeed: number
  windGust: number
  windDirection: number
  airTemp: number
  waterTemp: number
  waveHeight: number
  wavePeriod: number
  waveDirection: number
  secondaryWaveHeight: number | null
  secondaryWavePeriod: number | null
  secondaryWaveDirection: number | null
  precipitation: number
  pressure: number
  uvIndex: number
  swellPower?: number
  waveEnergy?: number
}

export interface DailyData {
  sunrise: string
  sunset: string
}

export interface ForecastData {
  hourly: HourlyForecast[]
  daily: DailyData[]
}

export async function getForecast(
  latitude: number,
  longitude: number
): Promise<ForecastData> {
  const weatherParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    hourly: [
      'temperature_2m',
      'precipitation',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'uv_index',
    ].join(','),
    daily: 'sunrise,sunset',
    timezone: 'auto',
    forecast_days: '7',
  })

  const marineParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    hourly: [
      'swell_wave_height',
      'swell_wave_period',
      'swell_wave_direction',
      'sea_surface_temperature',
    ].join(','),
    timezone: 'auto',
    forecast_days: '7',
  })

  const [weatherRes, marineRes] = await Promise.all([
    fetch(`${config.openMeteo.weatherUrl}?${weatherParams}`),
    fetch(`${config.openMeteo.marineUrl}?${marineParams}`),
  ])

  if (!weatherRes.ok || !marineRes.ok) {
    throw new Error('Failed to fetch forecast data')
  }

  const [weatherData, marineData] = await Promise.all([
    weatherRes.json(),
    marineRes.json(),
  ])

  // Normalize the data
  const hourly: HourlyForecast[] = []
  const length = weatherData.hourly.time.length

  for (let i = 0; i < length; i++) {
    hourly.push({
      time: weatherData.hourly.time[i],
      windSpeed: weatherData.hourly.wind_speed_10m[i] || 0,
      windGust: weatherData.hourly.wind_gusts_10m[i] || 0,
      windDirection: weatherData.hourly.wind_direction_10m[i] || 0,
      airTemp: weatherData.hourly.temperature_2m[i] || 0,
      waterTemp: marineData.hourly.sea_surface_temperature[i] || 0,
      // Use primary swell data (more relevant for surf than total wave height)
      waveHeight: marineData.hourly.swell_wave_height[i] || 0,
      wavePeriod: marineData.hourly.swell_wave_period[i] || 0,
      waveDirection: marineData.hourly.swell_wave_direction[i] || 0,
      // Open-Meteo doesn't provide secondary swell in free tier
      secondaryWaveHeight: null,
      secondaryWavePeriod: null,
      secondaryWaveDirection: null,
      precipitation: weatherData.hourly.precipitation[i] || 0,
      pressure: weatherData.hourly.surface_pressure[i] || 0,
      uvIndex: weatherData.hourly.uv_index[i] || 0,
    })
  }

  const daily: DailyData[] = []
  const dailyLength = weatherData.daily.time.length

  for (let i = 0; i < dailyLength; i++) {
    daily.push({
      sunrise: weatherData.daily.sunrise[i],
      sunset: weatherData.daily.sunset[i],
    })
  }

  return { hourly, daily }
}

export function getCurrentConditions(forecast: ForecastData): HourlyForecast | null {
  if (!forecast.hourly.length) return null
  
  const now = new Date()
  const currentHour = forecast.hourly.find(h => {
    const hourTime = new Date(h.time)
    return hourTime.getHours() === now.getHours()
  })
  
  return currentHour || forecast.hourly[0]
}
