import { createServiceClient } from '@/lib/supabase/server'

interface LogStormglassCallParams {
  spotId: string | null
  endpoint: 'forecast' | 'tides'
  status: 'success' | 'error' | 'quota_exceeded'
  responseSummary?: {
    hoursCount?: number
    dataStart?: string
    dataEnd?: string
    source?: string
    [key: string]: any
  }
  errorMessage?: string
  latitude?: number
  longitude?: number
}

/**
 * Log a Stormglass API call to the database
 */
export async function logStormglassCall(params: LogStormglassCallParams): Promise<void> {
  try {
    const supabase = await createServiceClient()

    const { error } = await supabase
      .from('stormglass_logs')
      .insert({
        spot_id: params.spotId,
        endpoint: params.endpoint,
        status: params.status,
        response_summary: params.responseSummary || null,
        error_message: params.errorMessage || null,
        latitude: params.latitude || null,
        longitude: params.longitude || null,
      })

    if (error) {
      console.error('Failed to log Stormglass call:', error)
    }
  } catch (error) {
    console.error('Error logging Stormglass call:', error)
  }
}

/**
 * Get recent Stormglass logs
 */
export async function getStormglassLogs(limit: number = 100) {
  const supabase = await createServiceClient()

  const { data, error } = await supabase
    .from('stormglass_logs')
    .select(`
      *,
      spots:spot_id (
        id,
        name,
        slug
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching Stormglass logs:', error)
    return []
  }

  return data || []
}

/**
 * Get Stormglass logs statistics
 */
export async function getStormglassLogsStats() {
  const supabase = await createServiceClient()

  // Get today's logs
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todayLogs } = await supabase
    .from('stormglass_logs')
    .select('status')
    .gte('created_at', today.toISOString())

  const stats = {
    today: {
      total: todayLogs?.length || 0,
      success: todayLogs?.filter(l => l.status === 'success').length || 0,
      error: todayLogs?.filter(l => l.status === 'error').length || 0,
      quota_exceeded: todayLogs?.filter(l => l.status === 'quota_exceeded').length || 0,
    }
  }

  return stats
}
