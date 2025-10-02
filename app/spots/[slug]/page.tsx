import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSpotBySlug, getActiveSpots } from '@/lib/data/spots'
import { getCurrentConditions } from '@/lib/api/forecast'
import { getTides, getNextTideEvents, getCurrentTideHeight } from '@/lib/api/tides'
import { getUnifiedForecast, getForecastSourceName } from '@/lib/data/forecast'
import { isFavorite } from '@/lib/data/favorites'
import { createClient } from '@/lib/supabase/server'
import { VideoPlayer } from '@/components/video-player'
import { ConditionsBanner } from '@/components/conditions-banner'
import { ForecastTable } from '@/components/forecast-table'
import { FavoriteButton } from '@/components/favorite-button'
import { config } from '@/lib/config'
import { MapPin, Info } from 'lucide-react'

export const revalidate = 900 // 15 minutes

interface SpotPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const spots = await getActiveSpots()
  return spots.map((spot) => ({
    slug: spot.slug,
  }))
}

export async function generateMetadata({ params }: SpotPageProps): Promise<Metadata> {
  const { slug } = await params
  const spot = await getSpotBySlug(slug)

  if (!spot) {
    return {
      title: 'Spot non trouvé',
    }
  }

  const title = `${spot.name} - Webcam & Prévisions`
  const description = `Webcam en direct et prévisions de surf pour ${spot.name} (${spot.city || spot.region}). Consultez les conditions actuelles et les prévisions sur 7 jours.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${config.siteUrl}/spots/${spot.slug}`,
      images: [
        {
          url: `${config.siteUrl}/api/og?spot=${encodeURIComponent(spot.name)}&region=${encodeURIComponent(spot.region)}`,
          width: 1200,
          height: 630,
          alt: `${spot.name} - Webcam & Prévisions`,
        },
      ],
    },
  }
}

export default async function SpotPage({ params }: SpotPageProps) {
  const { slug } = await params
  let spot
  
  try {
    spot = await getSpotBySlug(slug)
  } catch (error) {
    notFound()
  }

  if (!spot) {
    notFound()
  }

  // Fetch forecast and tides data
  const [forecastData, tides] = await Promise.all([
    getUnifiedForecast(spot),
    getTides(spot.latitude, spot.longitude),
  ])

  const current = getCurrentConditions(forecastData)
  const nextTides = getNextTideEvents(tides, 2)
  const currentTideHeight = getCurrentTideHeight(tides)
  
  // Get forecast source for display
  const forecastSource = getForecastSourceName(forecastData.meta.source)

  // Check if user is logged in and if spot is favorited
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userFavorite = user ? await isFavorite(user.id, spot.id) : false

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: spot.name,
    description: `Webcam en direct et prévisions pour ${spot.name}`,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: spot.latitude,
      longitude: spot.longitude,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: spot.city || spot.region,
      addressRegion: spot.region,
      addressCountry: spot.country,
    },
    potentialAction: {
      '@type': 'ViewAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${config.siteUrl}/spots/${spot.slug}`,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform',
        ],
      },
      name: 'Voir le flux en direct',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">{spot.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{spot.city || spot.region}, {spot.country}</span>
            </div>
          </div>
          {user && (
            <FavoriteButton
              spotId={spot.id}
              spotName={spot.name}
              initialIsFavorite={userFavorite}
            />
          )}
        </div>

        {/* Video Player */}
        <VideoPlayer
          src={spot.cam_url}
          type={spot.cam_type}
          spotName={spot.name}
        />

        {/* Spot Info */}
        {(spot.break_type || spot.level || spot.orientation) && (
          <div className="flex flex-wrap gap-2">
            {spot.break_type && (
              <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                {spot.break_type}
              </span>
            )}
            {spot.level && (
              <span className="px-3 py-1 bg-accent text-accent-foreground rounded-md text-sm">
                {spot.level}
              </span>
            )}
            {spot.orientation && (
              <span className="px-3 py-1 bg-muted text-muted-foreground rounded-md text-sm">
                Orient. {spot.orientation}
              </span>
            )}
          </div>
        )}

        {/* Additional Info */}
        {(spot.best_tide || spot.best_wind || spot.hazards) && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <Info className="h-4 w-4" />
              <span>Informations</span>
            </div>
            {spot.best_tide && (
              <p className="text-sm">
                <span className="text-muted-foreground">Meilleure marée:</span> {spot.best_tide}
              </p>
            )}
            {spot.best_wind && (
              <p className="text-sm">
                <span className="text-muted-foreground">Meilleur vent:</span> {spot.best_wind}
              </p>
            )}
            {spot.hazards && (
              <p className="text-sm">
                <span className="text-muted-foreground">Dangers:</span> {spot.hazards}
              </p>
            )}
          </div>
        )}

        {/* Current Conditions */}
        {current && (
          <ConditionsBanner
            current={current}
            tideHeight={currentTideHeight}
            nextTides={nextTides}
          />
        )}

        {/* Forecast Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Prévisions horaires (48h)</h2>
            <span className="text-sm text-muted-foreground">
              Source: {forecastSource}
              {forecastData.meta.fromCache && ' (cache)'}
            </span>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <ForecastTable
              hourly={forecastData.hourly}
              hourlyTides={tides.hourly}
              hoursToShow={48}
            />
          </div>
        </div>

        {/* License Credit */}
        {spot.license_credit && (
          <p className="text-xs text-muted-foreground text-center">
            {spot.license_credit}
          </p>
        )}
      </div>
    </>
  )
}
