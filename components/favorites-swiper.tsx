'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Maximize, X } from 'lucide-react'
import { Spot } from '@/lib/data/spots'
import { VideoPlayer } from '@/components/video-player-lazy'
import { cn } from '@/lib/utils'

interface FavoritesSwiperProps {
  spots: Spot[]
}

// Seuil de déplacement (px) au-delà duquel un geste est considéré comme un swipe
const SWIPE_THRESHOLD = 50

// Nombre de spots préchargés de chaque côté du spot courant.
// 1 => le précédent et le suivant sont déjà chargés (3 flux simultanés max).
const PRELOAD_RADIUS = 1

/**
 * Carrousel de spots favoris : on swipe horizontalement pour zapper
 * d'un spot à l'autre (même principe que le D-pad de l'app Android TV).
 *
 * Préchargement : les players des spots adjacents (±1) restent montés
 * mais masqués, leur flux HLS est donc déjà chaud au moment du swipe.
 * Les clés stables (key={spot.id}) font que les players communs sont
 * conservés quand la fenêtre glisse — pas de rechargement.
 *
 * Mode immersif : un bouton plein écran bascule la caméra en overlay
 * plein écran. Sur Android/desktop on demande le vrai plein écran +
 * verrouillage paysage ; sur iOS (qui ne supporte pas ces API sur un
 * élément non-vidéo) on retombe sur un overlay CSS plein écran, et
 * l'utilisateur tourne son téléphone (le layout s'adapte).
 */
export function FavoritesSwiper({ spots }: FavoritesSwiperProps) {
  const [index, setIndex] = useState(0)
  const [immersive, setImmersive] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sécurité : si la liste change et que l'index dépasse, on recale
  const safeIndex = Math.min(index, spots.length - 1)
  const spot = spots[safeIndex]

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : i))
  }, [])

  const goNext = useCallback(() => {
    setIndex((i) => (i < spots.length - 1 ? i + 1 : i))
  }, [spots.length])

  const enterImmersive = useCallback(async () => {
    setImmersive(true)
    const el = containerRef.current
    // Vrai plein écran (Android/desktop) — non supporté par iOS Safari sur un <div>
    try {
      if (el?.requestFullscreen) await el.requestFullscreen()
    } catch {
      /* ignoré : on garde l'overlay CSS comme repli */
    }
    // Verrouillage paysage (Android) — silencieusement ignoré sur iOS
    try {
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>
      }
      await orientation?.lock?.('landscape')
    } catch {
      /* ignoré */
    }
  }, [])

  const exitImmersive = useCallback(() => {
    try {
      ;(screen.orientation as ScreenOrientation & { unlock?: () => void })?.unlock?.()
    } catch {
      /* ignoré */
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }
    setImmersive(false)
  }, [])

  // Navigation clavier (flèches gauche/droite) + Échap pour quitter l'immersif
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'Escape' && immersive) exitImmersive()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [goPrev, goNext, immersive, exitImmersive])

  // Si l'utilisateur quitte le plein écran natif (bouton retour Android…), on resynchronise
  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement) setImmersive(false)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  // Bloque le scroll de la page derrière l'overlay immersif
  useEffect(() => {
    if (!immersive) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [immersive])

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

  // Fenêtre de spots montés simultanément (courant ± PRELOAD_RADIUS)
  const windowStart = Math.max(0, safeIndex - PRELOAD_RADIUS)
  const windowEnd = Math.min(spots.length - 1, safeIndex + PRELOAD_RADIUS)

  // Pile de players : tous montés, seul le courant est visible.
  // Les autres chargent leur flux en fond => swipe quasi instantané.
  const videoStack = (
    <>
      {spots.slice(windowStart, windowEnd + 1).map((s, offset) => {
        const i = windowStart + offset
        const isCurrent = i === safeIndex
        return (
          <div
            key={s.id}
            aria-hidden={!isCurrent}
            className={cn(
              'absolute inset-0 transition-opacity duration-200',
              isCurrent ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            <VideoPlayer src={s.cam_url} type={s.cam_type} spotName={s.name} />
          </div>
        )
      })}
    </>
  )

  // Flèches de navigation, superposées à la vidéo (desktop / accessibilité)
  const navArrows = (
    <>
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
    </>
  )

  // Points de pagination
  const dots = spots.length > 1 && (
    <div className="flex justify-center items-center gap-1.5">
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
  )

  // ----- Mode immersif : overlay plein écran -----
  if (immersive) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-[100] flex flex-col bg-black select-none"
      >
        {/* Barre du haut : nom + position + fermeture */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
          <h3 className="font-medium line-clamp-1">{spot.name}</h3>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-white/70">
              {safeIndex + 1} / {spots.length}
            </span>
            <button
              type="button"
              onClick={exitImmersive}
              aria-label="Quitter le plein écran"
              className="rounded-full bg-white/10 p-1.5 transition-colors hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Vidéo : occupe l'espace, swipable */}
        <div
          className="flex flex-1 items-center justify-center overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* max-w borné à 177vh => la vidéo 16:9 ne dépasse jamais la hauteur écran */}
          <div className="relative w-full max-w-[177vh] aspect-video">
            {videoStack}
            {navArrows}
          </div>
        </div>

        {/* Points de pagination */}
        <div className="py-3">{dots}</div>
      </div>
    )
  }

  // ----- Mode normal -----
  return (
    <div ref={containerRef} className="mx-auto max-w-5xl select-none">
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
        {videoStack}
        {navArrows}

        {/* Bouton plein écran immersif */}
        <button
          type="button"
          onClick={enterImmersive}
          aria-label="Plein écran"
          className="absolute bottom-2 right-2 z-10 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
        >
          <Maximize className="h-5 w-5" />
        </button>
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
      {dots && <div className="mt-4">{dots}</div>}
    </div>
  )
}
