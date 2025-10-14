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

// Parse tide data from HTML
function extractTideDataFromHTML(html: string): { coefficient: string; tides: any[] } | null {
  const allTides: any[] = []
  
  // Pattern matches lines like: "12:17 am ▼ 0,3 m" or "6:24 am ▲ 4,6 m"
  const tidePattern = /(\d{1,2}):(\d{2})\s*(?:am|pm)?\s*([▼▲])\s*(\d+[.,]\d+)\s*m/gi
  let match
  
  while ((match = tidePattern.exec(html)) !== null) {
    const hour = match[1]
    const minute = match[2]
    const symbol = match[3]
    const height = parseFloat(match[4].replace(',', '.'))
    
    // Determine type based on symbol: ▲ = high, ▼ = low
    const type = symbol === '▲' ? 'high' : 'low'
    
    allTides.push({
      time: `${hour}h${minute}`,
      height: `${height} m`,
      type
    })
  }
  
  // Extract coefficient
  const coeffTodayPattern = /aujourd'hui[^\d]*coefficient[^\d]*(\d{2,3})/i
  let coeffMatch = coeffTodayPattern.exec(html)
  
  if (!coeffMatch) {
    const coeffPattern = /coefficient[^\d]*(\d{2,3})/i
    coeffMatch = coeffPattern.exec(html)
  }
  
  const coefficient = coeffMatch ? coeffMatch[1] : 'N/A'
  
  // Sort tides by time
  allTides.sort((a, b) => {
    const timeA = a.time.replace('h', ':')
    const timeB = b.time.replace('h', ':')
    return timeA.localeCompare(timeB)
  })
  
  if (allTides.length === 0) {
    return null
  }
  
  return { coefficient, tides: allTides }
}

async function refreshBiarritzTides() {
  console.log('🔄 Refreshing Biarritz tides...\n')

  // Find Biarritz spot
  const { data: spots } = await supabase
    .from('spots')
    .select('*')
    .eq('slug', 'biarritz-la-grande-plage-vue-du-phare-et-de-la-roche-plate')

  if (!spots || spots.length === 0) {
    console.error('❌ Spot not found')
    return
  }

  const spot = spots[0]
  console.log(`✅ Spot: ${spot.name}`)

  // Delete existing tide data for today
  const today = new Date().toISOString().split('T')[0]
  
  const { error: deleteError } = await supabase
    .from('tides')
    .delete()
    .eq('spot_id', spot.id)
    .eq('date', today)

  if (deleteError) {
    console.error('❌ Error deleting old data:', deleteError)
  } else {
    console.log('🗑️  Deleted old tide data')
  }

  // Fetch fresh data
  console.log('🌊 Fetching fresh tide data from Mareepeche...')
  
  const response = await fetch(spot.shom_url)
  const html = await response.text()

  // Parse HTML directly
  const tideData = extractTideDataFromHTML(html)
  
  if (!tideData) {
    console.error('❌ Failed to parse tide data')
    return
  }

  console.log(`✅ Parsed tide data:`)
  console.log(`   Coefficient: ${tideData.coefficient}`)
  console.log(`   Tides:`)
  tideData.tides.forEach((tide: any, index: number) => {
    const icon = tide.type === 'high' ? '↑' : '↓'
    const label = tide.type === 'high' ? 'HAUTE' : 'BASSE'
    console.log(`      ${index + 1}. ${icon} ${tide.time} - ${label} - ${tide.height}`)
  })

  // Check for consecutive same-type tides
  let hasError = false
  for (let i = 0; i < tideData.tides.length - 1; i++) {
    const current = tideData.tides[i]
    const next = tideData.tides[i + 1]
    
    if (current.type === next.type) {
      console.log(`   ⚠️ WARNING: ${current.time} (${current.type}) followed by ${next.time} (${next.type})`)
      hasError = true
    }
  }

  if (hasError) {
    console.log('\n❌ Tide data has errors, not saving to database')
    return
  }

  // Save to database
  const expiresAt = new Date(today)
  expiresAt.setDate(expiresAt.getDate() + 1)
  expiresAt.setHours(0, 0, 0, 0)

  const { error: insertError } = await supabase
    .from('tides')
    .insert({
      spot_id: spot.id,
      date: today,
      coefficient: tideData.coefficient,
      tides: tideData.tides,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })

  if (insertError) {
    console.error('❌ Error saving to database:', insertError)
    return
  }

  console.log('\n✅ Tide data refreshed successfully!')
}

refreshBiarritzTides()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
