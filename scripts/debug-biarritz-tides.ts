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

async function debugBiarritzTides() {
  console.log('🔍 Debugging Biarritz tides...\n')

  // Find Biarritz spot
  const { data: spots, error: spotError } = await supabase
    .from('spots')
    .select('*')
    .eq('slug', 'biarritz-la-grande-plage-vue-du-phare-et-de-la-roche-plate')

  if (spotError || !spots || spots.length === 0) {
    console.error('❌ Spot not found:', spotError)
    return
  }

  const spot = spots[0]

  console.log(`✅ Spot found: ${spot.name}`)
  console.log(`   ID: ${spot.id}`)
  console.log(`   SHOM URL: ${spot.shom_url}\n`)

  // Get tide data for today
  const today = new Date().toISOString().split('T')[0]
  
  const { data: tideData, error: tideError } = await supabase
    .from('tides')
    .select('*')
    .eq('spot_id', spot.id)
    .eq('date', today)
    .single()

  if (tideError || !tideData) {
    console.error('❌ No tide data found for today:', tideError)
    return
  }

  console.log(`📅 Tide data for ${tideData.date}:`)
  console.log(`   Coefficient: ${tideData.coefficient}`)
  console.log(`   Expires at: ${tideData.expires_at}`)
  console.log(`   Updated at: ${tideData.updated_at}\n`)

  console.log('🌊 Tides:')
  tideData.tides.forEach((tide: any, index: number) => {
    const icon = tide.type === 'high' ? '↑' : '↓'
    const label = tide.type === 'high' ? 'HAUTE' : 'BASSE'
    console.log(`   ${index + 1}. ${icon} ${tide.time} - ${label} - ${tide.height}`)
  })

  // Check if there are consecutive tides of the same type
  console.log('\n🔍 Checking for consecutive same-type tides:')
  for (let i = 0; i < tideData.tides.length - 1; i++) {
    const current = tideData.tides[i]
    const next = tideData.tides[i + 1]
    
    if (current.type === next.type) {
      console.log(`   ⚠️ PROBLEM: ${current.time} (${current.type}) followed by ${next.time} (${next.type})`)
    }
  }
}

debugBiarritzTides()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
