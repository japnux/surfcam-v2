'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface ShareButtonProps {
  spotName: string
  spotSlug: string
}

export function ShareButton({ spotName, spotSlug }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()
  
  // Get current URL dynamically (works in production without env var)
  const spotUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/spots/${spotSlug}`
    : `https://surfcam-v2.vercel.app/spots/${spotSlug}`

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
      // Try to capture image, but don't fail if CORS blocks it
      let imageBlob: Blob | null = null
      try {
        imageBlob = await captureVideoFrame()
        console.log('[ShareButton] Image captured successfully')
      } catch (captureError) {
        console.warn('[ShareButton] Image capture failed (likely CORS):', captureError)
        // Continue without image
      }
      
      const shareData: ShareData = {
        title: `${spotName} - Surf Webcam`,
        text: `Yo ! On va surfer ou quoi ? Découvre les conditions actuelles à ${spotName}`,
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
        await navigator.share(shareData)
        toast({
          title: 'Partagé !',
          description: imageBlob 
            ? 'Le spot a été partagé avec succès' 
            : 'Le spot a été partagé (sans image)',
        })
      } else {
        // Fallback: download image and copy URL
        if (imageBlob) {
          const url = URL.createObjectURL(imageBlob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${spotName.toLowerCase().replace(/\s+/g, '-')}.jpg`
          a.click()
          URL.revokeObjectURL(url)
          
          await navigator.clipboard.writeText(spotUrl)
          toast({
            title: 'Image téléchargée',
            description: 'Le lien a été copié dans le presse-papier',
          })
        } else {
          // No image, just copy URL
          await navigator.clipboard.writeText(spotUrl)
          toast({
            title: 'Lien copié',
            description: 'Le lien du spot a été copié dans le presse-papier',
          })
        }
      }
    } catch (error) {
      console.error('[ShareButton] Share error:', error)
      if ((error as Error).name !== 'AbortError') {
        toast({
          title: 'Erreur',
          description: 'Impossible de partager le spot',
          variant: 'destructive',
        })
      }
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="flex justify-center">
      <Button
        onClick={handleShare}
        disabled={isSharing}
        variant="outline"
        size="lg"
        className="gap-2"
      >
        <Share2 className="h-5 w-5" />
        Partage l&apos;image du spot à tes potes ✌️
      </Button>
    </div>
  )
}
