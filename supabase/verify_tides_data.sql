-- Script de vérification des données de marées Stormglass dans Supabase
-- Exécutez ce script dans le SQL Editor de Supabase

-- ============================================
-- 1. SPOTS AVEC STORMGLASS ACTIVÉ
-- ============================================
SELECT 
  'Spots avec Stormglass activé' as section,
  id,
  name,
  city,
  latitude,
  longitude,
  has_daily_forecast,
  is_active
FROM spots
WHERE has_daily_forecast = true
ORDER BY name;

-- ============================================
-- 2. CACHE DES PRÉVISIONS (avec marées)
-- ============================================
SELECT 
  'Cache des prévisions' as section,
  sfc.id,
  s.name as spot_name,
  sfc.source,
  sfc.fetched_at,
  sfc.valid_until,
  sfc.data_start,
  sfc.data_end,
  -- Vérifier si le payload contient des données de marées
  CASE 
    WHEN sfc.payload ? 'tides' THEN 'Oui'
    ELSE 'Non'
  END as has_tides,
  -- Compter le nombre d'événements de marées
  CASE 
    WHEN sfc.payload ? 'tides' THEN jsonb_array_length(sfc.payload->'tides')
    ELSE 0
  END as tide_events_count,
  -- Vérifier si le cache est encore valide
  CASE 
    WHEN sfc.valid_until > NOW() THEN 'Valide'
    ELSE 'Expiré'
  END as cache_status
FROM spot_forecast_cache sfc
JOIN spots s ON s.id = sfc.spot_id
WHERE sfc.source = 'stormglass'
ORDER BY sfc.fetched_at DESC;

-- ============================================
-- 3. DÉTAILS DES MARÉES DANS LE CACHE
-- ============================================
-- Affiche les 3 premiers événements de marées pour chaque spot
SELECT 
  'Détails des marées' as section,
  s.name as spot_name,
  tide_event->>'time' as tide_time,
  tide_event->>'type' as tide_type,
  tide_event->>'height' as tide_height_m
FROM spot_forecast_cache sfc
JOIN spots s ON s.id = sfc.spot_id
CROSS JOIN LATERAL jsonb_array_elements(sfc.payload->'tides') as tide_event
WHERE sfc.source = 'stormglass'
  AND sfc.payload ? 'tides'
ORDER BY s.name, tide_event->>'time'
LIMIT 20;

-- ============================================
-- 4. STATISTIQUES D'UTILISATION API
-- ============================================
SELECT 
  'Utilisation API Stormglass' as section,
  call_date,
  call_count,
  CASE 
    WHEN call_count >= 10 THEN 'Limite atteinte'
    ELSE CONCAT(10 - call_count, ' appels restants')
  END as status,
  last_reset_at,
  updated_at
FROM stormglass_api_calls
ORDER BY call_date DESC
LIMIT 7;

-- ============================================
-- 5. RÉSUMÉ GLOBAL
-- ============================================
SELECT 
  'Résumé global' as section,
  (SELECT COUNT(*) FROM spots WHERE has_daily_forecast = true) as spots_stormglass_actifs,
  (SELECT COUNT(*) FROM spot_forecast_cache WHERE source = 'stormglass') as caches_stormglass,
  (SELECT COUNT(*) FROM spot_forecast_cache WHERE source = 'stormglass' AND valid_until > NOW()) as caches_valides,
  (SELECT call_count FROM stormglass_api_calls WHERE call_date = CURRENT_DATE) as appels_aujourdhui,
  (SELECT 10 - COALESCE((SELECT call_count FROM stormglass_api_calls WHERE call_date = CURRENT_DATE), 0)) as appels_restants;

-- ============================================
-- 6. VÉRIFICATION DE LA STRUCTURE DES DONNÉES
-- ============================================
-- Affiche un exemple de payload complet pour inspection
SELECT 
  'Exemple de payload' as section,
  s.name as spot_name,
  jsonb_pretty(sfc.payload) as payload_structure
FROM spot_forecast_cache sfc
JOIN spots s ON s.id = sfc.spot_id
WHERE sfc.source = 'stormglass'
  AND sfc.payload ? 'tides'
LIMIT 1;

-- ============================================
-- 7. PROCHAINES MARÉES (calculées)
-- ============================================
-- Affiche les 2 prochaines marées pour chaque spot avec Stormglass
WITH next_tides AS (
  SELECT 
    s.name as spot_name,
    tide_event->>'time' as tide_time,
    tide_event->>'type' as tide_type,
    tide_event->>'height' as tide_height_m,
    ROW_NUMBER() OVER (PARTITION BY s.id ORDER BY tide_event->>'time') as rn
  FROM spot_forecast_cache sfc
  JOIN spots s ON s.id = sfc.spot_id
  CROSS JOIN LATERAL jsonb_array_elements(sfc.payload->'tides') as tide_event
  WHERE sfc.source = 'stormglass'
    AND sfc.payload ? 'tides'
    AND (tide_event->>'time')::timestamp > NOW()
)
SELECT 
  'Prochaines marées par spot' as section,
  spot_name,
  tide_time,
  tide_type,
  tide_height_m
FROM next_tides
WHERE rn <= 2
ORDER BY spot_name, tide_time;
