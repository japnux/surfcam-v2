'use client'

import Link from 'next/link'
import { Spot } from '@/lib/data/spots'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VideoPlayer } from '@/components/video-player'
import { Activity } from 'lucide-react'

interface FavoriteSpotCardProps {
  spot: Spot
}

export function FavoriteSpotCard({ spot }: FavoriteSpotCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-start justify-between gap-2">
          <Link href={`/spots/${spot.slug}`} className="line-clamp-1 hover:underline">
            {spot.name}
          </Link>
          <Activity className="h-5 w-5 text-primary flex-shrink-0 animate-pulse" />
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* Webcam */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <VideoPlayer
            src={spot.cam_url}
            type={spot.cam_type}
            spotName={spot.name}
          />
        </div>

        {/* Informations du spot */}
        <div className="space-y-2 text-sm">
          {spot.break_type && (
            <div className="flex items-center gap-2">
              <span className="inline-block px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
                {spot.break_type}
              </span>
              {spot.level && (
                <span className="inline-block px-2 py-1 bg-accent text-accent-foreground rounded-md text-xs">
                  {spot.level}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
