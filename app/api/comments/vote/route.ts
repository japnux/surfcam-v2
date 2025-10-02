import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { voteComment, removeVote } from '@/lib/data/comments'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { comment_id, vote_type } = body

    if (!comment_id) {
      return NextResponse.json({ error: 'Missing comment_id' }, { status: 400 })
    }

    if (vote_type === null || vote_type === undefined) {
      // Remove vote
      await removeVote(comment_id, user.id)
    } else if (vote_type === 1 || vote_type === -1) {
      // Add/update vote
      await voteComment(comment_id, user.id, vote_type)
    } else {
      return NextResponse.json({ error: 'Invalid vote_type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error voting comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
