import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSpotBySlug, getActiveSpots } from '@/lib/data/spots'
import { getCurrentConditions } from '@/lib/api/forecast'
import { TideData, TideEvent, HourlyTide, getNextTideEvents, getCurrentTideHeight } from '@/lib/api/tides'
import { getTidesForSpotMultipleDays } from '@/lib/data/tides'
import { ForecastData, getForecast, getForecastSourceName } from '@/lib/data/forecast'
import { isFavorite } from '@/lib/data/favorites'
import { createClient } from '@/lib/supabase/server'
import { VideoPlayer } from '@/components/video-player-lazy'
import dynamic from 'next/dynamic'

// Lazy load heavy components for better FCP
const ConditionsBanner = dynamic(() => import('@/components/conditions-banner').then(mod => ({ default: mod.ConditionsBanner })), {
  loading: () => <div className="h-32 bg-muted animate-pulse rounded-lg" />,
  ssr: true
})

const TideInfo = dynamic(() => import('@/components/tide-info').then(mod => ({ default: mod.TideInfo })), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg" />,
  ssr: true
})

const ForecastTable = dynamic(() => import('@/components/forecast-table').then(mod => ({ default: mod.ForecastTable })), {
  loading: () => (
    <div className="bg-card border border-border rounded-lg overflow-hidden p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-full"></div>
        <div className="h-8 bg-muted rounded w-full"></div>
        <div className="h-8 bg-muted rounded w-full"></div>
        <div className="h-8 bg-muted rounded w-full"></div>
      </div>
    </div>
  ),
  ssr: false // Don't render on server for faster initial load
})
import { FavoriteButton } from '@/components/favorite-button'
import { ShareButton } from '@/components/share-button'
import { config } from '@/lib/config'
import { Info } from 'lucide-react'

export const revalidate = 1800 // 30 minutes - optimisation performance

// Helper function to generate hourly tide data from tide events
function generateHourlyTideData(events: TideEvent[]): HourlyTide[] {
  if (events.length < 2) return []
  
  const hourly: HourlyTide[] = []
  const now = new Date()
  
  // Sort events by time
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.time).getTime() - new Date(b.time).getTime()
  )
  
  // Generate hourly data for the next 7 days
  for (let hour = 0; hour < 168; hour++) {
    const date = new Date(now)
    date.setHours(date.getHours() + hour)
    const currentTime = date.getTime()
    
    // Find surrounding tide events
    let prevEvent = sortedEvents[0]
    let nextEvent = sortedEvents[1]
    
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const eventTime = new Date(sortedEvents[i].time).getTime()
      const nextEventTime = new Date(sortedEvents[i + 1].time).getTime()
      
      if (currentTime >= eventTime && currentTime <= nextEventTime) {
        prevEvent = sortedEvents[i]
        nextEvent = sortedEvents[i + 1]
        break
      }
    }
    
    // Linear interpolation between tide events
    const prevTime = new Date(prevEvent.time).getTime()
    const nextTime = new Date(nextEvent.time).getTime()
    const timeDiff = nextTime - prevTime
    const timeProgress = (currentTime - prevTime) / timeDiff
    
    const height = prevEvent.height + (nextEvent.height - prevEvent.height) * timeProgress
    
    hourly.push({
      time: date.toISOString(),
      height: Math.max(0, height),
    })
  }
  
  return hourly
}

