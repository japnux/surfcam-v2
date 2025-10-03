# Vérification des données de marées Stormglass

## 🎯 Objectif

Ce guide vous permet de vérifier que Stormglass remonte bien les informations de marées dans votre base Supabase.

## 📋 Prérequis

1. Avoir exécuté la migration `supabase/migration_stormglass.sql`
2. Avoir configuré `STORMGLASS_API_KEY` dans vos variables d'environnement
3. Avoir activé au moins un spot avec `has_daily_forecast = true`
4. Avoir visité au moins une page de spot pour déclencher un appel API

## 🔍 Vérification dans Supabase

### Méthode 1 : Script SQL complet

1. Allez sur votre projet Supabase
2. Ouvrez **SQL Editor**
3. Copiez le contenu de `supabase/verify_tides_data.sql`
4. Exécutez le script

Le script affiche :
- ✅ Les spots avec Stormglass activé
- ✅ Le cache des prévisions avec marées
- ✅ Les détails des événements de marées (haute/basse)
- ✅ Les statistiques d'utilisation de l'API
- ✅ Un résumé global
- ✅ Les 2 prochaines marées pour chaque spot

### Méthode 2 : Requêtes rapides

#### Vérifier les spots avec Stormglass activé
```sql
SELECT name, has_daily_forecast 
FROM spots 
WHERE has_daily_forecast = true;
```

#### Vérifier le cache des marées
```sql
SELECT 
  s.name,
  sfc.source,
  sfc.fetched_at,
  jsonb_array_length(sfc.payload->'tides') as nb_marees
FROM spot_forecast_cache sfc
JOIN spots s ON s.id = sfc.spot_id
WHERE sfc.source = 'stormglass';
```

#### Voir les prochaines marées
```sql
SELECT 
  s.name,
  tide->>'time' as heure,
  tide->>'type' as type,
  tide->>'height' as hauteur_m
FROM spot_forecast_cache sfc
JOIN spots s ON s.id = sfc.spot_id
CROSS JOIN LATERAL jsonb_array_elements(sfc.payload->'tides') as tide
WHERE sfc.source = 'stormglass'
  AND (tide->>'time')::timestamp > NOW()
ORDER BY tide->>'time'
LIMIT 10;
```

## 📊 Structure des données

### Table `spot_forecast_cache`

Le payload JSONB contient :
```json
{
  "forecast": [...],  // Données météo/houle horaires
  "tides": [          // Événements de marées
    {
      "time": "2025-10-03T14:39:00Z",
      "type": "high",
      "height": 4.2
    },
    {
      "time": "2025-10-03T20:57:00Z",
      "type": "low",
      "height": 1.8
    }
  ],
  "meta": {
    "source": "stormglass",
    "cached_at": "2025-10-03T10:00:00Z",
    "station": {
      "name": "Biarritz",
      "distance": 2.5
    }
  }
}
```

### Table `stormglass_api_calls`

Tracking des appels API quotidiens :
- `call_date` : Date de l'appel
- `call_count` : Nombre d'appels effectués
- Limite : **10 appels/jour** (plan gratuit)

## 🔧 Dépannage

### Pas de données de marées dans le cache

**Causes possibles :**
1. Aucun spot n'a `has_daily_forecast = true`
2. Aucune page de spot n'a été visitée depuis l'activation
3. La clé API Stormglass est invalide
4. La limite quotidienne est atteinte

**Solutions :**
```sql
-- 1. Activer Stormglass sur un spot
UPDATE spots 
SET has_daily_forecast = true 
WHERE slug = 'votre-spot';

-- 2. Vérifier la limite API
SELECT * FROM stormglass_api_calls 
WHERE call_date = CURRENT_DATE;

-- 3. Vider le cache pour forcer un refresh
DELETE FROM spot_forecast_cache 
WHERE source = 'stormglass';
```

### Cache expiré

Le cache est valide **24 heures**. Après expiration :
- Le système tente de rafraîchir automatiquement
- Si la limite API est atteinte, l'ancien cache est utilisé
- Si aucun cache, fallback sur Open-Meteo (sans marées détaillées)

### Vérifier les logs

Dans Vercel ou en local :
```bash
# Rechercher les logs Stormglass
vercel logs | grep -i stormglass

# Ou en local
npm run dev
# Visitez une page de spot et observez la console
```

Logs attendus :
```
🎯 Attempting Stormglass for spot: Biarritz - Grande Plage
✅ Stormglass data fresh for: Biarritz - Grande Plage
🌊 Stormglass Tides: 28 events, 168 hourly points
```

## 🎨 Affichage frontend

Les marées sont affichées dans le nouveau composant `TideInfo` :
- **2 prochaines marées** avec icônes ↑ (haute) / ↓ (basse)
- **Coefficient de marée** (calculé à partir de l'amplitude)
- **Prochain lever/coucher de soleil**

## 📝 Notes importantes

1. **Chaque spot compte pour 2 appels API** :
   - 1 appel pour les prévisions météo/houle
   - 1 appel pour les marées

2. **Recommandation** : N'activez que **5 spots maximum** avec Stormglass

3. **Les marées proviennent de stations réelles** : Stormglass utilise la station la plus proche du spot

4. **Données disponibles** : 7 jours de marées (haute/basse) + niveau horaire

## 🔗 Ressources

- [Documentation Stormglass Tides](https://docs.stormglass.io/#/tide)
- [Fichier de migration](./supabase/migration_stormglass.sql)
- [Configuration Stormglass](./STORMGLASS_SETUP.md)
- [Système de cache](./STORMGLASS_CACHE_SYSTEM.md)
