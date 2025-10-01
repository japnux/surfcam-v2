import { createClient } from '@/lib/supabase/server'

export async function getUserFavorites(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('favorites')
    .select('spot_id, spots(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data.map(f => f.spots).filter(Boolean)
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
