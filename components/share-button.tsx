'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface ShareButtonProps {
  spotName: string
  spotUrl: string
}

export function ShareButton({ spotName, spotUrl }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()

  const captureVideoFrame = async (): Promise<Blob | null> => {
    try {
      const video = document.querySelector('video')
      if (!video) {
        toast({
          title: 'Erreur',
          description: 'Impossible de capturer la webcam',
          variant: 'destructive',
        })
        return null
      }

      // Create canvas to capture video frame
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1920
      canvas.height = video.videoHeight || 1080
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Add text overlay
      const fontSize = Math.max(canvas.width / 25, 32) // Responsive font size
      ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      
      // Add text shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      ctx.shadowBlur = 20
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
      
      // Draw text with white fill
      ctx.fillStyle = '#ffffff'
      ctx.fillText('Yo ! On va surfer ou quoi ?', canvas.width / 2, canvas.height - fontSize / 2)
      
      // Convert canvas to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/jpeg', 0.9)
      })
    } catch (error) {
      console.error('Error capturing video frame:', error)
      return null
    }
  }

  const handleShare = async () => {
    setIsSharing(true)

    try {
      console.log('[ShareButton] Starting share...')
      const imageBlob = await captureVideoFrame()
      console.log('[ShareButton] Image captured:', imageBlob ? 'success' : 'failed')
      
      const shareData: ShareData = {
        title: `${spotName} - Surf Webcam`,
        text: `Découvre les conditions actuelles à ${spotName}`,
        url: spotUrl,
      }

      // Add image if available and supported
      if (imageBlob && typeof navigator !== 'undefined' && navigator.canShare) {
        const file = new File([imageBlob], `${spotName.toLowerCase().replace(/\s+/g, '-')}.jpg`, { type: 'image/jpeg' })
        
        // Check if can share with files
        try {
          if (navigator.canShare({ files: [file] })) {
            shareData.files = [file]
            console.log('[ShareButton] Image added to share data')
          }
        } catch (e) {
          console.warn('[ShareButton] canShare with files not supported:', e)
        }
      }

      // Use Web Share API if available
      if (typeof navigator !== 'undefined' && navigator.share) {
        console.log('[ShareButton] Using Web Share API with data:', shareData)
        await navigator.share(shareData)
        toast({
          title: 'Partagé !',
          description: 'Le spot a été partagé avec succès',
        })
      } else {
        console.log('[ShareButton] Using fallback share method')
        // Fallback: download image and copy URL
        if (imageBlob) {
          const url = URL.createObjectURL(imageBlob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${spotName.toLowerCase().replace(/\s+/g, '-')}.jpg`
          a.click()
          URL.revokeObjectURL(url)
        }
        
        // Copy URL to clipboard
        await navigator.clipboard.writeText(spotUrl)
        toast({
          title: 'Image téléchargée',
          description: 'Le lien a été copié dans le presse-papier',
        })
      }
    } catch (error) {
      console.error('[ShareButton] Share error:', error)
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: 'Erreur',
          description: `Impossible de partager le spot: ${(error as Error).message}`,
          variant: 'destructive',
        })
      }
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing}
      variant="outline"
      size="icon"
      aria-label="Partager ce spot"
    >
      <Share2 className="h-4 w-4" />
    </Button>
  )
}
