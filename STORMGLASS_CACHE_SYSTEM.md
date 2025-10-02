# Système de Cache Intelligent Stormglass

## Vue d'ensemble

Le système gère automatiquement les appels API Stormglass en respectant la limite de **10 appels par jour** grâce à un cache intelligent en base de données.

## Logique de Cache

### Conditions de Validation

Le cache est considéré **valide** si :
1. ✅ Il existe en base de données
2. ✅ `valid_until` > maintenant (< 24h depuis le fetch)
3. ✅ `data_end` > maintenant + 12h (au moins 12h de prévisions restantes)

### Workflow

```
1. Spot affiché → getSpotForecast(spot)
2. Si has_daily_forecast = true → Tenter Stormglass
3. Vérifier cache valide → Oui ? Retourner cache
4. Vérifier limite API → OK ? Faire appel
5. Sauvegarder en cache
6. Si limite atteinte → Fallback Open-Meteo
```

## Configuration

```bash
# .env.local
STORMGLASS_API_KEY=8311502a-9f5a-11f0-b07a-0242ac130006-831150fc-9f5a-11f0-b07a-0242ac130006
```

## Constantes

- `DAILY_LIMIT = 10` appels/jour
- `CACHE_VALIDITY_HOURS = 24h`
- `MIN_FORECAST_HOURS_AHEAD = 12h`

## Utilisation

```typescript
// Dans un composant
const forecastData = await getSpotForecast(spot)

// Données disponibles
forecastData.forecast // Prévisions horaires
forecastData.tides    // Marées
forecastData.meta     // Métadonnées (source, cache, etc.)
```

## API Endpoints

### GET /api/stormglass?spotId=xxx&lat=xx&lng=xx
Prévisions avec cache intelligent

### GET /api/stormglass?stats=true
Statistiques d'utilisation

## Monitoring Admin

Le composant `<StormglassUsage />` affiche :
- Appels utilisés / limite
- Pourcentage d'utilisation
- Alertes si proche de la limite

## Stratégies

### 1. Sélection des Spots
- Max **5 spots** avec forecast activé
- 5 spots × 2 appels = 10 appels/jour

### 2. Cache Partagé
- 1 cache par spot
- Partagé entre tous les visiteurs
- Rafraîchi automatiquement si expiré

### 3. Fallback Intelligent
- Limite atteinte ? → Cache expiré si dispo
- Pas de cache ? → Open-Meteo
- Pas d'erreur visible pour l'utilisateur

## Dépannage

### Limite atteinte
```sql
-- Vérifier le compteur
SELECT * FROM stormglass_api_calls 
WHERE call_date = CURRENT_DATE;

-- Réinitialiser (dev only)
UPDATE stormglass_api_calls 
SET call_count = 0 
WHERE call_date = CURRENT_DATE;
```

### Cache pas mis à jour
1. Vérifier `has_daily_forecast = true` sur le spot
2. Vérifier logs serveur
3. Vérifier clé API

## Best Practices

✅ 5 spots maximum avec forecast  
✅ Monitoring régulier de l'usage  
✅ Logs activés pour debugging  
✅ Toujours utiliser le cache (jamais d'appel direct)
