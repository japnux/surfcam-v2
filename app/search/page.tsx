import { Metadata } from 'next'
import { searchSpots, getCities } from '@/lib/data/spots'
import { slugify } from '@/lib/utils'
import { SearchBar } from '@/components/search-bar'
import { SpotCard } from '@/components/spot-card'
import Link from 'next/link'
import { MapPin, Waves } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Résultats de recherche',
  description: 'Recherchez des spots de surf et des villes sur Surfcam.',
}

export const revalidate = 900 // 15 minutes

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ''

  if (!query) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Veuillez saisir un terme de recherche.
          </p>
        </div>
      </div>
    )
  }

  // Rechercher les spots et les villes en parallèle
  const [spots, cities] = await Promise.all([
    searchSpots(query).catch(() => []),
    getCities().then(allCities =>
      allCities.filter(city =>
        city && city.toLowerCase().includes(query.toLowerCase())
      )
    ).catch(() => [])
  ])

  const totalResults = spots.length + cities.length

  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Résultats de recherche</h1>

        <div className="max-w-xl">
          <SearchBar placeholder="Rechercher un spot ou une ville..." initialValue={query} />
        </div>
      </div>

      {totalResults > 0 && (
        <p className="text-muted-foreground">
          {totalResults} résultat{totalResults !== 1 ? 's' : ''} pour &quot;{query}&quot;
        </p>
      )}

      {/* Afficher les villes en premier */}
      {cities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Villes ({cities.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cities.map((city) => (
              <Link
                key={city}
                href={`/villes/${slugify(city)}`}
                className="block p-4 bg-card border border-border rounded-lg text-center font-medium hover:bg-muted transition-colors hover:border-primary"
              >
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {city}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Afficher les spots ensuite */}
      {spots.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Waves className="h-6 w-6 text-primary" />
            Spots ({spots.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {spots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        </div>
      )}

      {totalResults === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Aucun résultat ne correspond à votre recherche &quot;{query}&quot;.
          </p>
        </div>
      )}
    </div>
  )
}
