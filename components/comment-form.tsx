'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface CommentFormProps {
  spotId: string
  hasDisplayName: boolean
  onSuccess?: () => void
}

export function CommentForm({ spotId, hasDisplayName, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  if (!hasDisplayName) {
    return (
      <div className="bg-muted p-4 rounded-lg text-center space-y-3">
        <p className="text-sm">
          Pour commenter, tu dois d&apos;abord définir un pseudo dans ton profil
        </p>
        <Button asChild variant="default" size="sm">
          <Link href="/profile">Définir mon pseudo</Link>
        </Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (content.length < 3) {
      toast({
        title: 'Erreur',
        description: 'Le commentaire doit faire au moins 3 caractères',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spot_id: spotId, content }),
      })

      if (!response.ok) throw new Error('Failed to post comment')

      setContent('')
      toast({
        title: 'Commentaire ajouté',
        description: 'Votre commentaire a été publié avec succès',
      })
      
      router.refresh()
      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de publier le commentaire',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Ajoute un commentaire sur les conditions (ex: Méduses en ce moment, on y va pas...)"
        maxLength={500}
        rows={3}
        disabled={loading}
      />
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {content.length}/500 caractères
        </span>
        <Button type="submit" disabled={loading || content.length < 3}>
          {loading ? 'Publication...' : 'Publier'}
        </Button>
      </div>
    </form>
  )
}
