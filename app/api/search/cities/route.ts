import { NextRequest, NextResponse } from 'next/server'
import { getCities } from '@/lib/data/spots'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    const allCities = await getCities()

    // Filtrer les villes qui correspondent à la recherche (insensible à la casse)
    const matchingCities = allCities.filter(city =>
      city && city.toLowerCase().includes(query.toLowerCase())
    )

    return NextResponse.json(matchingCities)
  } catch (error) {
    console.error('Erreur lors de la recherche de villes:', error)
    return NextResponse.json([], { status: 500 })
  }
}
