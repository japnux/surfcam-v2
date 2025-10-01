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
    .from('spots')
    .select('*')
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
    .order('name')
  
  if (error) throw error
  return data
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
