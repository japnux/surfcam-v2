import { createClient, createServiceClient } from '@/lib/supabase/server';

export interface Tide {
  time: string;
  height: string;
  type: 'high' | 'low';
}

export interface TideData {
  id: string;
  spot_id: string;
  date: string;
  coefficient: string;
  tides: Tide[];
  expires_at: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get tide data for a spot on a specific date
 * Returns cached data if available and not expired, otherwise fetches fresh data
 */
export async function getTidesForSpot(spotId: string, date?: string): Promise<TideData | null> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const supabase = await createClient();
  
  // Try to get cached data
  const { data: cachedTide, error: cacheError } = await supabase
    .from('tides')
    .select('*')
    .eq('spot_id', spotId)
    .eq('date', targetDate)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (!cacheError && cachedTide) {
    console.log(`[Tides] Using cached data for spot ${spotId} - Date: ${cachedTide.date}, Coefficient: ${cachedTide.coefficient}, Expires: ${cachedTide.expires_at}`);
    return cachedTide as TideData;
  }
  
  // No valid cache, fetch fresh data
  return await fetchAndCacheTides(spotId, targetDate);
}

/**
 * Get tide data for multiple days (for 48h forecast)
 */
export async function getTidesForSpotMultipleDays(spotId: string, days: number = 2): Promise<Tide[]> {
  const supabase = await createClient();
  const allTides: Tide[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const tideData = await getTidesForSpot(spotId, dateStr);
    if (tideData && tideData.tides) {
      allTides.push(...tideData.tides);
    }
  }
  
  return allTides;
}

/**
 * Fetch fresh tide data from mareespeche.com and cache it
 */
async function fetchAndCacheTides(spotId: string, date: string): Promise<TideData | null> {
  const serviceSupabase = await createServiceClient();
  
  // Get spot info
  const { data: spot, error: spotError } = await serviceSupabase
    .from('spots')
    .select('id, name, shom_url')
    .eq('id', spotId)
    .single();
  
  if (spotError || !spot || !spot.shom_url) {
    console.error('Spot not found or no tide URL:', spotError);
    return null;
  }
  
  try {
    // Extract tide data using API or HTML
    const tideData = await extractTideData(spot.shom_url);
    
    if (!tideData) {
      return null;
    }
    
    // Calculate expiration (next day at 00:00)
    const expiresAt = new Date(date);
    expiresAt.setDate(expiresAt.getDate() + 1);
    expiresAt.setHours(0, 0, 0, 0);
    
    // Upsert into database
    const { data: savedTide, error: saveError } = await serviceSupabase
      .from('tides')
      .upsert({
        spot_id: spotId,
        date: date,
        coefficient: tideData.coefficient,
        tides: tideData.tides,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'spot_id,date'
      })
      .select()
      .single();
    
    console.log(`[Tides] Fetched and cached new data for spot ${spotId} - Date: ${date}, Coefficient: ${tideData.coefficient}, Expires: ${expiresAt.toISOString()}`);
    
    if (saveError) {
      console.error('[Tides] Error saving tide data:', saveError);
      // Return the fetched data even if save fails
      return {
        id: '',
        spot_id: spotId,
        date: date,
        coefficient: tideData.coefficient,
        tides: tideData.tides,
        expires_at: expiresAt.toISOString(),
      };
    }
    
    return savedTide as TideData;
  } catch (error) {
    console.error('Error fetching tide data:', error);
    return null;
  }
}

/**
 * Extract tide data from HTML or API
 */
async function extractTideData(url: string): Promise<{ coefficient: string; tides: Tide[] } | null> {
  try {
    // Fetch HTML from URL
    const response = await fetch(url);
    const html = await response.text();
    
    // Parse HTML directly (API doesn't work)
    return extractTideDataFromHTML(html);
  } catch (error) {
    console.error('Error extracting tide data:', error);
    return null;
  }
}

/**
 * Extract tide data from HTML (fallback)
 */
