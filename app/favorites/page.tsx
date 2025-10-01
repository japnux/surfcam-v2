import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserFavorites } from '@/lib/data/favorites'
import { SpotCard } from '@/components/spot-card'
import { Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Mes favoris',
  description: 'Vos spots de surf favoris.',
}

export const revalidate = 0 // Always fresh

export default async function FavoritesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const favorites = await getUserFavorites(user.id)

  return (
    <div className="container py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Heart className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Mes favoris</h1>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Vous n&apos;avez pas encore de spots favoris.
          </p>
          <p className="text-sm text-muted-foreground">
            Parcourez les spots et ajoutez-les à vos favoris pour les retrouver facilement ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((spot) => (
            <SpotCard key={spot.id} spot={spot} />
          ))}
        </div>
      )}
    </div>
  )
}
