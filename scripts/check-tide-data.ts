/**
 * Script to check tide data for a specific spot
 * Usage: npx tsx scripts/check-tide-data.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function checkTideData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Get Côte des Basques spot
  const { data: spot } = await supabase
    .from('spots')
    .select('id, name, slug')
    .eq('slug', 'biarritz-la-cote-des-basques')
    .single()
  
  if (!spot) {
    console.error('❌ Spot not found')
    return
  }
  
  console.log(`📍 Spot: ${spot.name}`)
  console.log(`   ID: ${spot.id}`)
  console.log(`   Slug: ${spot.slug}`)
  
  // Get tide data for today
  const today = new Date().toISOString().split('T')[0]
  
  const { data: tides, error } = await supabase
    .from('tides')
    .select('*')
    .eq('spot_id', spot.id)
    .eq('date', today)
    .single()
  
  if (error || !tides) {
    console.log('\n❌ No tide data found for today')
    console.log('   This will trigger a fresh fetch on next page load')
    return
  }
  
  console.log(`\n🌊 Tide data for ${today}:`)
  console.log(`   Coefficient: ${tides.coefficient}`)
  console.log(`   Expires: ${tides.expires_at}`)
  console.log(`   Updated: ${tides.updated_at}`)
  console.log(`\n   Tides:`)
  
  if (Array.isArray(tides.tides)) {
    tides.tides.forEach((tide: any) => {
      const icon = tide.type === 'high' ? '⬆️' : '⬇️'
      console.log(`   ${icon} ${tide.time} (${tide.type})`)
    })
  }
  
  // Check if expired
  const isExpired = new Date(tides.expires_at) < new Date()
  if (isExpired) {
    console.log('\n⚠️  Data is EXPIRED - will be refreshed on next page load')
  } else {
    console.log('\n✅ Data is valid')
  }
}

checkTideData().catch(console.error)
