'use client'

import Link from 'next/link'
import { Spot } from '@/lib/data/spots'
import { VideoPlayer } from '@/components/video-player'

interface FavoriteSpotCardProps {
  spot: Spot
}

export function FavoriteSpotCard({ spot }: FavoriteSpotCardProps) {
  return (
    <Link href={`/spots/${spot.slug}`} className="block">
      <div className="bg-card rounded-lg hover:bg-muted transition-colors py-4 text-center font-medium relative group cursor-pointer">
        {/* Titre du spot */}
        <div className="font-medium mb-3 line-clamp-1">
          {spot.name}
        </div>

        {/* Webcam */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-3">
          <VideoPlayer
            src={spot.cam_url}
            type={spot.cam_type}
            spotName={spot.name}
          />
        </div>

        {/* Informations du spot - seulement les badges */}
        {spot.break_type && (
          <div className="flex items-center justify-center gap-2">
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
    </Link>
  )
}
