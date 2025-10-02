'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CloudSun } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface ForecastToggleProps {
  spotId: string
  hasDailyForecast: boolean
  spotName: string
}

export function ForecastToggle({ spotId, hasDailyForecast, spotName }: ForecastToggleProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const toggleForecast = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/spots/${spotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          has_daily_forecast: !hasDailyForecast,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update forecast setting')
      }

      toast({
        title: 'Forecast mis à jour',
        description: `${spotName} ${!hasDailyForecast ? 'a maintenant' : "n'a plus"} le forecast quotidien Stormglass`,
      })
      router.refresh()
    } catch (error) {
      console.error('Error toggling forecast:', error)
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour du forecast',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={hasDailyForecast ? 'secondary' : 'ghost'}
      size="sm"
      onClick={toggleForecast}
      disabled={loading}
      title={hasDailyForecast ? 'Forecast Stormglass activé' : 'Forecast Stormglass désactivé'}
    >
      <CloudSun className={`h-4 w-4 ${hasDailyForecast ? 'text-blue-500' : 'text-muted-foreground'}`} />
    </Button>
  )
}
