/**
 * Finds the nearest tide stations for cities not found on mareespeche.com
 * Usage: npx tsx scripts/find-nearest-tide-stations.ts
 */

// Villes non trouvées avec leurs coordonnées approximatives
const notFoundCities = [
  { name: 'Hendaye', lat: 43.3667, lon: -1.7833, region: 'aquitaine' },
  { name: 'Contis', lat: 44.0833, lon: -1.3167, region: 'aquitaine' },
  { name: 'Hossegor', lat: 43.6667, lon: -1.4167, region: 'aquitaine' },
  { name: 'Diélette', lat: 49.5500, lon: -1.8667, region: 'normandie' },
  { name: 'Ciboure', lat: 43.3833, lon: -1.6833, region: 'aquitaine' },
  { name: 'Le Verdon-sur-Mer', lat: 45.5500, lon: -1.0667, region: 'aquitaine' },
  { name: 'Bénodet', lat: 47.8667, lon: -4.1167, region: 'bretagne' },
  { name: 'Camaret-sur-Mer', lat: 48.2833, lon: -4.5833, region: 'bretagne' },
  { name: 'Quiberon', lat: 47.4833, lon: -3.1167, region: 'bretagne' },
  { name: 'Audierne', lat: 48.0167, lon: -4.5333, region: 'bretagne' },
  { name: 'Pouldreuzic', lat: 47.9500, lon: -4.3667, region: 'bretagne' },
  { name: 'Les Sables-d\'Olonne', lat: 46.4967, lon: -1.7833, region: 'pays-de-la-loire' },
  { name: 'Saint-Malo', lat: 48.6500, lon: -2.0167, region: 'bretagne' },
  { name: 'La Trinité-sur-Mer', lat: 47.5833, lon: -3.0333, region: 'bretagne' },
  { name: 'Saint-Philibert', lat: 47.5833, lon: -2.9833, region: 'bretagne' },
  { name: 'Cherbourg', lat: 49.6333, lon: -1.6167, region: 'normandie' },
  { name: 'La Hague', lat: 49.6833, lon: -1.9333, region: 'normandie' },
  { name: 'Le Havre', lat: 49.4944, lon: 0.1079, region: 'normandie' },
];

