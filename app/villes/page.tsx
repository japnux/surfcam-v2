import { getCitiesGroupedByRegion } from '@/lib/data/spots'
import { slugify } from '@/lib/utils'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Spots par ville',
  description: 'Trouvez des webcams de surf en direct par ville.',
}

const countryFlags: { [key: string]: string } = {
  France: '🇫🇷',
  Portugal: '🇵🇹',
  Spain: '🇪🇸',
}

export default async function CitiesPage() {
  const countries = await getCitiesGroupedByRegion()
  const sortedCountries = Object.keys(countries).sort()

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">Spots par ville</h1>
      
      <div className="space-y-12">
        {sortedCountries.map(countryName => (
          <div key={countryName}>
            {Object.keys(countries[countryName]).sort().map(regionName => (
              <section key={regionName} className="mb-12">
                <h2 className="text-2xl font-bold mb-4 border-b pb-2 flex items-center">
                  <span className="mr-2">{countryFlags[countryName]}</span>
                  {regionName === 'Pays Basque' && countryName === 'France' && <span className="mr-2">🇪🇸</span>}
                  {regionName}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {countries[countryName][regionName].map(city => (
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
        ))}
      </div>
    </div>
  )
}