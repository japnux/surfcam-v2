import { SpotComment } from '@/lib/types/comments'
import { getSpotComments } from '@/lib/data/comments'
import { createClient } from '@/lib/supabase/server'
import { CommentForm } from './comment-form'
import { CommentItem } from './comment-item'
import { MessageSquare } from 'lucide-react'

interface CommentSectionProps {
  spotId: string
}

export async function CommentSection({ spotId }: CommentSectionProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let comments: SpotComment[] = []
  let error = null
  let userProfile = null

  // Get user profile first (independent of comments)
  if (user) {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('Profile error:', profileError)
      } else {
        console.log('User profile loaded:', data)
        userProfile = data
      }
    } catch (e) {
      console.error('Error loading user profile:', e)
    }
  }

  // Then get comments
  try {
    comments = await getSpotComments(spotId, user?.id)
  } catch (e) {
    error = 'Impossible de charger les commentaires'
    console.error('Error loading comments:', e)
  }

  return (
    <div id="commentaires" className="space-y-6 scroll-mt-8">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h2 className="text-2xl font-bold">
          Commentaires de la communauté ({comments.length})
        </h2>
      </div>

      <p className="text-sm text-muted-foreground">
        Partage les conditions actuelles avec les autres surfeurs. Les commentaires sont
        archivés automatiquement après 48h.
      </p>

      <div className="space-y-3">
        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}
        
        {comments.length === 0 && !error && (
          <div className="text-center py-8 text-muted-foreground">
            Pas encore de commentaire sur ce spot !
          </div>
        )}

        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUserId={user?.id}
          />
        ))}
      </div>

      {user ? (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Ajouter un commentaire</h3>
          <CommentForm 
            spotId={spotId} 
            hasDisplayName={!!userProfile?.display_name && userProfile.display_name.trim().length > 0}
          />
        </div>
      ) : (
        <div className="bg-muted border border-border rounded-lg p-4 text-center text-sm text-muted-foreground">
          Connecte-toi pour laisser un commentaire
        </div>
      )}
    </div>
  )
}
