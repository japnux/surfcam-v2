import { MetadataRoute } from 'next'
import { getAllSpotsForSitemap } from '@/lib/data/spots'
import { config } from '@/lib/config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const spots = await getAllSpotsForSitemap()

  const spotUrls = spots.map((spot) => ({
    url: `${config.siteUrl}/spots/${spot.slug}`,
    lastModified: spot.updated_at ? new Date(spot.updated_at) : new Date(),
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
