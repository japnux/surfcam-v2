'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CloudSun, TrendingUp, AlertTriangle } from 'lucide-react'

interface UsageStats {
  used: number
  limit: number
  remaining: number
  percentage: number
}

export function StormglassUsage() {
  const [stats, setStats] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stormglass?stats=true')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching Stormglass stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudSun className="h-5 w-5" />
            Stormglass API Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const getStatusColor = () => {
    if (stats.percentage >= 80) return 'text-red-500'
    if (stats.percentage >= 60) return 'text-orange-500'
    return 'text-green-500'
  }

  const getStatusIcon = () => {
    if (stats.percentage >= 80) {
      return <AlertTriangle className="h-5 w-5 text-red-500" />
    }
    return <TrendingUp className="h-5 w-5 text-green-500" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudSun className="h-5 w-5" />
          Stormglass API Usage
        </CardTitle>
        <CardDescription>
          Limite quotidienne : {stats.limit} appels/jour
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Utilisé aujourd'hui</span>
              <span className={`font-semibold ${getStatusColor()}`}>
                {stats.used} / {stats.limit}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  stats.percentage >= 80
                    ? 'bg-red-500'
                    : stats.percentage >= 60
                    ? 'bg-orange-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(stats.percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Restants</p>
              <p className="text-2xl font-bold">{stats.remaining}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Pourcentage</p>
              <p className={`text-2xl font-bold ${getStatusColor()}`}>
                {stats.percentage}%
              </p>
            </div>
          </div>

          {/* Warning */}
          {stats.percentage >= 80 && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-red-700 dark:text-red-400">
                  Limite presque atteinte
                </p>
                <p className="text-red-600 dark:text-red-500 mt-1">
                  {stats.remaining === 0 
                    ? "Vous avez atteint la limite quotidienne. Les spots utilisent maintenant Open-Meteo."
                    : `Plus que ${stats.remaining} appels disponibles aujourd'hui.`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>• Chaque spot avec forecast activé = 2 appels (forecast + marées)</p>
            <p>• Limite réinitialisée à minuit UTC</p>
            <p>• Cache valide pendant 24h</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
