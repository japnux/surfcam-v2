import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function deleteBiarritzToday() {
  const today = new Date().toISOString().split('T')[0]
  
  const { error } = await supabase
    .from('tides')
    .delete()
    .eq('spot_id', '2dcb2938-a75f-4e87-badc-dbe250955080')
    .eq('date', today)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('✅ Deleted Biarritz tide data for today')
  }
}

deleteBiarritzToday()
