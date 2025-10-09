/**
 * Fetch and save tide data for all spots with shom_url
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'

async function fetchAllTides() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Get all spots with shom_url
  const { data: spots } = await supabase
    .from('spots')
    .select('id, name, slug, shom_url')
    .not('shom_url', 'is', null)
    .eq('is_active', true)
    // .limit(10) // Fetch all spots
  
  if (!spots || spots.length === 0) {
    console.error('❌ No spots found')
    return
  }
  
  console.log(`🌊 Fetching tide data for ${spots.length} spots...\n`)
  
  let successCount = 0
  let errorCount = 0
  
  for (const spot of spots) {
    try {
      console.log(`📍 ${spot.name}`)
      console.log(`   URL: ${spot.shom_url}`)
      
      // Fetch HTML
      const response = await fetch(spot.shom_url)
      const html = await response.text()
      
      // Parse tides
      const highTides: any[] = []
      const lowTides: any[] = []
      
      const highTidePattern = /marée haute[^\d]+(\d{1,2}h\d{2})[^\d]+suivante[^\d]+(\d{1,2}h\d{2})/i
      const highMatch = highTidePattern.exec(html)
      
      if (highMatch) {
        highTides.push({ time: highMatch[1], height: 'N/A', type: 'high' })
        highTides.push({ time: highMatch[2], height: 'N/A', type: 'high' })
      }
      
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
      
      // Extract coefficient
      const coeffTodayPattern = /aujourd'hui[^\d]*coefficient[^\d]*(\d{2,3})/i
      let coeffMatch = coeffTodayPattern.exec(html)
      
      if (!coeffMatch) {
        const coeffPattern = /coefficient[^\d]*(\d{2,3})/i
        coeffMatch = coeffPattern.exec(html)
      }
      
      const coefficient = coeffMatch ? coeffMatch[1] : 'N/A'
      
      if (allTides.length > 0) {
        const today = new Date().toISOString().split('T')[0]
        const expiresAt = new Date(today)
        expiresAt.setDate(expiresAt.getDate() + 1)
        expiresAt.setHours(0, 0, 0, 0)
        
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
          console.log(`   ❌ Error: ${error.message}`)
          errorCount++
        } else {
          console.log(`   ✅ Saved: ${allTides.length} tides, coeff ${coefficient}`)
          successCount++
        }
      } else {
        console.log(`   ⚠️  No tides found`)
        errorCount++
      }
      
      console.log('')
      
    } catch (error) {
      console.error(`   ❌ Error:`, error)
      errorCount++
      console.log('')
    }
  }
  
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Success: ${successCount}`)
  console.log(`   ❌ Errors: ${errorCount}`)
}

fetchAllTides().catch(console.error)
