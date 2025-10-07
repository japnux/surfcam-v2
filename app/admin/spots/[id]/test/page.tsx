import { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/admin'
import { createServiceClient } from '@/lib/supabase/server'
import { getForecast } from '@/lib/api/forecast'
import { getTides } from '@/lib/api/tides'
import { VideoPlayer } from '@/components/video-player'
import { ConditionsBanner } from '@/components/conditions-banner'
import { ForecastTable } from '@/components/forecast-table'
import { getCurrentConditions } from '@/lib/api/forecast'
import { getNextTideEvents, getCurrentTideHeight } from '@/lib/api/tides'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tester le spot - Administration',
  robots: {
    index: false,
    follow: false,
  },
}

interface TestSpotPageProps {
  params: Promise<{ id: string }>
}

export const revalidate = 0 // Always fresh

export default async function TestSpotPage({ params }: TestSpotPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isAdmin())) {
    redirect('/')
  }

  const { id } = await params
  const serviceClient = await createServiceClient()
  
  const { data: spot, error } = await serviceClient
    .from('spots')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !spot) {
    notFound()
  }
  
  // Type assertion for spot data
  const spotData = spot as any

  // Fetch forecast and tides
  let forecast, tides, current, nextTides, currentTideHeight
  let forecastError = null
  
  try {
    forecast = await getForecast(spotData.latitude, spotData.longitude)
    tides = await getTides(spotData.latitude, spotData.longitude)
    current = getCurrentConditions(forecast)
    nextTides = getNextTideEvents(tides, 2)
    currentTideHeight = getCurrentTideHeight(tides)
  } catch (err) {
    forecastError = err instanceof Error ? err.message : 'Failed to fetch forecast'
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-4xl font-bold">Test: {spotData.name}</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-2">
        <h2 className="text-xl font-semibold">Informations du spot</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><strong>Slug:</strong> {spotData.slug}</div>
          <div><strong>Région:</strong> {spotData.region}</div>
          <div><strong>Ville:</strong> {spotData.city || '-'}</div>
          <div><strong>Latitude:</strong> {spotData.latitude}</div>
          <div><strong>Longitude:</strong> {spotData.longitude}</div>
          <div><strong>Type cam:</strong> {spotData.cam_type}</div>
          <div className="col-span-2"><strong>URL:</strong> {spotData.cam_url}</div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Test du flux vidéo</h2>
        <VideoPlayer
          src={spotData.cam_url}
          type={spotData.cam_type}
          spotName={spotData.name}
        />
      </div>

      {forecastError ? (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Erreur de prévisions</h2>
          <p className="text-sm">{forecastError}</p>
        </div>
      ) : (
        <>
          {current && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Conditions actuelles</h2>
              <ConditionsBanner
                current={current}
                tideHeight={currentTideHeight ?? 0}
                nextTides={nextTides}
              />
            </div>
          )}

          {forecast && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Prévisions (24h)</h2>
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <ForecastTable
                  hourly={forecast.hourly}
                  hoursToShow={24}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
