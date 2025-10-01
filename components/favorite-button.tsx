'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface FavoriteButtonProps {
  spotId: string
  spotName: string
  initialIsFavorite: boolean
}

export function FavoriteButton({ spotId, spotName, initialIsFavorite }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleToggle = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/favorites', {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spotId }),
      })

      if (!response.ok) {
        throw new Error('Failed to update favorite')
      }

      setIsFavorite(!isFavorite)
      toast({
        title: isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris',
        description: `${spotName} a été ${isFavorite ? 'retiré de' : 'ajouté à'} vos favoris.`,
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour les favoris.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={isFavorite ? 'default' : 'outline'}
      size="icon"
      onClick={handleToggle}
      disabled={loading}
      aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
    </Button>
  )
}