// Stations connues sur mareespeche.com avec leurs coordonnées
const knownStations = [
  // Aquitaine
  { name: 'Anglet', url: 'https://mareespeche.com/fr/aquitaine/anglet', lat: 43.5244, lon: -1.5308 },
  { name: 'Biarritz', url: 'https://mareespeche.com/fr/aquitaine/biarritz', lat: 43.4832, lon: -1.5586 },
  { name: 'Bidart', url: 'https://mareespeche.com/fr/aquitaine/bidart', lat: 43.4442, lon: -1.5947 },
  { name: 'Capbreton', url: 'https://mareespeche.com/fr/aquitaine/capbreton', lat: 43.6464, lon: -1.4497 },
  { name: 'Seignosse', url: 'https://mareespeche.com/fr/aquitaine/seignosse', lat: 43.6958, lon: -1.4411 },
  { name: 'Ondres', url: 'https://mareespeche.com/fr/aquitaine/ondres', lat: 43.5761, lon: -1.4883 },
  { name: 'Mimizan', url: 'https://mareespeche.com/fr/aquitaine/mimizan', lat: 44.2150, lon: -1.2997 },
  { name: 'Biscarrosse', url: 'https://mareespeche.com/fr/aquitaine/biscarrosse', lat: 44.4453, lon: -1.2575 },
  { name: 'Arcachon', url: 'https://mareespeche.com/fr/aquitaine/arcachon', lat: 44.6656, lon: -1.1692 },
  { name: 'Lacanau', url: 'https://mareespeche.com/fr/aquitaine/lacanau', lat: 44.9978, lon: -1.2075 },
  { name: 'Soulac-sur-Mer', url: 'https://mareespeche.com/fr/aquitaine/soulac-sur-mer', lat: 45.5172, lon: -1.1325 },
  { name: 'Pointe de Grave', url: 'https://mareespeche.com/fr/aquitaine/pointe-de-grave', lat: 45.5692, lon: -1.0592 },
  
  // Bretagne
  { name: 'Concarneau', url: 'https://mareespeche.com/fr/bretagne/concarneau', lat: 47.8733, lon: -3.9167 },
  { name: 'Douarnenez', url: 'https://mareespeche.com/fr/bretagne/douarnenez', lat: 48.0928, lon: -4.3289 },
  { name: 'Brest', url: 'https://mareespeche.com/fr/bretagne/brest', lat: 48.3900, lon: -4.4861 },
  { name: 'Le Conquet', url: 'https://mareespeche.com/fr/bretagne/le-conquet', lat: 48.3597, lon: -4.7717 },
  { name: 'Lorient', url: 'https://mareespeche.com/fr/bretagne/lorient', lat: 47.7483, lon: -3.3703 },
  { name: 'Vannes', url: 'https://mareespeche.com/fr/bretagne/vannes', lat: 47.6578, lon: -2.7603 },
  { name: 'Saint-Nazaire', url: 'https://mareespeche.com/fr/pays-de-la-loire/saint-nazaire', lat: 47.2733, lon: -2.2133 },
  { name: 'Pornic', url: 'https://mareespeche.com/fr/pays-de-la-loire/pornic', lat: 47.1156, lon: -2.1028 },
  
  // Normandie
  { name: 'Granville', url: 'https://mareespeche.com/fr/normandie/granville', lat: 48.8378, lon: -1.5981 },
  { name: 'Carteret', url: 'https://mareespeche.com/fr/normandie/carteret', lat: 49.3758, lon: -1.7453 },
  { name: 'Goury', url: 'https://mareespeche.com/fr/normandie/goury', lat: 49.7167, lon: -1.9500 },
  { name: 'Omonville-la-Rogue', url: 'https://mareespeche.com/fr/normandie/omonville-la-rogue', lat: 49.7000, lon: -1.8667 },
  { name: 'Port-en-Bessin', url: 'https://mareespeche.com/fr/normandie/port-en-bessin', lat: 49.3461, lon: -0.7544 },
  { name: 'Honfleur', url: 'https://mareespeche.com/fr/normandie/honfleur', lat: 49.4189, lon: 0.2333 },
  
  // Pays de la Loire
  { name: 'Noirmoutier', url: 'https://mareespeche.com/fr/pays-de-la-loire/noirmoutier-en-l-ile', lat: 47.0000, lon: -2.2500 },
  { name: 'Saint-Jean-de-Monts', url: 'https://mareespeche.com/fr/pays-de-la-loire/saint-jean-de-monts', lat: 46.7944, lon: -2.0583 },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findNearestStation(city: typeof notFoundCities[0]) {
  let nearestStation = knownStations[0];
  let minDistance = calculateDistance(city.lat, city.lon, nearestStation.lat, nearestStation.lon);
  
  for (const station of knownStations) {
    const distance = calculateDistance(city.lat, city.lon, station.lat, station.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearestStation = station;
    }
  }
  
  return { station: nearestStation, distance: minDistance };
}

console.log('🔍 Finding nearest tide stations for cities not found...\n');
console.log('='.repeat(80));

const results: Array<{
  city: string;
  nearestStation: string;
  stationUrl: string;
  distance: number;
}> = [];

notFoundCities.forEach(city => {
  const { station, distance } = findNearestStation(city);
  results.push({
    city: city.name,
    nearestStation: station.name,
    stationUrl: station.url,
    distance: Math.round(distance * 10) / 10,
  });
  
  console.log(`\n${city.name}`);
  console.log(`  ➜ Nearest station: ${station.name}`);
  console.log(`  ➜ Distance: ${Math.round(distance * 10) / 10} km`);
  console.log(`  ➜ URL: ${station.url}`);
});

// Generate SQL
console.log('\n\n📝 SQL MIGRATION:');
console.log('='.repeat(80));
console.log('\n-- Update spots with nearest tide stations\n');

results.forEach(result => {
  console.log(`-- ${result.city} → ${result.nearestStation} (${result.distance} km)`);
  console.log(`UPDATE public.spots SET shom_station = '${result.nearestStation}', shom_url = '${result.stationUrl}' WHERE city = '${result.city}';\n`);
});

console.log('\n\n📊 SUMMARY');
console.log('='.repeat(80));
console.log(`Total cities processed: ${notFoundCities.length}`);
console.log(`Average distance to nearest station: ${Math.round(results.reduce((sum, r) => sum + r.distance, 0) / results.length * 10) / 10} km`);
