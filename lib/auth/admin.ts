import { createClient } from '@/lib/supabase/server'
import { config } from '@/lib/config'

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false
  
  return config.adminUserIds.includes(user.id)
}

export async function requireAdmin() {
  const admin = await isAdmin()
  
  if (!admin) {
    throw new Error('Unauthorized: Admin access required')
  }
}
