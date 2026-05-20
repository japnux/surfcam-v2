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

// Point de référence par défaut quand la géolocalisation échoue :
// Côte des Basques (Biarritz)
const DEFAULT_LAT = 43.48
const DEFAULT_LON = -1.57

type GeoStatus = 'locating' | 'located' | 'unavailable'

/**
 * Trie les spots du plus proche au plus éloigné d'un point donné
 * et garde les NEARBY_COUNT premiers.
 */
function nearestSpots(
  spots: SpotPreview[],
  lat: number,
  lon: number
): SpotPreview[] {
  return [...spots]
    .sort(
      (a, b) =>
        distanceKm(lat, lon, Number(a.latitude), Number(a.longitude)) -
        distanceKm(lat, lon, Number(b.latitude), Number(b.longitude))
    )
    .slice(0, NEARBY_COUNT)
}

/**
 * Swiper de la home pour les visiteurs non connectés : géolocalise
 * l'utilisateur et trie les spots du plus proche au plus éloigné.
 * Si la géolocalisation est refusée / indisponible, on retombe sur
 * un tri par distance depuis la Côte des Basques (Biarritz).
 */
export function NearbySpotsSwiper({ spots }: NearbySpotsSwiperProps) {
  const [status, setStatus] = useState<GeoStatus>('locating')
  const [ordered, setOrdered] = useState<SpotPreview[]>([])

  useEffect(() => {
    // Repli si l'API de géolocalisation n'existe pas
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setOrdered(nearestSpots(spots, DEFAULT_LAT, DEFAULT_LON))
      setStatus('unavailable')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setOrdered(nearestSpots(spots, latitude, longitude))
        setStatus('located')
      },
      () => {
        // Refus ou timeout : tri par défaut depuis la Côte des Basques
        setOrdered(nearestSpots(spots, DEFAULT_LAT, DEFAULT_LON))
        setStatus('unavailable')
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    )
  }, [spots])

  if (spots.length === 0) {
    return (
      <>
        <h2 className="text-2xl font-bold">Spots les plus proches</h2>
        <div className="text-center py-12 text-muted-foreground">
          <p>Aucun spot disponible pour le moment.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <h2 className="text-2xl font-bold">Spots les plus proches</h2>

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
