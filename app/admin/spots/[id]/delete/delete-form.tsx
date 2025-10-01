'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface DeleteSpotFormProps {
  spotId: string
  spotName: string
}

export function DeleteSpotForm({ spotId, spotName }: DeleteSpotFormProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/spots/${spotId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete spot')
      }

      toast({
        title: 'Spot supprimé',
        description: `${spotName} a été supprimé avec succès.`,
      })

      router.push('/admin')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le spot.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-4">
      <Button
        variant="destructive"
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? 'Suppression...' : 'Confirmer la suppression'}
      </Button>
      <Button
        variant="outline"
        onClick={() => router.back()}
        disabled={loading}
      >
        Annuler
      </Button>
    </div>
  )
}
