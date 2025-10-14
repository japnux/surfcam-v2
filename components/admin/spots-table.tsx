'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Eye, TestTube } from 'lucide-react'
import { SpotStatusToggle } from './spot-status-toggle'
import { ForecastToggle } from './forecast-toggle'
import type { SpotWithSources } from '@/lib/data/admin-spots'

interface SpotsTableProps {
  spots: SpotWithSources[]
}

function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return 'Jamais visité'
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  let timeAgo = ''
  if (diffMins < 60) {
    timeAgo = `il y a ${diffMins}min`
  } else if (diffHours < 24) {
    timeAgo = `il y a ${diffHours}h`
  } else {
    timeAgo = `il y a ${diffDays}j`
  }

  return `${date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })} (${timeAgo})`
}

export function SpotsTable({ spots }: SpotsTableProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'stormglass' | 'open-meteo'>('all')

  const filteredSpots = spots.filter((spot) => {
    // Filter by status
    if (statusFilter === 'active' && !spot.is_active) return false
    if (statusFilter === 'inactive' && spot.is_active) return false

    // Filter by forecast source
    if (sourceFilter !== 'all') {
      if (spot.forecast_source !== sourceFilter) return false
    }

    return true
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <span className="text-sm text-muted-foreground">
          {filteredSpots.length} spot{filteredSpots.length > 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Tous
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Actifs
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setStatusFilter('inactive')}
            >
              Inactifs
            </Button>
          </div>

          {/* Forecast Source Filter */}
          <div className="flex items-center gap-2 border rounded-lg p-1">
            <Button
              variant={sourceFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSourceFilter('all')}
            >
              Toutes sources
            </Button>
            <Button
              variant={sourceFilter === 'stormglass' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSourceFilter('stormglass')}
            >
              Stormglass
            </Button>
            <Button
              variant={sourceFilter === 'open-meteo' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSourceFilter('open-meteo')}
            >
              Open-Meteo
            </Button>
          </div>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Nom</TableHead>
              <TableHead>Forecast</TableHead>
              <TableHead>Marées</TableHead>
              <TableHead className="w-[100px]">Statut</TableHead>
              <TableHead className="text-right w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSpots.map((spot) => (
              <TableRow key={spot.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{spot.name}</div>
                    <div className="text-xs text-muted-foreground">{spot.region}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={spot.forecast_source === 'stormglass' ? 'default' : 'secondary'}>
                        {spot.forecast_source === 'stormglass' ? 'Stormglass' : 'Open-Meteo'}
                      </Badge>
                      <ForecastToggle
                        spotId={spot.id}
                        hasDailyForecast={spot.has_daily_forecast || false}
                        spotName={spot.name}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {spot.forecast_source === 'stormglass' 
                        ? formatTimestamp(spot.forecast_cached_at)
                        : 'Temps réel (pas de cache)'
                      }
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {spot.tide_source ? (
                      <>
                        <Badge variant="outline">Mareepeche</Badge>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(spot.tide_updated_at)}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Aucune donnée</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <SpotStatusToggle
                    spotId={spot.id}
                    isActive={spot.is_active}
                    spotName={spot.name}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/spots/${spot.slug}`} target="_blank" title="Voir le spot">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/spots/${spot.id}/test`} title="Tester">
                        <TestTube className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/spots/${spot.id}/edit`} title="Éditer">
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/spots/${spot.id}/delete`} title="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