interface SpotPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  // Optimisation: utiliser getAllSpotsForSitemap qui est plus léger
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

  // Fetch forecast and tides data with error handling
  let forecastData
  let tides: TideData = { events: [], hourly: [] }
  let forecastError: string | null = null
  let forecastSource = 'Non disponible'

  let mareepecheCoefficient: number | null = null
  
  try {
    // Optimisation: paralléliser les requêtes avec Promise.allSettled pour continuer même si une échoue
    const [forecastResult, mareepecheTidesResult, mareepecheDataResult] = await Promise.allSettled([
      getForecast(spot),
      getTidesForSpotMultipleDays(spot.id, 3), // Get 3 days of mareespeche data
      import('@/lib/data/tides').then(m => m.getTidesForSpot(spot.id)) // Get today's data with coefficient
    ])
    
    if (forecastResult.status === 'fulfilled') {
      forecastData = forecastResult.value
      forecastSource = getForecastSourceName(forecastData.meta.source)
    } else {
      console.error(`Forecast error for ${spot.name}:`, forecastResult.reason)
      forecastError = 'Erreur de chargement des prévisions'
      forecastData = { hourly: [], daily: [], tides: [], meta: { source: 'open-meteo' } } as ForecastData
    }
    
    // Extract coefficient from mareespeche data
    if (mareepecheDataResult.status === 'fulfilled' && mareepecheDataResult.value?.coefficient) {
      mareepecheCoefficient = parseInt(mareepecheDataResult.value.coefficient)
      console.log(`✅ Using mareespeche.com coefficient for ${spot.name}: ${mareepecheCoefficient}`)
    }
    
    // Use mareespeche data directly (no Stormglass call)
    if (mareepecheTidesResult.status === 'fulfilled' && mareepecheTidesResult.value.length > 0) {
      const mareepecheTides = mareepecheTidesResult.value
      const now = new Date()
      
      // Convert mareespeche format to TideEvent format
      const allMareepecheEvents: TideEvent[] = mareepecheTides.map((t: any, index) => {
        const [hours, minutes] = t.time.split('h').map(Number)
        const date = new Date()
        
        // Distribute tides across days based on their order (assuming ~4 tides per day)
        const dayOffset = Math.floor(index / 4)
        date.setDate(date.getDate() + dayOffset)
        date.setHours(hours, minutes, 0, 0)
        
        return {
          time: date.toISOString(),
          height: t.type === 'high' ? 4.8 : 1.2, // Estimated heights
          type: t.type
        }
      })
      
      // Filter future tides for events
      const futureEvents = allMareepecheEvents.filter(t => new Date(t.time).getTime() > now.getTime())
      
      // Generate hourly data from all events (for tide height interpolation)
      const hourly = generateHourlyTideData(allMareepecheEvents)
      
      tides = {
        events: futureEvents,
        hourly: hourly
      }
      
      console.log(`✅ Using mareespeche.com data for ${spot.name}: ${futureEvents.length} tide events, ${hourly.length} hourly points`)
    } else {
      console.warn(`⚠️  No mareespeche data for ${spot.name}, tide data will be empty`)
      tides = { events: [], hourly: [] }
    }
  } catch (error) {
    console.error(`Unexpected error for ${spot.name}:`, error)
    forecastError = 'Erreur inattendue'
    forecastData = { hourly: [], daily: [], tides: [], meta: { source: 'open-meteo' } } as ForecastData
    tides = { events: [], hourly: [] }
  }

  const current = forecastData.hourly.length > 0 ? getCurrentConditions(forecastData) : null
  const nextTides = getNextTideEvents(tides, 2)
  const currentTideHeight = getCurrentTideHeight(tides)
  
  // Calculate tide coefficient from amplitude (French system: 20-120)
  // Use mareespeche coefficient if available, otherwise calculate from amplitude
  const tideCoefficient = mareepecheCoefficient || (() => {
    const nextHigh = nextTides.find(t => t.type === 'high')
    const nextLow = nextTides.find(t => t.type === 'low')
    
    if (!nextHigh || !nextLow) return null
    
    const amplitude = nextHigh.height - nextLow.height
    const coef = Math.round(amplitude / 0.051)
    
    // Clamp between 20 and 120 (theoretical range)
    return Math.max(20, Math.min(120, coef))
  })()

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

        {/* Share Button */}
        <ShareButton
          spotName={spot.name}
          spotSlug={spot.slug}
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

        {/* Tide Info */}
        <TideInfo 
          spotId={spot.id}
          tides={tides} 
          sunData={forecastData.daily[0]} 
          tideCoefficient={tideCoefficient} 
        />

        {/* Forecast Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Prévisions horaires (48h)</h2>
            <span className="text-sm text-muted-foreground">
              Source: {forecastSource}
              {forecastData.meta?.fromCache && forecastData.meta?.cached_at && (
                <span className="ml-1">
                  (cache - {new Date(forecastData.meta.cached_at).toLocaleString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })})
                </span>
              )}
              {forecastData.meta?.fromCache && !forecastData.meta?.cached_at && ' (cache)'}
              {forecastError && <span className="text-destructive ml-2">⚠️ {forecastError}</span>}
            </span>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <ForecastTable
              hourly={forecastData.hourly}
              tideHourly={tides.hourly}
              tideEvents={tides.events}
              daily={forecastData.daily}
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
