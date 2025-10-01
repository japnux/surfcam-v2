import { MetadataRoute } from 'next'
import { getActiveSpots } from '@/lib/data/spots'
import { config } from '@/lib/config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const spots = await getActiveSpots()

  const spotUrls = spots.map((spot) => ({
    url: `${config.siteUrl}/spots/${spot.slug}`,
    lastModified: new Date(spot.updated_at),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [
    {
      url: config.siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${config.siteUrl}/spots`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...spotUrls,
  ]
}
