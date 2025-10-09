import { createClient, createServiceClient } from '@/lib/supabase/server';
import { Tables, TablesInsert, TablesUpdate } from '@/lib/supabase/types';

export type Spot = Tables<'spots'>;
export type SpotInsert = TablesInsert<'spots'>;
export type SpotUpdate = TablesUpdate<'spots'>;

// Type pour les spots avec champs limités (optimisation)
export type SpotPreview = Pick<Spot, 'id' | 'name' | 'slug' | 'break_type' | 'level'>;

export async function getActiveSpots(limit?: number): Promise<SpotPreview[]> {
  const supabase = await createServiceClient();
  
  // Optimisation: sélectionner uniquement les champs nécessaires pour la page d'accueil
  let query = supabase
    .from('spots')
    .select('id, name, slug, break_type, level')
    .eq('is_active', true)
    .order('name');
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data as SpotPreview[];
}

export async function getSpotBySlug(slug: string) {
  const supabase = await createServiceClient();
  
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) throw error;
  return data;
}

export async function getAllSpots() {
  const supabase = await createServiceClient();
  
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
}

// Pour le sitemap - récupère uniquement les champs nécessaires
export async function getAllSpotsForSitemap() {
  const supabase = await createServiceClient();
  
  const { data, error } = await supabase
    .from('spots')
    .select('slug, updated_at')
    .eq('is_active', true)
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function searchSpots(query: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .rpc('search_spots_unaccent', { search_query: query });
  
  if (error) throw error;
  return data as Spot[];
}

export async function createSpot(spot: SpotInsert) {
  const supabase = await createServiceClient();
  
  const { data, error } = await supabase
    .from('spots')
    .insert(spot)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateSpot(id: string, spot: SpotUpdate) {
  const supabase = await createServiceClient();
  
  const { data, error } = await supabase
    .from('spots')
    .update(spot)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteSpot(id: string) {
  const supabase = await createServiceClient();
  
  const { error } = await supabase
    .from('spots')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function getCitiesGroupedByRegion() {
  const supabase = await createServiceClient();

  const { data: spots, error } = await supabase
    .from('spots')
    .select('city, region, country')
    .eq('is_active', true)
    .not('city', 'is', null)
    .not('region', 'is', null)
    .not('country', 'is', null);

  if (error) throw error;

  // Count spots per city and associate with region and country
  const cityCounts: { [key: string]: { region: string; country: string; count: number } } = {};
  for (const spot of spots) {
    if (spot.city && spot.region && spot.country) {
      if (!cityCounts[spot.city]) {
        cityCounts[spot.city] = { region: spot.region, country: spot.country, count: 0 };
      }
      cityCounts[spot.city].count++;
    }
  }

  // Group regions by country
  const countryGroups: { [key: string]: { [key: string]: { name: string; spotCount: number }[] } } = {};
  for (const cityName in cityCounts) {
    const cityData = cityCounts[cityName];
    if (!countryGroups[cityData.country]) {
      countryGroups[cityData.country] = {};
    }
    if (!countryGroups[cityData.country][cityData.region]) {
      countryGroups[cityData.country][cityData.region] = [];
    }
    countryGroups[cityData.country][cityData.region].push({ name: cityName, spotCount: cityData.count });
  }

  // Sort cities within each region
  for (const country in countryGroups) {
    for (const region in countryGroups[country]) {
      countryGroups[country][region].sort((a, b) => b.spotCount - a.spotCount);
    }
  }

  return countryGroups;
}

export async function getCities() {
  const supabase = await createServiceClient();
  
  const { data, error } = await supabase
    .from('spots')
    .select('city')
    .eq('is_active', true)
    .order('city');

  if (error) throw error;

  // Remove duplicates and nulls
  const cities = [...new Set(data.map(item => item.city).filter(Boolean))];
  
  return cities;
}

// Type pour les spots par ville (optimisation)
export type SpotCity = Pick<Spot, 'id' | 'name' | 'slug' | 'cam_url' | 'cam_type' | 'latitude'>;

export async function getSpotsByCity(city: string): Promise<SpotCity[]> {
  const supabase = await createServiceClient();
  
  // Optimisation: sélectionner uniquement les champs nécessaires pour la page ville
  const { data, error } = await supabase
    .from('spots')
    .select('id, name, slug, cam_url, cam_type, latitude')
    .eq('city', city)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data as SpotCity[] ?? [];
}

export async function getSpotsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .in('id', ids);
  
  if (error) throw error;
  return data;
}
