import { Metadata } from 'next'
import { getActiveSpots, type Spot } from '@/lib/data/spots'
import { getUserFavorites } from '@/lib/data/favorites'
import { SpotCard } from '@/components/spot-card'
import { FavoriteSpotCard } from '@/components/favorite-spot-card'
import { SearchBar } from '@/components/search-bar'
import { config } from '@/lib/config'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Accueil',
  description: 'Découvrez les meilleurs spots de surf avec webcam en direct et prévisions détaillées.',
}

export const revalidate = 900 // 15 minutes

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let favoriteSpots: Spot[] = []
  const activeSpots: Spot[] = await getActiveSpots(config.homeSpotCount)
  
  if (user) {
    // Si l'utilisateur est connecté, récupérer ses favoris actifs
    favoriteSpots = await getUserFavorites(user.id, true)
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.siteName,
    url: config.siteUrl,
    description: 'Consultez les webcams en direct et les prévisions de surf pour les meilleurs spots de France.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${config.siteUrl}/spots?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="container py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Webcams Surf en Direct
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Consultez les conditions en temps réel et les prévisions détaillées pour les meilleurs spots de surf en France.
          </p>
          
          <div className="max-w-xl mx-auto pt-4">
            <SearchBar placeholder="Rechercher un spot ou une ville..." />
          </div>
        </section>

        {/* Spots actifs ou favoris selon l'état de connexion */}
        <section className="space-y-4">
          {user && favoriteSpots.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold">Mes spots favoris</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favoriteSpots.map((spot) => (
                  <FavoriteSpotCard key={spot.id} spot={spot} />
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold">Spots actifs</h2>

              {activeSpots.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Aucun spot disponible pour le moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {activeSpots.map((spot) => (
                    <SpotCard key={spot.id} spot={spot} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  )
}
