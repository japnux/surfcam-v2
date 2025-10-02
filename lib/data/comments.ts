import { createClient } from '@/lib/supabase/server'
import { SpotComment, CreateCommentData } from '@/lib/types/comments'

export async function getSpotComments(spotId: string, userId?: string): Promise<SpotComment[]> {
  const supabase = await createClient()
  
  const { data: comments, error } = await supabase
    .from('spot_comments')
    .select('*')
    .eq('spot_id', spotId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error loading comments:', error)
    throw error
  }
  
  if (!comments || comments.length === 0) return []

  // Get user IDs and fetch profiles
  const userIds = [...new Set(comments.map(c => c.user_id))]
  
  const [profiles, voteCounts, userVotes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds),
    supabase
      .from('comment_votes')
      .select('comment_id, vote_type')
      .in('comment_id', comments.map(c => c.id)),
    userId ? supabase
      .from('comment_votes')
      .select('comment_id, vote_type')
      .in('comment_id', comments.map(c => c.id))
      .eq('user_id', userId) : Promise.resolve({ data: [] })
  ])
  
  const profileMap = new Map((profiles.data || []).map(p => [p.id, p.display_name]))

  // Calculate scores
  const votesByComment = new Map<string, { upvotes: number; downvotes: number; score: number }>()
  
  if (voteCounts.data) {
    voteCounts.data.forEach(vote => {
      const current = votesByComment.get(vote.comment_id) || { upvotes: 0, downvotes: 0, score: 0 }
      if (vote.vote_type === 1) {
        current.upvotes++
        current.score++
      } else {
        current.downvotes++
        current.score--
      }
      votesByComment.set(vote.comment_id, current)
    })
  }

  const userVoteMap = new Map(userVotes.data?.map(v => [v.comment_id, v.vote_type as 1 | -1]))

  return comments.map(comment => ({
    id: comment.id,
    spot_id: comment.spot_id,
    user_id: comment.user_id,
    content: comment.content,
    is_archived: comment.is_archived,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    display_name: profileMap.get(comment.user_id) || 'Anonyme',
    ...votesByComment.get(comment.id) || { upvotes: 0, downvotes: 0, score: 0 },
    user_vote: userVoteMap.get(comment.id) || null
  })).sort((a, b) => b.score - a.score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function createComment(data: CreateCommentData, userId: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('spot_comments')
    .insert({
      spot_id: data.spot_id,
      user_id: userId,
      content: data.content
    })

  if (error) throw error
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('spot_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function voteComment(commentId: string, userId: string, voteType: 1 | -1): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('comment_votes')
    .upsert({
      comment_id: commentId,
      user_id: userId,
      vote_type: voteType
    }, {
      onConflict: 'comment_id,user_id'
    })

  if (error) throw error
}

export async function removeVote(commentId: string, userId: string): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('comment_votes')
    .delete()
    .eq('comment_id', commentId)
    .eq('user_id', userId)

  if (error) throw error
}
