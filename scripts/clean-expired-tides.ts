/**
 * Script to clean expired tide data from database
 * This will force fresh fetches on next page load
 * Usage: npx tsx scripts/clean-expired-tides.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function cleanExpiredTides() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('🧹 Cleaning expired tide data...')
  
  // Delete all expired tides
  const { data, error } = await supabase
    .from('tides')
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id, spot_id, date, expires_at')
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log(`✅ Deleted ${data?.length || 0} expired tide records`)
  
  if (data && data.length > 0) {
    console.log('\nDeleted records:')
    data.forEach((record: any) => {
      console.log(`  - Spot: ${record.spot_id}, Date: ${record.date}, Expired: ${record.expires_at}`)
    })
  }
  
  console.log('\n💡 Next page load will fetch fresh tide data')
}

cleanExpiredTides().catch(console.error)
