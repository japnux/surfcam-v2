import Link from 'next/link'
import { Spot } from '@/lib/data/spots'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'

interface SpotCardProps {
  spot: Spot
  showFavorite?: boolean
}

export function SpotCard({ spot }: SpotCardProps) {
  return (
    <Link href={`/spots/${spot.slug}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <CardTitle className="flex items-start justify-between gap-2">
            <span className="line-clamp-2">{spot.name}</span>
            <Activity className="h-5 w-5 text-primary flex-shrink-0 animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent>
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
    </Link>
  )
}
