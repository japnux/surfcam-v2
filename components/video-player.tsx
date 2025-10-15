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

    // Fix iOS fullscreen exit zoom issue
    const handleFullscreenChange = () => {
      // Reset viewport on iOS when exiting fullscreen
      if (document.fullscreenElement === null) {
        // Force viewport reset
        const viewport = document.querySelector('meta[name="viewport"]')
        if (viewport) {
          const content = viewport.getAttribute('content') || ''
          viewport.setAttribute('content', content)
        }
        // Scroll to top to ensure proper positioning
        window.scrollTo(0, 0)
      }
    }

    // iOS-specific fullscreen exit handler
    const handleWebkitEndFullscreen = () => {
      // Reset zoom by forcing viewport recalculation
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        const content = viewport.getAttribute('content') || ''
        // Temporarily change and restore to force recalculation
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0')
        setTimeout(() => {
          viewport.setAttribute('content', content)
        }, 100)
      }
      window.scrollTo(0, 0)
    }

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('error', handleError)
    video.addEventListener('fullscreenchange', handleFullscreenChange)
    video.addEventListener('webkitendfullscreen', handleWebkitEndFullscreen)

    // For HLS streams, load hls.js if needed
    if (type === 'hls' && src.includes('.m3u8')) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src
      } else {
        // Load hls.js for other browsers
        import('hls.js').then(({ default: Hls }) => {
          if (Hls.isSupported()) {
            const hls = new Hls({
              xhrSetup: (xhr) => {
                xhr.withCredentials = false // Allow CORS
              }
            })
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
      video.removeEventListener('fullscreenchange', handleFullscreenChange)
      video.removeEventListener('webkitendfullscreen', handleWebkitEndFullscreen)
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
            crossOrigin="anonymous"
            aria-label={`Webcam en direct de ${spotName}`}
          />
        </>
      )}
    </div>
  )
}
