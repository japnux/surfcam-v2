'use client'

import { useEffect, useState } from 'react'
import { SpotPreview } from '@/lib/data/spots'
import { SpotSwiper } from '@/components/spot-swiper'
import { distanceKm } from '@/lib/utils'

interface NearbySpotsSwiperProps {
  spots: SpotPreview[]
}

// Nombre de spots affichés dans le swiper
const NEARBY_COUNT = 10

type GeoStatus = 'locating' | 'located' | 'unavailable'

/**
 * Swiper de la home pour les visiteurs non connectés : géolocalise
 * l'utilisateur et trie les spots du plus proche au plus éloigné.
 * Si la géolocalisation est refusée / indisponible, on retombe sur
 * les premiers spots dans l'ordre par défaut.
 */
export function NearbySpotsSwiper({ spots }: NearbySpotsSwiperProps) {
  const [status, setStatus] = useState<GeoStatus>('locating')
  const [ordered, setOrdered] = useState<SpotPreview[]>([])

  useEffect(() => {
    // Repli si l'API de géolocalisation n'existe pas
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setOrdered(spots.slice(0, NEARBY_COUNT))
      setStatus('unavailable')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const sorted = [...spots]
          .sort(
            (a, b) =>
              distanceKm(latitude, longitude, a.latitude, a.longitude) -
              distanceKm(latitude, longitude, b.latitude, b.longitude)
          )
          .slice(0, NEARBY_COUNT)
        setOrdered(sorted)
        setStatus('located')
      },
      () => {
        // Refus ou timeout : on garde l'ordre par défaut
        setOrdered(spots.slice(0, NEARBY_COUNT))
        setStatus('unavailable')
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    )
  }, [spots])

  if (spots.length === 0) {
    return (
      <>
        <h2 className="text-2xl font-bold">Spots actifs</h2>
        <div className="text-center py-12 text-muted-foreground">
          <p>Aucun spot disponible pour le moment.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <h2 className="text-2xl font-bold">
        {status === 'located' ? 'Spots les plus proches' : 'Spots actifs'}
      </h2>

      {status === 'locating' ? (
        <div className="mx-auto max-w-5xl">
          <div className="w-full aspect-video bg-muted rounded-lg animate-pulse" />
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Localisation en cours…
          </p>
        </div>
      ) : (
        <SpotSwiper spots={ordered} />
      )}
    </>
  )
}
