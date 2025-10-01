'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoPlayerProps {
  src: string
  type: string
  spotName: string
}

export function VideoPlayer({ src, type, spotName }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    setError(null)
    setLoading(true)

    const handleLoadedData = () => {
      setLoading(false)
    }

    const handleError = () => {
      setError('Impossible de charger le flux vidéo. Veuillez réessayer.')
      setLoading(false)
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('error', handleError)

    // For HLS streams, load hls.js if needed
    if (type === 'hls' && src.includes('.m3u8')) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src
      } else {
        // Load hls.js for other browsers
        import('hls.js').then(({ default: Hls }) => {
          if (Hls.isSupported()) {
            const hls = new Hls()
            hls.loadSource(src)
            hls.attachMedia(video)
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(() => {
                // Autoplay might be blocked
              })
            })
            hls.on(Hls.Events.ERROR, (event, data) => {
              if (data.fatal) {
                setError('Erreur lors du chargement du flux HLS.')
                setLoading(false)
              }
            })
          } else {
            setError('Votre navigateur ne supporte pas ce type de vidéo.')
            setLoading(false)
          }
        })
      }
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleError)
    }
  }, [src, type])

  const handleRetry = () => {
    if (videoRef.current) {
      setError(null)
      setLoading(true)
      videoRef.current.load()
    }
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-foreground mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      ) : (
        <>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            loop
            controls
            aria-label={`Webcam en direct de ${spotName}`}
          />
        </>
      )}
    </div>
  )
}
