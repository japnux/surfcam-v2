'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Spot } from '@/lib/data/spots'

interface SpotFormProps {
  spot?: Spot
}

export function SpotForm({ spot }: SpotFormProps) {
  const [formData, setFormData] = useState({
    name: spot?.name || '',
    slug: spot?.slug || '',
    country: spot?.country || 'France',
    region: spot?.region || '',
    city: spot?.city || '',
    latitude: spot?.latitude?.toString() || '',
    longitude: spot?.longitude?.toString() || '',
    timezone: spot?.timezone || 'Europe/Paris',
    break_type: spot?.break_type || '',
    orientation: spot?.orientation || '',
    level: spot?.level || '',
    hazards: spot?.hazards || '',
    best_tide: spot?.best_tide || '',
    best_wind: spot?.best_wind || '',
    cam_url: spot?.cam_url || '',
    cam_type: spot?.cam_type || 'hls',
    license_credit: spot?.license_credit || '',
    is_active: spot?.is_active ?? true,
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setFormData({ ...formData, slug })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = spot ? `/api/admin/spots/${spot.id}` : '/api/admin/spots'
      const method = spot ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save spot')
      }

      toast({
        title: spot ? 'Spot mis à jour' : 'Spot créé',
        description: 'Les modifications ont été enregistrées.',
      })

      router.push('/admin')
      router.refresh()
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'enregistrer le spot.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onBlur={!spot ? generateSlug : undefined}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Pays *</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">Région *</Label>
          <Input
            id="region"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ville</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Fuseau horaire *</Label>
          <Input
            id="timezone"
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude *</Label>
          <Input
            id="latitude"
            type="number"
            step="0.0000001"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude *</Label>
          <Input
            id="longitude"
            type="number"
            step="0.0000001"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="break_type">Type de vague</Label>
          <Input
            id="break_type"
            value={formData.break_type}
            onChange={(e) => setFormData({ ...formData, break_type: e.target.value })}
            placeholder="Beach break, Reef break..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="orientation">Orientation</Label>
          <Input
            id="orientation"
            value={formData.orientation}
            onChange={(e) => setFormData({ ...formData, orientation: e.target.value })}
            placeholder="Ouest, Nord-Ouest..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="level">Niveau</Label>
          <Input
            id="level"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            placeholder="Débutant, Intermédiaire, Avancé..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hazards">Dangers</Label>
          <Input
            id="hazards"
            value={formData.hazards}
            onChange={(e) => setFormData({ ...formData, hazards: e.target.value })}
            placeholder="Rochers, Courants..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="best_tide">Meilleure marée</Label>
          <Input
            id="best_tide"
            value={formData.best_tide}
            onChange={(e) => setFormData({ ...formData, best_tide: e.target.value })}
            placeholder="Mi-marée, Haute..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="best_wind">Meilleur vent</Label>
          <Input
            id="best_wind"
            value={formData.best_wind}
            onChange={(e) => setFormData({ ...formData, best_wind: e.target.value })}
            placeholder="Est, Nord-Est..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cam_url">URL de la webcam *</Label>
        <Input
          id="cam_url"
          value={formData.cam_url}
          onChange={(e) => setFormData({ ...formData, cam_url: e.target.value })}
          required
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cam_type">Type de webcam *</Label>
        <Input
          id="cam_type"
          value={formData.cam_type}
          onChange={(e) => setFormData({ ...formData, cam_type: e.target.value })}
          required
          placeholder="hls, mp4, webm..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="license_credit">Crédit / License</Label>
        <Input
          id="license_credit"
          value={formData.license_credit}
          onChange={(e) => setFormData({ ...formData, license_credit: e.target.value })}
          placeholder="Source de la webcam..."
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="is_active" className="cursor-pointer">Actif</Label>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : spot ? 'Mettre à jour' : 'Créer'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
      </div>
    </form>
  )
}
