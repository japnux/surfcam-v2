import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { createSpot } from '@/lib/data/spots'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !(await isAdmin())) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const spotData = await request.json()

    // Validate required fields
    const required = ['name', 'slug', 'country', 'region', 'latitude', 'longitude', 'cam_url', 'cam_type']
    for (const field of required) {
      if (!spotData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    const spot = await createSpot(spotData)

    return NextResponse.json(spot)
  } catch (error: any) {
    console.error('Create spot error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
