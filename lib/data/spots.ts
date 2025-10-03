import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

export type Spot = Database['public']['Tables']['spots']['Row']
export type SpotInsert = Database['public']['Tables']['spots']['Insert']
export type SpotUpdate = Database['public']['Tables']['spots']['Update']

export async function getActiveSpots(limit?: number) {
  const supabase = await createServiceClient()
  
  let query = supabase
    .from('spots')
    .select('*')
    .eq('is_active', true)
    .order('name')
  
  if (limit) {
    query = query.limit(limit)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

export async function getSpotBySlug(slug: string) {
  const supabase = await createServiceClient()
  
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error) throw error
  return data
}

export async function getAllSpots() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export async function searchSpots(query: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .rpc('search_spots_unaccent', { search_query: query })
  
  if (error) throw error
  return data as Spot[]
}

export async function createSpot(spot: SpotInsert) {
  const supabase = await createServiceClient()
  
  const { data, error } = await supabase
    .from('spots')
    .insert(spot)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateSpot(id: string, spot: SpotUpdate) {
  const supabase = await createServiceClient()
  
  const { data, error } = await supabase
    .from('spots')
    .update(spot)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteSpot(id: string) {
  const supabase = await createServiceClient()
  
  const { error } = await supabase
    .from('spots')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

export async function getCitiesGroupedByRegion() {
  const supabase = await createServiceClient()

  const { data: spots, error } = await supabase
    .from('spots')
    .select('city, region')
    .eq('is_active', true)
    .not('city', 'is', null)
    .not('region', 'is', null)

  if (error) throw error

  // Count spots per city
  const cityCounts: { [key: string]: { region: string; count: number } } = {}
  for (const spot of spots) {
    if (spot.city && spot.region) {
      if (!cityCounts[spot.city]) {
        cityCounts[spot.city] = { region: spot.region, count: 0 }
      }
      cityCounts[spot.city].count++
    }
  }

  // Group cities by region
  const regionGroups: { [key: string]: { name: string; spotCount: number }[] } = {}
  for (const cityName in cityCounts) {
    const cityData = cityCounts[cityName]
    if (!regionGroups[cityData.region]) {
      regionGroups[cityData.region] = []
    }
    regionGroups[cityData.region].push({ name: cityName, spotCount: cityData.count })
  }

  // Sort cities within each region by spot count
  for (const region in regionGroups) {
    regionGroups[region].sort((a, b) => b.spotCount - a.spotCount)
  }

  return regionGroups
}

export async function getCities() {
  const supabase = await createServiceClient()
  
  const { data, error } = await supabase
    .from('spots')
    .select('city')
    .eq('is_active', true)
    .order('city')

  if (error) throw error

  // Remove duplicates and nulls
  const cities = [...new Set(data.map(item => item.city).filter(Boolean))]
  
  return cities
}

export async function getSpotsByCity(city: string) {
  const supabase = await createServiceClient()
  
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .eq('city', city)
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data
}

export async function getSpotsByIds(ids: string[]) {
  if (ids.length === 0) return []
  
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .in('id', ids)
  
  if (error) throw error
  return data
}
