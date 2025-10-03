import { getSpotsByCity, getCities } from '@/lib/data/spots'
import { slugify } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { VideoPlayer } from '@/components/video-player'

interface CityPageProps {
  params: { ville: string }
}

export async function generateStaticParams() {
  const cities = await getCities()
  return cities.map(city => ({
    ville: slugify(city),
  }))
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const cities = await getCities()
  const cityName = cities.find(c => slugify(c) === params.ville)

  if (!cityName) {
    return { title: 'Ville non trouvée' }
  }

  return {
    title: `Webcams à ${cityName}`,
    description: `Webcams de surf en direct pour la ville de ${cityName}.`,
  }
}

export default async function CityPage({ params }: CityPageProps) {
  const cities = await getCities()
  const cityName = cities.find(c => slugify(c) === params.ville)

  if (!cityName) {
    notFound()
  }

  const spots = await getSpotsByCity(cityName)

  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold mb-8">Webcams à {cityName}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {spots.map(spot => (
          <div key={spot.id}>
            <h2 className="text-xl font-bold mb-2 text-center">
              <Link href={`/spots/${spot.slug}`} className="hover:text-primary transition-colors">
                {spot.name.replace(`${cityName} - `, '')}
              </Link>
            </h2>
            <VideoPlayer
              src={spot.cam_url}
              type={spot.cam_type}
              spotName={spot.name}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
