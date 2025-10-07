/**
 * Fetches tide data from mareespeche.com for all spots in the database
 * Usage: npx tsx scripts/fetch-tides-from-db.ts [city_name]
 * Example: npx tsx scripts/fetch-tides-from-db.ts Capbreton
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

interface TideData {
  spotId: string;
  spotName: string;
  city: string;
  tideUrl: string;
  days: Array<{
    date: string;
    coefficient: string;
    tides: Array<{ time: string; height: string; type: 'high' | 'low' }>;
  }>;
  fetchedAt: string;
}

async function extractTideData(url: string): Promise<any> {
  try {
    // Extract port name from URL (e.g., "capbreton" from "https://mareespeche.com/fr/aquitaine/capbreton")
    const portMatch = url.match(/\/([^\/]+)$/);
    if (!portMatch) {
      console.error('Could not extract port name from URL');
      return null;
    }
    const portName = portMatch[1];
    
    // Get current month date range
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];
    
    console.log(`   📅 Fetching tides from ${startDate} to ${endDate}`);
    
    // Try to fetch from the API endpoint for the whole month
    const apiUrl = `https://mareespeche.com/spm/hlt?port=${portName}&date=${startDate}&utc=2`;
    
    try {
      const apiResponse = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Referer': url
        }
      });
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log('   📡 API Response:', JSON.stringify(apiData, null, 2));
        // If API returns data, use it
        if (apiData && Array.isArray(apiData)) {
          return parseApiData(apiData, portName, startDate);
        } else if (apiData) {
          console.log('   ⚠️  API returned data but not in expected format');
          return parseApiData([apiData], portName, startDate);
        }
      } else {
        console.log(`   ⚠️  API returned status: ${apiResponse.status}`);
      }
    } catch (apiError) {
      // If API fails, fall back to HTML parsing
      console.log('   ⚠️  API call failed, falling back to HTML parsing');
    }
    
    // Fallback: parse HTML
    const response = await fetch(url);
    const html = await response.text();
    
    // Try to extract from tabla_mareas_fondo2
    const tableMatch = html.match(/id="tabla_mareas_fondo2"[^>]*>([\s\S]*?)<\/table>/i);
    if (tableMatch) {
      console.log('   📊 Found tabla_mareas_fondo2, attempting to extract...');
      const tableContent = tableMatch[1];
      const tableResult = parseTableData(tableContent);
      if (tableResult && tableResult.days && tableResult.days[0].tides.length > 0) {
        return tableResult;
      }
      console.log('   ⚠️  Table found but empty, using text fallback');
    }
    
    const highTides: Array<{ time: string; height: string }> = [];
    const lowTides: Array<{ time: string; height: string }> = [];
    
    // Pattern for text like: "la première marée haute s'est produite à 5h11 et la suivante à 17h29"
    const highTideTextPattern = /marée haute[^\d]+(\d{1,2}h\d{2})[^\d]+suivante[^\d]+(\d{1,2}h\d{2})/i;
    const highMatch = highTideTextPattern.exec(html);
    
    if (highMatch) {
      highTides.push({ time: highMatch[1], height: 'N/A' });
      highTides.push({ time: highMatch[2], height: 'N/A' });
    }
    
    // Pattern for text like: "La première marée basse s'est produite à 11h15 et la suivante à 23h39"
    const lowTideTextPattern = /marée basse[^\d]+(\d{1,2}h\d{2})[^\d]+suivante[^\d]+(\d{1,2}h\d{2})/i;
    const lowMatch = lowTideTextPattern.exec(html);
    
    if (lowMatch) {
      lowTides.push({ time: lowMatch[1], height: 'N/A' });
      lowTides.push({ time: lowMatch[2], height: 'N/A' });
    }
    
    // Alternative: Try to find time-height pairs in the HTML
    const timeHeightPattern = /(\d{1,2}h\d{2})[^\d]*(\d+[.,]\d+)\s*m/g;
    let match;
    const allMatches: Array<{ time: string; height: string; index: number }> = [];
    
    while ((match = timeHeightPattern.exec(html)) !== null) {
      allMatches.push({
        time: match[1],
        height: match[2].replace(',', '.') + ' m',
        index: match.index
      });
    }
    
    // If we found time-height pairs, try to match them with our tides
    if (allMatches.length > 0) {
      for (const highTide of highTides) {
        const found = allMatches.find(m => m.time === highTide.time);
        if (found) {
          highTide.height = found.height;
        }
      }
      
      for (const lowTide of lowTides) {
        const found = allMatches.find(m => m.time === lowTide.time);
        if (found) {
          lowTide.height = found.height;
        }
      }
    }
    
    // Extract coefficient - look for "Aujourd'hui, le coefficient de marée est XXX"
    const coeffTodayPattern = /aujourd'hui[^\d]*coefficient[^\d]*(\d{2,3})/i;
    let coeffMatch = coeffTodayPattern.exec(html);
    
    // Fallback to any coefficient if today's not found
    if (!coeffMatch) {
      const coeffPattern = /coefficient[^\d]*(\d{2,3})/i;
      coeffMatch = coeffPattern.exec(html);
    }
    
    const coefficient = coeffMatch ? coeffMatch[1] : 'N/A';
    console.log('   🔍 Coefficient found:', coefficient);
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Combine all tides and sort by time
    const allTides = [
      ...highTides.map(t => ({ ...t, type: 'high' as const })),
      ...lowTides.map(t => ({ ...t, type: 'low' as const }))
    ].sort((a, b) => {
      const timeA = a.time.replace('h', ':');
      const timeB = b.time.replace('h', ':');
      return timeA.localeCompare(timeB);
    });
    
    return {
      days: [{
        date: today,
        coefficient,
        tides: allTides
      }]
    };
  } catch (error) {
    console.error(`Error fetching tide data from ${url}:`, error);
    return null;
  }
}

function parseTableData(tableHtml: string): any {
  const highTides: Array<{ time: string; height: string }> = [];
  const lowTides: Array<{ time: string; height: string }> = [];
  
  // Extract all rows from the table
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const rowContent = rowMatch[1];
    
    // Look for tide data: time and height in cells
    // Pattern: <td>time</td>....<td>height m</td>
    const cellRegex = /<td[^>]*>([^<]+)<\/td>/gi;
    const cells: string[] = [];
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      cells.push(cellMatch[1].trim());
    }
    
    // Check if this row contains tide data
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      // Look for time pattern (e.g., "5h11" or "05:11")
      const timeMatch = cell.match(/(\d{1,2})[h:](\d{2})/);
      if (timeMatch && i + 1 < cells.length) {
        const time = `${timeMatch[1]}h${timeMatch[2]}`;
        const nextCell = cells[i + 1];
        
        // Check if next cell contains height (e.g., "4.2 m" or "4,2m")
        const heightMatch = nextCell.match(/(\d+[.,]\d+)\s*m/);
        if (heightMatch) {
          const height = heightMatch[1].replace(',', '.') + ' m';
          
          // Determine if it's high or low tide by looking at surrounding text
          const rowText = rowContent.toLowerCase();
          if (rowText.includes('haute') || rowText.includes('high') || rowText.includes('pm')) {
            highTides.push({ time, height });
          } else if (rowText.includes('basse') || rowText.includes('low') || rowText.includes('bm')) {
            lowTides.push({ time, height });
          } else {
            // If no clear indicator, check the height value (higher = high tide)
            const heightValue = parseFloat(heightMatch[1].replace(',', '.'));
            if (heightValue > 2.5) {
              highTides.push({ time, height });
            } else {
              lowTides.push({ time, height });
            }
          }
        }
      }
    }
  }
  
  // Extract coefficient from table if available
  const coeffMatch = tableHtml.match(/coefficient[^\d]*(\d{2,3})/i);
  const coefficient = coeffMatch ? coeffMatch[1] : 'N/A';
  
  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  // Combine all tides and sort by time
  const allTides = [
    ...highTides.map(t => ({ ...t, type: 'high' as const })),
    ...lowTides.map(t => ({ ...t, type: 'low' as const }))
  ].sort((a, b) => {
    const timeA = a.time.replace('h', ':');
    const timeB = b.time.replace('h', ':');
    return timeA.localeCompare(timeB);
  });
  
  return {
    days: [{
      date: today,
      coefficient,
      tides: allTides
    }]
  };
}

function parseApiData(apiData: any[], portName: string, date: string): any {
  const highTides: Array<{ time: string; height: string }> = [];
  const lowTides: Array<{ time: string; height: string }> = [];
  
  // API returns array of tide events
  for (const event of apiData) {
    if (event.type === 'high' || event.type === 'PM') {
      highTides.push({
        time: event.time || event.hour || 'N/A',
        height: event.height ? `${event.height} m` : 'N/A'
      });
    } else if (event.type === 'low' || event.type === 'BM') {
      lowTides.push({
        time: event.time || event.hour || 'N/A',
        height: event.height ? `${event.height} m` : 'N/A'
      });
    }
  }
  
  // Extract coefficient if available
  const coefficient = apiData[0]?.coeff || apiData[0]?.coefficient || 'N/A';
  
  return { highTides, lowTides, coefficient };
}

async function fetchAllTides(cityFilter?: string) {
  const message = cityFilter 
    ? `🌊 Fetching tide data for ${cityFilter}...\n`
    : '🌊 Fetching tide data for all spots...\n';
  console.log(message);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Get all spots with mareespeche.com URLs
  let query = supabase
    .from('spots')
    .select('id, name, city, shom_station, shom_url')
    .not('shom_url', 'is', null)
    .like('shom_url', '%mareespeche.com%');
  
  // Filter by city if provided
  if (cityFilter) {
    query = query.eq('city', cityFilter);
  }
  
  const { data: spots, error } = await query;
  
  if (error) {
    console.error('❌ Error fetching spots:', error);
    return;
  }
  
  if (!spots || spots.length === 0) {
    console.log('⚠️  No spots found with mareespeche.com URLs');
    return;
  }
  
  console.log(`📍 Found ${spots.length} spots with tide data\n`);
  
  const results: TideData[] = [];
  
  for (const spot of spots) {
    console.log(`\n🔍 Fetching tide data for: ${spot.name} (${spot.city})`);
    console.log(`   URL: ${spot.shom_url}`);
    
    const tideData = await extractTideData(spot.shom_url);
    
    if (tideData && tideData.days && tideData.days.length > 0) {
      results.push({
        spotId: spot.id,
        spotName: spot.name,
        city: spot.city || 'Unknown',
        tideUrl: spot.shom_url,
        days: tideData.days,
        fetchedAt: new Date().toISOString(),
      });
      
      const today = tideData.days[0];
      console.log(`   ✅ Date: ${today.date}`);
      console.log(`   ✅ Coefficient: ${today.coefficient}`);
      console.log(`   ✅ Tides: ${today.tides.length}`);
      today.tides.forEach((tide: any) => {
        const icon = tide.type === 'high' ? '⬆️ ' : '⬇️ ';
        console.log(`      ${icon} ${tide.time} : ${tide.height} (${tide.type})`);
      });
    } else {
      console.log(`   ❌ Failed to fetch tide data`);
    }
    
    // Add a small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Display summary
  console.log('\n\n📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total spots processed: ${spots.length}`);
  console.log(`Successfully fetched: ${results.length}`);
  console.log(`Failed: ${spots.length - results.length}\n`);
  
  // Display detailed results
  if (results.length > 0) {
    console.log('\n📋 DETAILED RESULTS');
    console.log('='.repeat(80));
    
    results.forEach(result => {
      console.log(`\n${result.spotName} (${result.city})`);
      
      result.days.forEach(day => {
        console.log(`  📅 ${day.date}`);
        console.log(`  📊 Coefficient: ${day.coefficient}`);
        console.log(`  🌊 Tides:`);
        day.tides.forEach(tide => {
          const icon = tide.type === 'high' ? '⬆️ ' : '⬇️ ';
          console.log(`    ${icon} ${tide.time} : ${tide.height} (${tide.type})`);
        });
      });
    });
  }
  
  // Export to JSON
  const fs = await import('fs');
  const outputPath = 'tide-data.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n\n💾 Data exported to ${outputPath}`);
}

const cityName = process.argv[2];
fetchAllTides(cityName);
