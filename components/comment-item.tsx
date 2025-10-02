'use client'

import { useState } from 'react'
import { SpotComment } from '@/lib/types/comments'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { ArrowUp, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface CommentItemProps {
  comment: SpotComment
  currentUserId?: string
}

export function CommentItem({ comment, currentUserId }: CommentItemProps) {
  const [voting, setVoting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleVote = async () => {
    setVoting(true)

    try {
      const newVote = comment.user_vote === 1 ? null : 1

      const response = await fetch('/api/comments/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment_id: comment.id,
          vote_type: newVote,
        }),
      })

      if (!response.ok) throw new Error('Failed to vote')

      router.refresh()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de voter',
        variant: 'destructive',
      })
    } finally {
      setVoting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer ce commentaire ?')) return

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast({
        title: 'Commentaire supprimé',
        description: 'Votre commentaire a été supprimé',
      })

      router.refresh()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le commentaire',
        variant: 'destructive',
      })
    }
  }

  const isOwner = currentUserId === comment.user_id

  return (
    <div className="flex gap-3 p-4 bg-card border border-border rounded-lg">
      <div className="flex flex-col items-center gap-1">
        <Button
          onClick={handleVote}
          disabled={voting || !currentUserId}
          variant={comment.user_vote === 1 ? 'default' : 'ghost'}
          size="sm"
          className="h-8 w-8 p-0"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold">{comment.score}</span>
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {comment.display_name || 'Anonyme'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>
          {isOwner && (
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  )
}
