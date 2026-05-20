import { Metadata } from 'next'
import { getActiveSpots, type Spot, type SpotPreview } from '@/lib/data/spots'
import { getUserFavorites } from '@/lib/data/favorites'
import { SpotSwiper } from '@/components/spot-swiper'
import { NearbySpotsSwiper } from '@/components/nearby-spots-swiper'
import { config } from '@/lib/config'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Accueil',
  description: 'Découvrez les meilleurs spots de surf avec webcam en direct et prévisions détaillées.',
}

export const revalidate = 3600 // 1 heure - optimisation performance

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let favoriteSpots: Spot[] = []
  // Tous les spots actifs : le tri par distance se fait côté client
  const activeSpots: SpotPreview[] = await getActiveSpots()

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
      
      <div className="container py-6 space-y-6">
        {/* Favoris (connecté) ou spots proches triés par distance (visiteur) */}
        <section className="space-y-4">
          {user && favoriteSpots.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold">Mes spots favoris</h2>
              <SpotSwiper spots={favoriteSpots} />
            </>
          ) : (
            <NearbySpotsSwiper spots={activeSpots} />
          )}
        </section>
      </div>
    </>
  )
}
