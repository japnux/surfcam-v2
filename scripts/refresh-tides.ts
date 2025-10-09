/**
 * Script to manually refresh tide data for all spots
 * Usage: npx tsx scripts/refresh-tides.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function refreshTides() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Get all spots with shom_url
  const { data: spots, error } = await supabase
    .from('spots')
    .select('id, name, shom_url')
    .not('shom_url', 'is', null)
    .eq('is_active', true)
  
  if (error) {
    console.error('Error fetching spots:', error)
    return
  }
  
  console.log(`🌊 Refreshing tides for ${spots.length} spots...`)
  
  for (const spot of spots) {
    try {
      console.log(`\n📍 ${spot.name}`)
      console.log(`   URL: ${spot.shom_url}`)
      
      // Fetch HTML
      const response = await fetch(spot.shom_url)
      if (!response.ok) {
        console.error(`   ❌ HTTP ${response.status}`)
        continue
      }
      
      const html = await response.text()
      
      // Check if we got valid HTML
      if (!html.includes('marée')) {
        console.error(`   ❌ Invalid HTML (no tide data found)`)
        continue
      }
      
      console.log(`   ✅ Fetched successfully`)
      
      // The actual parsing and caching will happen when the page is loaded
      // This script just verifies the URLs are working
      
    } catch (error) {
      console.error(`   ❌ Error:`, error)
    }
  }
  
  console.log('\n✅ Done!')
}

refreshTides().catch(console.error)
