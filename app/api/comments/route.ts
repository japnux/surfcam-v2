import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createComment } from '@/lib/data/comments'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { spot_id, content } = body

    if (!spot_id || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (content.length < 3 || content.length > 500) {
      return NextResponse.json({ error: 'Comment must be between 3 and 500 characters' }, { status: 400 })
    }

    await createComment({ spot_id, content }, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
