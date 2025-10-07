/**
 * Generates SQL migration for tide data based on all spots in Supabase
 * Usage: npx tsx scripts/generate-tide-migration-from-db.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Mapping complet : ville → URL mareespeche.com
const tideStations: Record<string, string> = {
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
  'Moliets-et-Mâa': 'https://mareespeche.com/fr/aquitaine/moliets-et-maa',
  'Ondres': 'https://mareespeche.com/fr/aquitaine/ondres',
  'Seignosse': 'https://mareespeche.com/fr/aquitaine/seignosse',
  'Vieux-Boucau': 'https://mareespeche.com/fr/aquitaine/vieux-boucau-les-bains',
  'Vieux-Boucau-les-Bains': 'https://mareespeche.com/fr/aquitaine/vieux-boucau-les-bains',
  'Bretignolles-sur-Mer': 'https://mareespeche.com/fr/pays-de-la-loire/bretignolles-sur-mer',
  'Saint-Nazaire': 'https://mareespeche.com/fr/pays-de-la-loire/saint-nazaire',
  'Saint-Brevin': 'https://mareespeche.com/fr/pays-de-la-loire/saint-brevin-les-pins',
  'Saint-Brevin-les-Pins': 'https://mareespeche.com/fr/pays-de-la-loire/saint-brevin-les-pins',
  'Saint-Gilles-Croix-de-Vie': 'https://mareespeche.com/fr/pays-de-la-loire/saint-gilles-croix-de-vie',
  'Royan': 'https://mareespeche.com/fr/poitou-charentes/royan-gironde-river',
  'Boulogne-sur-Mer': 'https://mareespeche.com/fr/nord-pas-de-calais/boulogne',
  
  // Stations les plus proches
  'Hendaye': 'https://mareespeche.com/fr/aquitaine/bidart',
  'Contis': 'https://mareespeche.com/fr/aquitaine/mimizan',
  'Contis-Plage': 'https://mareespeche.com/fr/aquitaine/mimizan',
  'Hossegor': 'https://mareespeche.com/fr/aquitaine/capbreton',
  'Diélette': 'https://mareespeche.com/fr/normandie/omonville-la-rogue',
  'Ciboure': 'https://mareespeche.com/fr/aquitaine/bidart',
  'Le Verdon-sur-Mer': 'https://mareespeche.com/fr/aquitaine/pointe-de-grave',
  'Bénodet': 'https://mareespeche.com/fr/bretagne/concarneau',
  'Camaret-sur-Mer': 'https://mareespeche.com/fr/bretagne/brest',
  'Quiberon': 'https://mareespeche.com/fr/bretagne/vannes',
  'Audierne': 'https://mareespeche.com/fr/bretagne/douarnenez',
  'Pouldreuzic': 'https://mareespeche.com/fr/bretagne/douarnenez',
  'Les Sables-d\'Olonne': 'https://mareespeche.com/fr/pays-de-la-loire/saint-jean-de-monts',
  'Saint-Malo': 'https://mareespeche.com/fr/normandie/granville',
  'La Trinité-sur-Mer': 'https://mareespeche.com/fr/bretagne/vannes',
  'Saint-Philibert': 'https://mareespeche.com/fr/bretagne/vannes',
  'Cherbourg': 'https://mareespeche.com/fr/normandie/omonville-la-rogue',
  'Cherbourg-en-Cotentin': 'https://mareespeche.com/fr/normandie/omonville-la-rogue',
  'La Hague': 'https://mareespeche.com/fr/normandie/goury',
  'Le Havre': 'https://mareespeche.com/fr/normandie/honfleur',
  'Maupertus-sur-Mer': 'https://mareespeche.com/fr/normandie/omonville-la-rogue',
  'Neufchâtel-Hardelot': 'https://mareespeche.com/fr/nord-pas-de-calais/boulogne',
  'Montalivet': 'https://mareespeche.com/fr/aquitaine/pointe-de-grave',
  'Crozon': 'https://mareespeche.com/fr/bretagne/brest',
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

async function generateMigrationFromDB() {
  console.log('🌊 Generating tide data migration from Supabase spots...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get all unique cities from spots
  const { data: spots, error } = await supabase
    .from('spots')
    .select('city')
    .not('city', 'is', null);
  
  if (error) {
    console.error('❌ Error fetching spots:', error);
    return;
  }
  
  if (!spots || spots.length === 0) {
    console.log('⚠️  No spots found in database');
    return;
  }
  
  // Get unique cities
  const uniqueCities = [...new Set(spots.map((s: any) => s.city).filter(Boolean))] as string[];
  
  console.log(`📍 Found ${uniqueCities.length} unique cities in database\n`);
  
  // Match cities with tide stations
  const matched: Array<{ city: string; url: string; stationName: string }> = [];
  const notMatched: string[] = [];
  
  uniqueCities.forEach(city => {
    if (city && tideStations[city]) {
      const url = tideStations[city];
      matched.push({
        city,
        url,
        stationName: getStationName(url),
      });
    } else {
      notMatched.push(city || 'Unknown');
    }
  });
  
  console.log(`✅ Matched: ${matched.length} cities`);
  console.log(`❌ Not matched: ${notMatched.length} cities\n`);
  
  if (notMatched.length > 0) {
    console.log('⚠️  Cities without tide data:');
    notMatched.forEach(city => console.log(`  - ${city}`));
    console.log('\n');
  }
  
  // Generate SQL migration
  console.log('📝 COMPLETE SQL MIGRATION');
  console.log('='.repeat(80));
  console.log('\n');
  console.log('-- Ajoute les colonnes pour les données de marée');
  console.log('ALTER TABLE public.spots');
  console.log('ADD COLUMN IF NOT EXISTS shom_station TEXT,');
  console.log('ADD COLUMN IF NOT EXISTS shom_url TEXT;\n');
  console.log('-- Met à jour tous les spots avec les données de marée de mareespeche.com\n');
  
  matched.forEach(({ city, url, stationName }) => {
    // Escape single quotes for SQL
    const escapedCity = city.replace(/'/g, "''");
    const escapedStationName = stationName.replace(/'/g, "''");
    
    console.log(`-- ${city} → ${stationName}`);
    console.log(`UPDATE public.spots SET shom_station = '${escapedStationName}', shom_url = '${url}' WHERE city = '${escapedCity}';\n`);
  });
  
  console.log('-- Fin de la migration');
  
  console.log('\n\n📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total cities in database: ${uniqueCities.length}`);
  console.log(`Cities with tide data: ${matched.length}`);
  console.log(`Cities without tide data: ${notMatched.length}`);
  console.log(`Coverage: ${Math.round((matched.length / uniqueCities.length) * 100)}%`);
  console.log('\n✅ Migration SQL generated!');
  console.log('\nCopy the SQL above and run it in your Supabase SQL editor.');
}

generateMigrationFromDB();
