/**
 * Generates complete SQL migration for all spots with tide data
 * Usage: npx tsx scripts/generate-complete-tide-migration.ts
 */

// Mapping complet : ville → URL mareespeche.com
const tideStations = {
  // Trouvées directement
  'Anglet': 'https://mareespeche.com/fr/aquitaine/anglet',
  'Biarritz': 'https://mareespeche.com/fr/aquitaine/biarritz',
  'Bidart': 'https://mareespeche.com/fr/aquitaine/bidart',
  'Biscarrosse': 'https://mareespeche.com/fr/aquitaine/biscarrosse',
  'Capbreton': 'https://mareespeche.com/fr/aquitaine/capbreton',
  'La Teste-de-Buch': 'https://mareespeche.com/fr/aquitaine/la-teste-de-buch',
  'Lacanau': 'https://mareespeche.com/fr/aquitaine/lacanau',
  'Mimizan': 'https://mareespeche.com/fr/aquitaine/mimizan',
  'Moliets': 'https://mareespeche.com/fr/aquitaine/moliets-et-maa',
  'Ondres': 'https://mareespeche.com/fr/aquitaine/ondres',
  'Seignosse': 'https://mareespeche.com/fr/aquitaine/seignosse',
  'Vieux-Boucau': 'https://mareespeche.com/fr/aquitaine/vieux-boucau-les-bains',
  'Bretignolles-sur-Mer': 'https://mareespeche.com/fr/pays-de-la-loire/bretignolles-sur-mer',
  'Saint-Nazaire': 'https://mareespeche.com/fr/pays-de-la-loire/saint-nazaire',
  'Saint-Brevin': 'https://mareespeche.com/fr/pays-de-la-loire/saint-brevin-les-pins',
  'Saint-Gilles-Croix-de-Vie': 'https://mareespeche.com/fr/pays-de-la-loire/saint-gilles-croix-de-vie',
  'Royan': 'https://mareespeche.com/fr/poitou-charentes/royan-gironde-river',
  'Boulogne-sur-Mer': 'https://mareespeche.com/fr/nord-pas-de-calais/boulogne',
  
  // Stations les plus proches
  'Hendaye': 'https://mareespeche.com/fr/aquitaine/bidart', // 17.5 km
  'Contis': 'https://mareespeche.com/fr/aquitaine/mimizan', // 14.7 km
  'Hossegor': 'https://mareespeche.com/fr/aquitaine/capbreton', // 3.5 km
  'Diélette': 'https://mareespeche.com/fr/normandie/omonville-la-rogue', // 16.7 km
  'Ciboure': 'https://mareespeche.com/fr/aquitaine/bidart', // 9.9 km
  'Le Verdon-sur-Mer': 'https://mareespeche.com/fr/aquitaine/pointe-de-grave', // 2.2 km
  'Bénodet': 'https://mareespeche.com/fr/bretagne/concarneau', // 14.9 km
  'Camaret-sur-Mer': 'https://mareespeche.com/fr/bretagne/brest', // 13.9 km
  'Quiberon': 'https://mareespeche.com/fr/bretagne/vannes', // 33 km
  'Audierne': 'https://mareespeche.com/fr/bretagne/douarnenez', // 17.4 km
  'Pouldreuzic': 'https://mareespeche.com/fr/bretagne/douarnenez', // 16.1 km
  'Les Sables-d\'Olonne': 'https://mareespeche.com/fr/pays-de-la-loire/saint-jean-de-monts', // 39.2 km
  'Saint-Malo': 'https://mareespeche.com/fr/normandie/granville', // 37.1 km
  'La Trinité-sur-Mer': 'https://mareespeche.com/fr/bretagne/vannes', // 22.1 km
  'Saint-Philibert': 'https://mareespeche.com/fr/bretagne/vannes', // 18.7 km
  'Cherbourg': 'https://mareespeche.com/fr/normandie/omonville-la-rogue', // 19.5 km
  'La Hague': 'https://mareespeche.com/fr/normandie/goury', // 3.9 km
  'Le Havre': 'https://mareespeche.com/fr/normandie/honfleur', // 12.4 km
};

// Extraire le nom de la station depuis l'URL
function getStationName(url: string): string {
  const match = url.match(/\/([^\/]+)$/);
  if (!match) return 'Unknown';
  return match[1]
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
}

console.log('🌊 Generating complete tide data migration for all spots\n');
console.log('='.repeat(80));
console.log(`\nTotal cities with tide data: ${Object.keys(tideStations).length}\n`);

// Generate SQL migration
console.log('\n📝 COMPLETE SQL MIGRATION');
console.log('='.repeat(80));
console.log('\n');
console.log('-- Ajoute les colonnes pour les données de marée');
console.log('ALTER TABLE public.spots');
console.log('ADD COLUMN IF NOT EXISTS shom_station TEXT,');
console.log('ADD COLUMN IF NOT EXISTS shom_url TEXT;\n');
console.log('-- Met à jour tous les spots avec les données de marée de mareespeche.com\n');

Object.entries(tideStations).forEach(([city, url]) => {
  const stationName = getStationName(url);
  console.log(`-- ${city} → ${stationName}`);
  console.log(`UPDATE public.spots SET shom_station = '${stationName}', shom_url = '${url}' WHERE city = '${city}';\n`);
});

console.log('\n-- Fin de la migration');

console.log('\n\n📊 SUMMARY');
console.log('='.repeat(80));
console.log(`Total cities: ${Object.keys(tideStations).length}`);
console.log(`Direct matches: 18`);
console.log(`Nearest stations: 18`);
console.log('\n✅ Migration SQL complete generated!');
console.log('\nCopy the SQL above and run it in your Supabase SQL editor.');
