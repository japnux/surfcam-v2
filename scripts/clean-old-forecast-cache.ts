import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function cleanOldCache() {
  console.log('🧹 Cleaning old forecast cache...\n')

  // Delete cache older than 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: oldCache, error: selectError } = await supabase
    .from('spot_forecast_cache')
    .select('spot_id, fetched_at')
    .lt('fetched_at', sevenDaysAgo.toISOString())

  if (selectError) {
    console.error('❌ Error fetching old cache:', selectError)
    return
  }

  if (!oldCache || oldCache.length === 0) {
    console.log('✅ No old cache to clean')
    return
  }

  console.log(`Found ${oldCache.length} old cache entries:`)
  oldCache.forEach(cache => {
    console.log(`  - Spot ${cache.spot_id}: ${new Date(cache.fetched_at).toLocaleString('fr-FR')}`)
  })

  const { error: deleteError } = await supabase
    .from('spot_forecast_cache')
    .delete()
    .lt('fetched_at', sevenDaysAgo.toISOString())

  if (deleteError) {
    console.error('❌ Error deleting old cache:', deleteError)
    return
  }

  console.log(`\n✅ Deleted ${oldCache.length} old cache entries`)
}

cleanOldCache()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
