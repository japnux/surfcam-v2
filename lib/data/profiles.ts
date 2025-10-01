import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase/types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export async function getProfile(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export async function createProfile(profile: ProfileInsert) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, profile: ProfileUpdate) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function getOrCreateProfile(userId: string, email: string) {
  try {
    return await getProfile(userId)
  } catch (error) {
    // Profile doesn't exist, create it
    return await createProfile({
      id: userId,
      email,
      locale: 'fr',
    })
  }
}
