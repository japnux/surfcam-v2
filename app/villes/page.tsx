import { getCitiesGroupedByRegion } from '@/lib/data/spots'
import { slugify } from '@/lib/utils'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Spots par ville',
  description: 'Trouvez des webcams de surf en direct par ville.',
}

interface CitiesPageProps {
  searchParams: Promise<{ q?: string }>
}

const countryFlags: { [key: string]: string } = {
  France: '🇫🇷',
  Portugal: '🇵🇹',
  Spain: '🇪🇸',
}

export default async function CitiesPage({ searchParams }: CitiesPageProps) {
  const params = await searchParams
  const query = params.q?.toLowerCase() || ''
  const countries = await getCitiesGroupedByRegion()
  const sortedCountries = Object.keys(countries).sort()

  // Si il y a une recherche, filtrer les données
  let filteredCountries = countries
  if (query) {
    filteredCountries = {}

    for (const countryName of sortedCountries) {
      const countryData = countries[countryName]
      const filteredRegions: { [key: string]: { name: string; spotCount: number }[] } = {}

      for (const regionName in countryData) {
        const filteredCities = countryData[regionName].filter(city =>
          city.name.toLowerCase().includes(query)
        )

        if (filteredCities.length > 0) {
          filteredRegions[regionName] = filteredCities
        }
      }

      if (Object.keys(filteredRegions).length > 0) {
        filteredCountries[countryName] = filteredRegions
      }
    }
  }

  const hasResults = Object.keys(filteredCountries).length > 0

  return (
    <div className="container py-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Spots par ville</h1>

        {query && (
          <p className="text-muted-foreground">
            {hasResults
              ? `Résultats de recherche pour "${query}"`
              : `Aucune ville ne correspond à "${query}"`
            }
          </p>
        )}
      </div>

      {!query || !hasResults ? (
        <div className="space-y-12">
          {sortedCountries.map(countryName => {
            if (query && !filteredCountries[countryName]) return null

            const regionsToShow = query ? filteredCountries[countryName] : countries[countryName]

            return (
              <div key={countryName}>
                {Object.keys(regionsToShow).sort().map(regionName => (
                  <section key={regionName} className="mb-12">
                    <h2 className="text-2xl font-bold mb-4 border-b pb-2 flex items-center">
                      <span className="mr-2">{countryFlags[countryName]}</span>
                      {regionName === 'Pays Basque' && countryName === 'France' && <span className="mr-2">🇪🇸</span>}
                      {regionName}
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {regionsToShow[regionName].map(city => (
                        <Link
                          key={city.name}
                          href={`/villes/${slugify(city.name)}`}
                          className="block p-4 bg-card border border-border rounded-lg text-center font-medium hover:bg-muted transition-colors relative"
                        >
                          {city.name}
                          <span className="absolute top-1/2 -translate-y-1/2 right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">{city.spotCount}</span>
                        </Link>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}