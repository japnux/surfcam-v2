import { createServiceClient } from '@/lib/supabase/server'
import { Spot } from './spots'

export interface SpotWithSources extends Spot {
  forecast_source: 'stormglass' | 'open-meteo' | null
  forecast_cached_at: string | null
  tide_source: 'mareepeche' | null
  tide_updated_at: string | null
}

/**
 * Get all spots with their data sources and timestamps
 */
export async function getSpotsWithSources(): Promise<SpotWithSources[]> {
  const supabase = await createServiceClient()

  // Get all spots
  const { data: spots, error: spotsError } = await supabase
    .from('spots')
    .select('*')
    .order('name')

  if (spotsError || !spots) {
    console.error('Error fetching spots:', spotsError)
    return []
  }

  // Get forecast cache data
  const { data: forecastCache } = await supabase
    .from('spot_forecast_cache')
    .select('spot_id, source, fetched_at')

  // Get tide data
  const { data: tideData } = await supabase
    .from('tides')
    .select('spot_id, updated_at')
    .order('updated_at', { ascending: false })

  // Create maps for quick lookup
  const forecastMap = new Map(
    forecastCache?.map(f => [f.spot_id, { source: f.source, cached_at: f.fetched_at }]) || []
  )

  // Get most recent tide per spot
  const tideMap = new Map<string, string>()
  tideData?.forEach(t => {
    if (!tideMap.has(t.spot_id)) {
      tideMap.set(t.spot_id, t.updated_at)
    }
  })

  // Combine data
  const spotsWithSources: SpotWithSources[] = spots.map(spot => {
    const forecastInfo = forecastMap.get(spot.id)
    const tideUpdatedAt = tideMap.get(spot.id)

    return {
      ...spot,
      forecast_source: spot.has_daily_forecast 
        ? (forecastInfo?.source as 'stormglass' || 'stormglass')
        : 'open-meteo',
      forecast_cached_at: forecastInfo?.cached_at || null,
      tide_source: tideUpdatedAt ? 'mareepeche' : null,
      tide_updated_at: tideUpdatedAt || null,
    }
  })

  return spotsWithSources
}
