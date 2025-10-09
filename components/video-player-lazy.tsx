'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const VideoPlayer = dynamic(
  () => import('./video-player').then(mod => ({ default: mod.VideoPlayer })),
  {
    loading: () => (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    ),
    ssr: false // Ne pas charger côté serveur pour éviter le poids initial
  }
)

export { VideoPlayer }
