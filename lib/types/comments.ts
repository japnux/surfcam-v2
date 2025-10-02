export interface SpotComment {
  id: string
  spot_id: string
  user_id: string
  content: string
  is_archived: boolean
  created_at: string
  updated_at: string
  display_name: string | null
  upvotes: number
  downvotes: number
  score: number
  user_vote?: 1 | -1 | null
}

export interface CreateCommentData {
  spot_id: string
  content: string
}

export interface CommentVote {
  comment_id: string
  user_id: string
  vote_type: 1 | -1
  created_at: string
}
