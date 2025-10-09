/**
 * Force fetch tide data for Côte des Basques
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function forceFetchTide() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Get spot
  const { data: spot } = await supabase
    .from('spots')
    .select('id, name, shom_url')
    .eq('slug', 'biarritz-la-cote-des-basques')
    .single()
  
  if (!spot || !spot.shom_url) {
    console.error('❌ Spot not found or no shom_url')
    return
  }
  
  console.log(`📍 Spot: ${spot.name}`)
  console.log(`🔗 URL: ${spot.shom_url}`)
  
  // Fetch HTML
  console.log('\n📡 Fetching HTML...')
  const response = await fetch(spot.shom_url)
  const html = await response.text()
  
  console.log(`✅ Fetched ${html.length} characters`)
  
  // Parse with old method (works!)
  console.log('\n🔍 Parsing tide data...')
  const highTides: any[] = []
  const lowTides: any[] = []
  
  // Extract high tides
  const highTidePattern = /marée haute[^\d]+(\d{1,2}h\d{2})[^\d]+suivante[^\d]+(\d{1,2}h\d{2})/i
  const highMatch = highTidePattern.exec(html)
  
  if (highMatch) {
    highTides.push({ time: highMatch[1], height: 'N/A', type: 'high' })
    highTides.push({ time: highMatch[2], height: 'N/A', type: 'high' })
  }
  
  // Extract low tides
  const lowTidePattern = /marée basse[^\d]+(\d{1,2}h\d{2})[^\d]+suivante[^\d]+(\d{1,2}h\d{2})/i
  const lowMatch = lowTidePattern.exec(html)
  
  if (lowMatch) {
    lowTides.push({ time: lowMatch[1], height: 'N/A', type: 'low' })
    lowTides.push({ time: lowMatch[2], height: 'N/A', type: 'low' })
  }
  
  const allTides = [...highTides, ...lowTides].sort((a, b) => {
    const timeA = a.time.replace('h', ':')
    const timeB = b.time.replace('h', ':')
    return timeA.localeCompare(timeB)
  })
  
  console.log(`\n🌊 Found ${allTides.length} tides:`)
  allTides.forEach(tide => {
    const icon = tide.type === 'high' ? '⬆️' : '⬇️'
    console.log(`   ${icon} ${tide.time} (${tide.height})`)
  })
  
  // Extract coefficient - try "aujourd'hui" pattern first
  const coeffTodayPattern = /aujourd'hui[^\d]*coefficient[^\d]*(\d{2,3})/i
  let coeffMatch = coeffTodayPattern.exec(html)
  
  // Fallback to any coefficient
  if (!coeffMatch) {
    const coeffPattern = /coefficient[^\d]*(\d{2,3})/i
    coeffMatch = coeffPattern.exec(html)
  }
  
  const coefficient = coeffMatch ? coeffMatch[1] : 'N/A'
  
  console.log(`\n📊 Coefficient: ${coefficient}`)
  
  // Save to DB
  if (allTides.length > 0) {
    const today = new Date().toISOString().split('T')[0]
    const expiresAt = new Date(today)
    expiresAt.setDate(expiresAt.getDate() + 1)
    expiresAt.setHours(0, 0, 0, 0)
    
    console.log('\n💾 Saving to database...')
    
    const { error } = await supabase
      .from('tides')
      .upsert({
        spot_id: spot.id,
        date: today,
        coefficient,
        tides: allTides,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'spot_id,date'
      })
    
    if (error) {
      console.error('❌ Error saving:', error)
    } else {
      console.log('✅ Saved to database!')
    }
  } else {
    console.log('\n⚠️  No tides found - pattern did not match')
  }
}

forceFetchTide().catch(console.error)
