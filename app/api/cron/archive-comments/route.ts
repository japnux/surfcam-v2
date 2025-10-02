import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Call the archive function
    const { error } = await supabase.rpc('archive_old_comments')

    if (error) {
      console.error('Error archiving comments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get count of archived comments for logging
    const { count } = await supabase
      .from('spot_comments')
      .select('*', { count: 'exact', head: true })
      .eq('is_archived', true)

    return NextResponse.json({
      success: true,
      message: 'Comments archived successfully',
      archived_count: count,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
