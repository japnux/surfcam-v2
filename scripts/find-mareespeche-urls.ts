/**
 * Finds mareespeche.com URLs for all spot cities
 * Usage: npx tsx scripts/find-mareespeche-urls.ts
 */

// Liste des villes à chercher (basée sur la migration SQL)
const cities = [
  'Anglet',
  'Biarritz',
  'Bidart',
  'Hendaye',
  'Lacanau',
  'La Teste-de-Buch',
  'Contis',
  'Mimizan',
  'Biscarrosse',
  'Moliets',
  'Vieux-Boucau',
  'Ondres',
  'Seignosse',
  'Capbreton',
  'Hossegor',
  'Diélette',
  'Ciboure',
  'Boulogne-sur-Mer',
  'Le Verdon-sur-Mer',
  'Bénodet',
  'Camaret-sur-Mer',
  'Quiberon',
  'Audierne',
  'Pouldreuzic',
  'Les Sables-d\'Olonne',
  'Saint-Gilles-Croix-de-Vie',
  'Bretignolles-sur-Mer',
  'Royan',
  'Saint-Malo',
  'La Trinité-sur-Mer',
  'Saint-Philibert',
  'Saint-Nazaire',
  'Saint-Brevin',
  'Cherbourg',
  'La Hague',
  'Le Havre',
];

// Régions à explorer
const regions = [
  'aquitaine',
  'bretagne',
  'normandie',
  'pays-de-la-loire',
  'poitou-charentes',
  'nord-pas-de-calais',
];

interface TideLocation {
  name: string;
  url: string;
  region: string;
}

async function findTideLocations() {
  console.log('🌊 Searching for tide locations on mareespeche.com...\n');
  
  const foundLocations: TideLocation[] = [];
  const notFound: string[] = [];

  for (const region of regions) {
    console.log(`\n📍 Exploring region: ${region}`);
    
    try {
      const response = await fetch(`https://mareespeche.com/fr/${region}`);
      const html = await response.text();
      
      // Extract all location links from the page
      const linkRegex = /href="(https:\/\/mareespeche\.com\/fr\/[^\/]+\/([^"]+))"/g;
      let match;
      
      while ((match = linkRegex.exec(html)) !== null) {
        const url = match[1];
        const slug = match[2];
        const locationName = slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join('-');
        
        // Check if this location matches one of our cities
        for (const city of cities) {
          const normalizedCity = city.toLowerCase().replace(/['\s]/g, '-');
          const normalizedSlug = slug.toLowerCase();
          
          if (normalizedSlug.includes(normalizedCity) || normalizedCity.includes(normalizedSlug)) {
            foundLocations.push({
              name: city,
              url: url,
              region: region,
            });
            console.log(`  ✅ Found: ${city} → ${url}`);
            break;
          }
        }
      }
    } catch (error) {
      console.error(`  ❌ Error fetching ${region}:`, error);
    }
  }

  // Check which cities were not found
  for (const city of cities) {
    if (!foundLocations.find(loc => loc.name === city)) {
      notFound.push(city);
    }
  }

  console.log('\n\n📊 RESULTS');
  console.log('='.repeat(60));
  console.log(`\n✅ Found: ${foundLocations.length} locations`);
  console.log(`❌ Not found: ${notFound.length} locations\n`);

  if (foundLocations.length > 0) {
    console.log('\n\n🗺️  FOUND LOCATIONS:');
    console.log('-'.repeat(60));
    foundLocations.forEach(loc => {
      console.log(`${loc.name.padEnd(30)} → ${loc.url}`);
    });
  }

  if (notFound.length > 0) {
    console.log('\n\n⚠️  NOT FOUND:');
    console.log('-'.repeat(60));
    notFound.forEach(city => console.log(`  - ${city}`));
  }

  // Generate SQL migration
  console.log('\n\n📝 SQL MIGRATION:');
  console.log('='.repeat(60));
  console.log('\n-- Update spots with mareespeche.com URLs\n');
  
  foundLocations.forEach(loc => {
    const stationName = loc.name;
    const stationUrl = loc.url;
    console.log(`-- ${stationName}`);
    console.log(`UPDATE public.spots SET shom_station = '${stationName}', shom_url = '${stationUrl}' WHERE city = '${stationName}';\n`);
  });
}

findTideLocations();
