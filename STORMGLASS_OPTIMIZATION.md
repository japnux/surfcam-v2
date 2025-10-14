# 🌊 Optimisation Stormglass API

## Problème initial

Sur la page https://surfcam-v2.vercel.app/spots/bidart-plage-du-centre, les prévisions affichaient :
```
Source: Stormglass (cache - 08/10 15:26)
```

Alors que nous étions le **14 octobre** (6 jours d'écart).

## Causes identifiées

1. **Double appel API inutile** : Stormglass était appelé 2 fois par spot (forecast + tides)
2. **Limite quotidienne atteinte** : 10 appels/jour = seulement 5 spots/jour
3. **Cache expiré retourné** : Quand la limite était atteinte, le système retournait un vieux cache

## Solutions implémentées

### 1. ✅ Suppression de l'appel Tides Stormglass

**Fichier** : `lib/api/stormglass-cache.ts`

**Avant** :
```typescript
const [forecast, tides] = await Promise.all([
  getStormglassForecast(lat, lng),
  getStormglassTides(lat, lng),  // ← Inutile !
])

await incrementCallCount() // Forecast
await incrementCallCount() // Tides
const newCallCount = callCount + 2
```

**Après** :
```typescript
const forecast = await getStormglassForecast(lat, lng)

await incrementCallCount() // Forecast only
const newCallCount = callCount + 1
```

**Impact** : 
- **50% d'économie** sur les appels API Stormglass
- Passe de 5 spots/jour à **10 spots/jour**
- Les marées viennent maintenant de Mareepeche (gratuit et illimité)

---

### 2. ✅ Fallback vers Open-Meteo au lieu de cache expiré

**Fichier** : `lib/api/stormglass-cache.ts`

**Avant** :
```typescript
if (callCount >= DAILY_LIMIT) {
  // Return cached data even if expired, better than nothing
  if (cached) {
    return {
      data: cached.payload,  // ← Cache du 8 octobre !
      fromCache: true,
      callsRemaining: 0,
    }
  }
  return null
}
```

**Après** :
```typescript
if (callCount >= DAILY_LIMIT) {
  console.warn(`⚠️ Stormglass daily limit reached, falling back to Open-Meteo`)
  // Return null to trigger Open-Meteo fallback (better than expired cache)
  return null
}
```

**Impact** :
- Plus de vieux cache affiché
- Bascule automatique sur **Open-Meteo** (gratuit, illimité, données fraîches)
- Meilleure expérience utilisateur

---

### 3. ✅ Script de nettoyage du cache

**Fichier** : `scripts/clean-old-forecast-cache.ts`

Supprime automatiquement les caches de plus de 7 jours.

```bash
npx tsx scripts/clean-old-forecast-cache.ts
```

---

## Architecture finale

```
┌─────────────────────────────────────────────────────────────┐
│                     Page Spot                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  getForecast()   │
                    └──────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
    ┌────────────────────┐      ┌──────────────────┐
    │ Stormglass Cache   │      │   Open-Meteo     │
    │ (premium spots)    │      │   (fallback)     │
    └────────────────────┘      └──────────────────┘
                │
                ├─ Cache valide ? ✅ → Retourne cache
                ├─ Limite atteinte ? ⚠️ → Fallback Open-Meteo
                └─ Sinon → Fetch Stormglass (1 appel)

┌─────────────────────────────────────────────────────────────┐
│                     Marées                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   getTides()     │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Mareepeche     │
                    │  (gratuit 🎉)    │
                    └──────────────────┘
```

---

## Résultats

### Avant
- ❌ 2 appels API Stormglass par spot (forecast + tides)
- ❌ 5 spots max/jour avec limite de 10 appels
- ❌ Cache expiré affiché (6 jours d'écart)
- ❌ Mauvaise expérience utilisateur

### Après
- ✅ 1 appel API Stormglass par spot (forecast seulement)
- ✅ 10 spots max/jour
- ✅ Fallback automatique vers Open-Meteo (données fraîches)
- ✅ Marées gratuites via Mareepeche
- ✅ Meilleure expérience utilisateur

---

## Configuration

### Variables d'environnement
```bash
STORMGLASS_API_KEY=your-key
STORMGLASS_API_KEY_2=your-backup-key  # Optionnel
```

### Limite quotidienne
```typescript
// lib/api/stormglass-cache.ts
const DAILY_LIMIT = 10  // Ajustable selon votre plan
```

### Validité du cache
```typescript
// lib/api/stormglass-cache.ts
const CACHE_VALIDITY_HOURS = 24  // Cache valide 24h
const MIN_FORECAST_HOURS_AHEAD = 12  // Rafraîchit si < 12h restantes
```

---

## Monitoring

### Vérifier l'usage API
```typescript
import { getStormglassUsageStats } from '@/lib/api/stormglass-cache'

const stats = await getStormglassUsageStats()
// { used: 5, limit: 10, remaining: 5, percentage: 50 }
```

### Logs à surveiller
```
✅ Using cached Stormglass data for spot xxx
🌊 Fetching fresh Stormglass data for spot xxx (5/10)
⚠️ Stormglass daily limit reached (10/10), falling back to Open-Meteo
🌤️ Using Open-Meteo for spot: xxx
```

---

## Maintenance

### Nettoyer le vieux cache
```bash
npx tsx scripts/clean-old-forecast-cache.ts
```

### Vérifier les marées
```bash
npx tsx scripts/check-tide-data.ts
```

---

## Prochaines améliorations possibles

1. **Dashboard d'usage API** : Afficher les stats Stormglass dans l'admin
2. **Priorisation intelligente** : Utiliser Stormglass pour les spots premium/populaires
3. **Cache distribué** : Redis pour partager le cache entre instances Vercel
4. **Alertes** : Notification quand la limite approche (80%)

---

## Références

- **Stormglass API** : https://stormglass.io/
- **Open-Meteo API** : https://open-meteo.com/
- **Mareepeche** : https://mareespeche.com/
