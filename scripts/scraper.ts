import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables from .env.local
dotenvConfig({ path: '.env.local' });

// --- Type Definitions ---
interface Spot {
  id: number;
  name: string;
  city: string;
}

interface Forecast {
  time: string;
  swellSize: string;
  swellPeriod: string;
  swellDirection: string | undefined;
  windSpeed: string;
  windDirection: string | undefined;
}

interface DailyForecast {
  date: string;
  forecasts: Forecast[];
}

// --- Supabase Client Setup ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and service key are required. Please check your .env.local file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Scraper Functions ---

/**
 * Fetches all active spots from the Supabase database.
 */
async function getSpotsFromSupabase(): Promise<Spot[]> {
  console.log('🌊 Fetching spots from Supabase...');
  const { data, error } = await supabase.from('spots').select('id, name, city').eq('is_active', true);

  if (error) {
    console.error('Error fetching spots:', error);
    return [];
  }

  console.log(`✅ Found ${data.length} active spots.`);
  return data;
}

/**
 * Creates a map of spot names to their forecast URLs from the Allosurf index page.
 */
async function createAlloSurfSpotMap(): Promise<Map<string, string>> {
  console.log('🗺️ Building Allosurf spot map...');
  const spotMap = new Map<string, string>();
  const url = 'https://www.allosurf.net/meteo/selection-plage-spot-3.html';

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch spot index page. Status: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);

    $('a[href*="meteo/surf/"]').each((i, el) => {
      const $el = $(el);
      const href = $el.attr('href');
      const name = $el.text().replace('Météo surf', '').trim();
      if (name && href) {
        spotMap.set(name, `https://www.allosurf.net/${href}`);
      }
    });

    console.log(`✅ Built map with ${spotMap.size} spots.`);
    return spotMap;
  } catch (error) {
    console.error('Error building Allosurf spot map:', error);
    return spotMap;
  }
}

/**
 * Scrapes the forecast data from a specific Allosurf forecast page.
 */
async function scrapeAlloSurfForecast(url: string): Promise<DailyForecast[]> {
  const dailyForecasts: DailyForecast[] = [];
  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);

    $('table.as-prev-jour-int').each((i, dayTable) => {
      const $dayTable = $(dayTable);
      const date = $dayTable.find('thead th').first().text().trim();
      const forecasts: Forecast[] = [];

      $dayTable.find('tbody tr').each((j, hourRow) => {
        const $hourRow = $(hourRow);
        forecasts.push({
          time: $hourRow.find('td').first().text().trim(),
          swellSize: $hourRow.find('td.houle span.taille').text().trim(),
          swellPeriod: $hourRow.find('td.houle span.periode').text().trim(),
          swellDirection: $hourRow.find('td.houle span.dir img').attr('title'),
          windSpeed: $hourRow.find('td.vent span.force').text().trim(),
          windDirection: $hourRow.find('td.vent span.dir img').attr('title'),
        });
      });

      if (forecasts.length > 0) {
        dailyForecasts.push({ date, forecasts });
      }
    });
  } catch (error) {
    console.error(`Error scraping forecast from ${url}:`, error);
  }
  return dailyForecasts;
}

/**
 * A simple string similarity function (Jaro-Winkler distance).
 */
function stringSimilarity(s1: string, s2: string): number {
    let m = 0;
    if (s1.length === 0 || s2.length === 0) return 0;
    const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);

    for (let i = 0; i < s1.length; i++) {
        const start = Math.max(0, i - range);
        const end = Math.min(i + range + 1, s2.length);
        for (let j = start; j < end; j++) {
            if (s2Matches[j]) continue;
            if (s1[i] !== s2[j]) continue;
            s1Matches[i] = true;
            s2Matches[j] = true;
            m++;
            break;
        }
    }

    if (m === 0) return 0;

    let t = 0;
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
        if (!s1Matches[i]) continue;
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k]) t++;
        k++;
    }

    const jaro = (m / s1.length + m / s2.length + (m - t / 2) / m) / 3;
    const p = 0.1;
    let l = 0;
    while (s1[l] === s2[l] && l < 4) l++;

    return jaro + l * p * (1 - jaro);
}


// --- Main Execution ---
async function main() {
  console.log('🚀 Starting Allosurf forecast scraper...');
  console.log('======================================\\n');

  const alloSurfMap = await createAlloSurfSpotMap();
  if (alloSurfMap.size === 0) {
    console.log('Could not build Allosurf spot map. Exiting.');
    return;
  }

  const spots = await getSpotsFromSupabase();
  if (spots.length === 0) {
    console.log('No spots to process. Exiting.');
    return;
  }

  for (const spot of spots) {
    console.log(`\n--- Processing: ${spot.name} ---`);
    const searchTerm = spot.name.replace(`${spot.city} - `, '').toLowerCase();
    
    console.log(`🔍 Matching "${searchTerm}" in the spot map...`);
    
    let bestMatchUrl: string | undefined;
    let highestScore = 0.7; // Set a threshold to avoid bad matches

    for (const [key, url] of alloSurfMap.entries()) {
        const score = stringSimilarity(searchTerm, key.toLowerCase());
        if (score > highestScore) {
            highestScore = score;
            bestMatchUrl = url;
        }
    }

    if (bestMatchUrl) {
      console.log(`✅ Found best match with score ${highestScore.toFixed(2)}: ${bestMatchUrl}`);
      const forecasts = await scrapeAlloSurfForecast(bestMatchUrl);
      if (forecasts.length > 0) {
        console.log(`📝 Scraped ${forecasts.length} days of forecast data.`);
        console.log(JSON.stringify(forecasts[0], null, 2)); // Log first day for brevity
      } else {
        console.log('⚠️ No forecast data found on the page.');
      }
    } else {
      console.log(`❌ Could not find a suitable match for "${searchTerm}".`);
    }

    await new Promise(resolve => setTimeout(resolve, 200)); // Shorter delay
  }

  console.log('\\n✅ Forecast scraping complete!');
}

main().catch(console.error);