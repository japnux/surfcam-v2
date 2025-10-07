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
    // Fetch tide data from mareespeche.com
    const response = await fetch(spot.shom_url);
    const html = await response.text();
    
    // Extract tide data
    const tideData = extractTideData(html);
    
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
 * Extract tide data from HTML
 */
function extractTideData(html: string): { coefficient: string; tides: Tide[] } | null {
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
  
  // Extract coefficient
  const coeffTodayPattern = /aujourd'hui[^\d]*coefficient[^\d]*(\d{2,3})/i;
  let coeffMatch = coeffTodayPattern.exec(html);
  
  if (!coeffMatch) {
    const coeffPattern = /coefficient[^\d]*(\d{2,3})/i;
    coeffMatch = coeffPattern.exec(html);
  }
  
  const coefficient = coeffMatch ? coeffMatch[1] : 'N/A';
  
  // Combine and sort tides
  const allTides: Tide[] = [
    ...highTides.map(t => ({ ...t, type: 'high' as const })),
    ...lowTides.map(t => ({ ...t, type: 'low' as const }))
  ].sort((a, b) => {
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
