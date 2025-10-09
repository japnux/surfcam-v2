/**
 * Script to delete ALL tide data from database
 * This will force fresh fetches with the new API
 * Usage: npx tsx scripts/delete-all-tides.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function deleteAllTides() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('🧹 Deleting ALL tide data...')
  
  // Delete all tides
  const { data, error } = await supabase
    .from('tides')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    .select('id, spot_id, date')
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log(`✅ Deleted ${data?.length || 0} tide records`)
  console.log('\n💡 Next page load will fetch fresh tide data using the new API')
}

deleteAllTides().catch(console.error)
