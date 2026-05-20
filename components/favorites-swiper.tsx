'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Spot } from '@/lib/data/spots'
import { VideoPlayer } from '@/components/video-player-lazy'
import { cn } from '@/lib/utils'

interface FavoritesSwiperProps {
  spots: Spot[]
}

// Seuil de déplacement (px) au-delà duquel un geste est considéré comme un swipe
const SWIPE_THRESHOLD = 50

/**
 * Carrousel de spots favoris : on swipe horizontalement pour zapper
 * d'un spot à l'autre (même principe que le D-pad de l'app Android TV).
 * Flèches et points de pagination fournis pour desktop / accessibilité.
 */
export function FavoritesSwiper({ spots }: FavoritesSwiperProps) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  // Sécurité : si la liste change et que l'index dépasse, on recale
  const safeIndex = Math.min(index, spots.length - 1)
  const spot = spots[safeIndex]

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : i))
  }, [])

  const goNext = useCallback(() => {
    setIndex((i) => (i < spots.length - 1 ? i + 1 : i))
  }, [spots.length])

  // Navigation clavier (flèches gauche/droite) — parité avec le D-pad TV
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goPrev, goNext])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta > SWIPE_THRESHOLD) goPrev()
    else if (delta < -SWIPE_THRESHOLD) goNext()
    touchStartX.current = null
  }

  if (!spot) return null

  return (
    <div className="mx-auto max-w-2xl select-none">
      {/* En-tête : nom du spot + indicateur de position */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium line-clamp-1">{spot.name}</h3>
        <span className="shrink-0 text-sm text-muted-foreground">
          {safeIndex + 1} / {spots.length}
        </span>
      </div>

      {/* Webcam : zone swipable */}
      <div
        className="relative w-full aspect-video bg-black rounded-lg overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* key={spot.id} : remonte proprement le player à chaque changement de spot */}
        <VideoPlayer
          key={spot.id}
          src={spot.cam_url}
          type={spot.cam_type}
          spotName={spot.name}
        />

        {/* Flèche précédent */}
        {safeIndex > 0 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Spot précédent"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Flèche suivant */}
        {safeIndex < spots.length - 1 && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Spot suivant"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Badges + lien vers la fiche détaillée */}
      <div className="flex items-center justify-between gap-2 mt-3">
        <div className="flex items-center gap-2">
          {spot.break_type && (
            <span className="inline-block px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-xs">
              {spot.break_type}
            </span>
          )}
          {spot.level && (
            <span className="inline-block px-2 py-1 bg-accent text-accent-foreground rounded-md text-xs">
              {spot.level}
            </span>
          )}
        </div>
        <Link
          href={`/spots/${spot.slug}`}
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          Voir le détail
        </Link>
      </div>

      {/* Points de pagination */}
      {spots.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-4">
          {spots.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Aller au spot ${i + 1}`}
              aria-current={i === safeIndex}
              className={cn(
                'h-2 rounded-full transition-all',
                i === safeIndex ? 'w-5 bg-primary' : 'w-2 bg-muted hover:bg-muted-foreground/40'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
