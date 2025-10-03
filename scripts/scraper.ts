/**
 * GoSurf.fr Scraper
 * 
 * This scraper extracts surf spot data from gosurf.fr including:
 * - Spot names and locations
 * - HLS webcam stream URLs
 * 
 * Run with: npm run scrape
 * 
 * Note: This will take several minutes as it fetches each spot page individually
 * to extract the HLS stream URLs.
 */

import * as cheerio from 'cheerio'

interface ScrapedSpot {
  name: string
  slug: string
  country: string
  region: string
  city: string | null
  latitude: number
  longitude: number
  timezone: string
  break_type: string | null
  orientation: string | null
  level: string | null
  cam_url: string
  cam_type: string
  is_active: boolean
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function extractHlsUrl(pageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(pageUrl)
    const html = await response.text()
    
    // Look for data-src attribute containing the stream ID
    const dataSrcMatch = html.match(/data-src="([^"]+)"/i)
    
    if (dataSrcMatch && dataSrcMatch[1]) {
      const streamId = dataSrcMatch[1]
      // Build Quanteec CDN URL
      return `https://ds1-cache.quanteec.com/contents/encodings/live/${streamId}/media_0.m3u8`
    }
    
    // Fallback: try to find direct .m3u8 URLs
    const m3u8Match = html.match(/https:\/\/[^"'\s]+\.m3u8/i)
    if (m3u8Match) {
      return m3u8Match[0]
    }
    
    return null
  } catch (error) {
    return null
  }
}

async function scrapeGoSurf(): Promise<ScrapedSpot[]> {
  const spots: ScrapedSpot[] = []

  try {
    console.log('🌊 Fetching GoSurf list page...')
    const response = await fetch('https://gosurf.fr/list')
    const html = await response.text()
    const $ = cheerio.load(html)

    console.log('📝 Parsing spots...\n')

    const spotLinks: Array<{ href: string; fullText: string }> = []
    
    // Collect all spot links first
    $('a[href^="/webcam/fr/"]').each((i, el) => {
      const $el = $(el)
      const href = $el.attr('href')
      const fullText = $el.text().trim()
      
      if (href && fullText.includes('|')) {
        spotLinks.push({ href, fullText })
      }
    })

    console.log(`Found ${spotLinks.length} spots. Fetching HLS URLs...\n`)
    console.log('⏳ This may take a few minutes (please be patient)...\n')

    // Process each spot (with delay to avoid overwhelming the server)
    for (let i = 0; i < spotLinks.length; i++) {
      const { href, fullText } = spotLinks[i]
      
      // Parse spot info
      const parts = fullText.replace('live', '').trim().split('|')
      if (parts.length < 2) continue

      const country = parts[0].trim()
      const locationAndName = parts[1].trim()
      
      const locationParts = locationAndName.split(/\s+/)
      const city = locationParts[0]
      const spotName = locationParts.slice(1).join(' ')
      
      if (!city || !spotName) continue

      // Build webcam URL
      const webcamPageUrl = `https://gosurf.fr${href}`
      
      // Extract HLS URL from the page
      console.log(`[${i + 1}/${spotLinks.length}] ${city} - ${spotName}...`)
      const hlsUrl = await extractHlsUrl(webcamPageUrl)
      
      if (!hlsUrl) {
        console.log(`  ⚠️  No HLS URL found`)
      } else {
        console.log(`  ✓ Found stream`)
      }
      
      // Determine region based on city
      let region = 'France'
      let timezone = 'Europe/Paris'
      
      if (country === 'Portugal') {
        region = 'Portugal'
        timezone = 'Europe/Lisbon'
      } else if (['Anglet', 'Biarritz', 'Bidart', 'Capbreton', 'Hossegor', 'Seignosse', 'Hendaye'].includes(city)) {
        region = 'Nouvelle-Aquitaine'
      } else if (['Lacanau', 'Biscarrosse', 'Mimizan', 'Contis'].includes(city)) {
        region = 'Nouvelle-Aquitaine'
      } else if (['Bénodet', 'Crozon'].includes(city)) {
        region = 'Bretagne'
      } else if (city === 'Dunkerque') {
        region = 'Hauts-de-France'
      }

      spots.push({
        name: `${city} - ${spotName}`,
        slug: generateSlug(`${city}-${spotName}`),
        country: country === 'Portugal' ? 'Portugal' : 'France',
        region,
        city,
        latitude: 0, // Still need manual entry or geocoding API
        longitude: 0,
        timezone,
        break_type: null,
        orientation: null,
        level: null,
        cam_url: hlsUrl || webcamPageUrl, // Use HLS URL if found, otherwise page URL
        cam_type: 'hls',
        is_active: hlsUrl !== null, // Only active if we found a stream
      })

      // Small delay to avoid overwhelming the server (500ms between requests)
      if (i < spotLinks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    console.log(`\n✅ Successfully scraped ${spots.filter(s => s.is_active).length}/${spots.length} spots with HLS URLs`)

  } catch (error) {
    console.error('Scraping error:', error)
  }

  return spots
}

async function main() {
  console.log('🌊 GoSurf Scraper')
  console.log('==================\n')

  const spots = await scrapeGoSurf()

  if (spots.length === 0) {
    console.log('No spots scraped.')
    return
  }

  console.log(`\nGenerating SQL for ${spots.length} spots:\n`)
  console.log(`📊 Summary:`)
  console.log(`   - Total spots: ${spots.length}`)
  console.log(`   - With HLS URLs: ${spots.filter(s => s.is_active).length}`)
  console.log(`   - Without HLS URLs: ${spots.filter(s => !s.is_active).length}\n`)
  
  // Generate SQL insert statements
  console.log('-- Insert statements for spots')
  console.log('INSERT INTO spots (slug, name, country, region, city, latitude, longitude, timezone, break_type, orientation, level, cam_url, cam_type, is_active) VALUES')
  
  const values = spots.map((spot, i) => {
    const values = [
      spot.slug,
      spot.name,
      spot.country,
      spot.region,
      spot.city,
      spot.latitude,
      spot.longitude,
      spot.timezone,
      spot.break_type,
      spot.orientation,
      spot.level,
      spot.cam_url,
      spot.cam_type,
      spot.is_active,
    ]
    
    const formatted = values.map(v => {
      if (v === null) return 'NULL'
      if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`
      return v
    }).join(', ')
    
    return `(${formatted})${i < spots.length - 1 ? ',' : ';'}`
  }).join('\n')
  
  console.log(values)
  console.log('\n✅ Done!')
}

main().catch(console.error)