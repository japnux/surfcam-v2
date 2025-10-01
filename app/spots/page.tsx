import { Metadata } from 'next'
import { searchSpots, getAllSpots } from '@/lib/data/spots'
import { SpotCard } from '@/components/spot-card'
import { SearchBar } from '@/components/search-bar'

export const metadata: Metadata = {
  title: 'Tous les spots',
  description: 'Parcourez tous les spots de surf avec webcam en direct.',
}

export const revalidate = 900 // 15 minutes

interface SpotsPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SpotsPage({ searchParams }: SpotsPageProps) {
  const params = await searchParams
  const query = params.q || ''
  const spots = query ? await searchSpots(query) : await getAllSpots()

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Tous les spots</h1>
        
        <div className="max-w-xl">
          <SearchBar placeholder="Rechercher par nom ou ville..." initialValue={query} />
        </div>
      </div>

      {query && (
        <p className="text-muted-foreground">
          {spots.length} résultat{spots.length !== 1 ? 's' : ''} pour &quot;{query}&quot;
        </p>
      )}

      {spots.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {query 
              ? 'Aucun spot ne correspond à votre recherche.' 
              : 'Aucun spot disponible pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {spots.map((spot) => (
            <SpotCard key={spot.id} spot={spot} />
          ))}
        </div>
      )}
    </div>
  )
}
