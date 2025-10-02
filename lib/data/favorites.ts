import { createClient } from '@/lib/supabase/server'
import type { Spot } from './spots'

export async function getUserFavorites(userId: string, activeOnly: boolean = false): Promise<Spot[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('favorites')
    .select('spot_id, spots(*)')
    .eq('user_id', userId)
  
  if (activeOnly) {
    query = query.eq('spots.is_active', true)
  }
  
  query = query.order('created_at', { ascending: false })
  
  const { data, error } = await query
  
  if (error) throw error
  return data.map((f: any) => f.spots).filter(Boolean) as Spot[]
}

export async function getUserFavoriteIds(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('favorites')
    .select('spot_id')
    .eq('user_id', userId)
  
  if (error) throw error
  return data.map(f => f.spot_id)
}

export async function isFavorite(userId: string, spotId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('favorites')
    .select('spot_id')
    .eq('user_id', userId)
    .eq('spot_id', spotId)
    .single()
  
  return !error && data !== null
}

export async function addFavorite(userId: string, spotId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, spot_id: spotId })
  
  if (error) throw error
}

export async function removeFavorite(userId: string, spotId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('spot_id', spotId)
  
  if (error) throw error
}