function extractTideDataFromHTML(urlOrHtml: string): { coefficient: string; tides: Tide[] } | null {
  const html = urlOrHtml;
  const allTides: Tide[] = [];
  
  // Try to find all tide times in the format "Xh:XX am/pm" with heights
  // Pattern matches lines like: "12:17 am ▼ 0,3 m" or "6:24 am ▲ 4,6 m"
  const tidePattern = /(\d{1,2}):(\d{2})\s*(?:am|pm)?\s*[▼▲]?\s*(\d+[.,]\d+)\s*m/gi;
  let match;
  
  while ((match = tidePattern.exec(html)) !== null) {
    const hour = match[1];
    const minute = match[2];
    const height = parseFloat(match[3].replace(',', '.'));
    
    // Determine type based on height (high tide > 2.5m, low tide < 2.5m)
    const type = height > 2.5 ? 'high' : 'low';
    
    allTides.push({
      time: `${hour}h${minute}`,
      height: `${height} m`,
      type
    });
  }
  
  // If no tides found with the pattern above, try the old method
  if (allTides.length === 0) {
    const highTides: Array<{ time: string; height: string }> = [];
    const lowTides: Array<{ time: string; height: string }> = [];
    
    // Extract high tides
    const highTidePattern = /marée haute[^\d]+(\d{1,2}h\d{2})[^\d]+suivante[^\d]+(\d{1,2}h\d{2})/i;
    const highMatch = highTidePattern.exec(html);
    
    if (highMatch) {
      highTides.push({ time: highMatch[1], height: 'N/A' });
      highTides.push({ time: highMatch[2], height: 'N/A' });
    }
    
    // Extract low tides
    const lowTidePattern = /marée basse[^\d]+(\d{1,2}h\d{2})[^\d]+suivante[^\d]+(\d{1,2}h\d{2})/i;
    const lowMatch = lowTidePattern.exec(html);
    
    if (lowMatch) {
      lowTides.push({ time: lowMatch[1], height: 'N/A' });
      lowTides.push({ time: lowMatch[2], height: 'N/A' });
    }
    
    allTides.push(
      ...highTides.map(t => ({ ...t, type: 'high' as const })),
      ...lowTides.map(t => ({ ...t, type: 'low' as const }))
    );
  }
  
  // Extract coefficient - try "aujourd'hui" pattern first for today's coefficient
  const coeffTodayPattern = /aujourd'hui[^\d]*coefficient[^\d]*(\d{2,3})/i;
  let coeffMatch = coeffTodayPattern.exec(html);
  
  // Fallback to any coefficient if today's not found
  if (!coeffMatch) {
    const coeffPattern = /coefficient[^\d]*(\d{2,3})/i;
    coeffMatch = coeffPattern.exec(html);
  }
  
  const coefficient = coeffMatch ? coeffMatch[1] : 'N/A';
  
  // Sort tides by time
  allTides.sort((a, b) => {
    const timeA = a.time.replace('h', ':');
    const timeB = b.time.replace('h', ':');
    return timeA.localeCompare(timeB);
  });
  
  if (allTides.length === 0) {
    return null;
  }
  
  return { coefficient, tides: allTides };
}

/**
 * Get tides for multiple spots (useful for lists)
 */
export async function getTidesForSpots(spotIds: string[], date?: string): Promise<Map<string, TideData>> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const supabase = await createClient();
  
  // Get all cached tides
  const { data: cachedTides } = await supabase
    .from('tides')
    .select('*')
    .in('spot_id', spotIds)
    .eq('date', targetDate)
    .gt('expires_at', new Date().toISOString());
  
  const tidesMap = new Map<string, TideData>();
  
  if (cachedTides) {
    cachedTides.forEach(tide => {
      tidesMap.set(tide.spot_id, tide as TideData);
    });
  }
  
  // Fetch missing tides in background (don't await)
  const missingSpotIds = spotIds.filter(id => !tidesMap.has(id));
  if (missingSpotIds.length > 0) {
    // Fire and forget - these will be cached for next request
    Promise.all(
      missingSpotIds.map(spotId => fetchAndCacheTides(spotId, targetDate))
    ).catch(console.error);
  }
  
  return tidesMap;
}
