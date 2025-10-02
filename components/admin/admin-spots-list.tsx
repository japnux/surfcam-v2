'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Trash2, Eye, TestTube } from 'lucide-react'
import { SpotStatusToggle } from './spot-status-toggle'
import { ForecastToggle } from './forecast-toggle'
import type { Spot } from '@/lib/data/spots'

interface AdminSpotsListProps {
  spots: Spot[]
}

export function AdminSpotsList({ spots }: AdminSpotsListProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const filteredSpots = spots.filter((spot) => {
    if (statusFilter === 'active') return spot.is_active
    if (statusFilter === 'inactive') return !spot.is_active
    return true
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <span className="text-sm text-muted-foreground">
          {filteredSpots.length} spot{filteredSpots.length > 1 ? 's' : ''}
        </span>
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
      </div>

      <div className="grid gap-4">
        {filteredSpots.map((spot) => (
          <Card key={spot.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span>{spot.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <SpotStatusToggle
                    spotId={spot.id}
                    isActive={spot.is_active}
                    spotName={spot.name}
                  />
                  <ForecastToggle
                    spotId={spot.id}
                    hasDailyForecast={spot.has_daily_forecast || false}
                    spotName={spot.name}
                  />
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/spots/${spot.slug}`} target="_blank">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/spots/${spot.id}/test`}>
                      <TestTube className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/spots/${spot.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/spots/${spot.id}/delete`}>
                      <Trash2 className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Région:</span> {spot.region}
                </div>
                <div>
                  <span className="text-muted-foreground">Ville:</span> {spot.city || '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span> {spot.cam_type}
                </div>
                <div>
                  <span className="text-muted-foreground">Slug:</span> {spot.slug}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
