import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'edge'
export const maxDuration = 300 // 5 minutes

/**
 * Cron job to fetch tide data for all spots
 * Should be called daily at midnight
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createServiceClient()
    
    // Get all spots with shom_url
    const { data: spots, error: spotsError } = await supabase
      .from('spots')
      .select('id, name, shom_url')
      .not('shom_url', 'is', null)
      .eq('is_active', true)
    
    if (spotsError || !spots) {
      return NextResponse.json({ error: 'Failed to fetch spots' }, { status: 500 })
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const spot of spots) {
      try {
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
          
          const { error: saveError } = await supabase
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
          
          if (saveError) {
            errorCount++
            errors.push(`${spot.name}: ${saveError.message}`)
          } else {
            successCount++
          }
        } else {
          errorCount++
          errors.push(`${spot.name}: No tides found`)
        }
        
      } catch (error) {
        errorCount++
        errors.push(`${spot.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      totalSpots: spots.length,
      successCount,
      errorCount,
      errors: errors.slice(0, 10) // Return first 10 errors only
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
