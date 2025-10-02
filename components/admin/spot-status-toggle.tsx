'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Power } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface SpotStatusToggleProps {
  spotId: string
  isActive: boolean
  spotName: string
}

export function SpotStatusToggle({ spotId, isActive, spotName }: SpotStatusToggleProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const toggleStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/spots/${spotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_active: !isActive,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update spot status')
      }

      toast({
        title: 'Statut mis à jour',
        description: `${spotName} est maintenant ${!isActive ? 'actif' : 'inactif'}`,
      })
      router.refresh()
    } catch (error) {
      console.error('Error toggling spot status:', error)
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour du statut',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      onClick={toggleStatus}
      disabled={loading}
      className="min-w-[100px]"
    >
      <Power className="mr-2 h-4 w-4" />
      {isActive ? 'Actif' : 'Inactif'}
    </Button>
  )
}
