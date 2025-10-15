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
  const [tideFilter, setTideFilter] = useState<'all' | 'with-source' | 'no-source'>('all')

  const filteredSpots = spots.filter((spot) => {
    // Filter by status
    if (statusFilter === 'active' && !spot.is_active) return false
    if (statusFilter === 'inactive' && spot.is_active) return false

    // Filter by forecast source
    if (sourceFilter !== 'all') {
      if (spot.forecast_source !== sourceFilter) return false
    }

    // Filter by tide source
    if (tideFilter === 'with-source' && !spot.tide_source) return false
    if (tideFilter === 'no-source' && spot.tide_source) return false

    return true
  })

  return (
    <>
      {/* Filters Section - Responsive */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            {filteredSpots.length} spot{filteredSpots.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Filters Grid - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Statut</label>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="flex-1"
              >
                Tous
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('active')}
                className="flex-1"
              >
                Actifs
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('inactive')}
                className="flex-1"
              >
                Inactifs
              </Button>
            </div>
          </div>

          {/* Forecast Source Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Source prévisions</label>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={sourceFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSourceFilter('all')}
                className="flex-1"
              >
                Toutes
              </Button>
              <Button
                variant={sourceFilter === 'stormglass' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSourceFilter('stormglass')}
                className="flex-1"
              >
                Stormglass
              </Button>
              <Button
                variant={sourceFilter === 'open-meteo' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSourceFilter('open-meteo')}
                className="flex-1"
              >
                Open-Meteo
              </Button>
            </div>
          </div>

          {/* Tide Source Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Source marées</label>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={tideFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTideFilter('all')}
                className="flex-1"
              >
                Toutes
              </Button>
              <Button
                variant={tideFilter === 'with-source' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTideFilter('with-source')}
                className="flex-1"
              >
                Avec source
              </Button>
              <Button
                variant={tideFilter === 'no-source' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTideFilter('no-source')}
                className="flex-1"
              >
                Sans source
              </Button>
            </div>
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
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          ✓ Mareepeche
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(spot.tide_updated_at)}
                        </div>
                      </>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        ✗ Pas de source
                      </Badge>
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
