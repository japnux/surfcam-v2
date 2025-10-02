# Configuration Stormglass

## Présentation

Stormglass est un service de prévisions météo et océanographiques premium qui fournit des données très précises pour le surf. Le plan gratuit est limité à **10 appels par jour**.

## API Key fournie

```
8311502a-9f5a-11f0-b07a-0242ac130006-831150fc-9f5a-11f0-b07a-0242ac130006
```

## Installation

### 1. Exécuter la migration SQL

Allez sur votre projet Supabase → SQL Editor et exécutez :

```sql
-- Contenu de supabase/migration_stormglass.sql
ALTER TABLE spots 
ADD COLUMN IF NOT EXISTS has_daily_forecast BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_spots_has_daily_forecast 
ON spots(has_daily_forecast) WHERE has_daily_forecast = true;
```

### 2. Ajouter la clé API dans les variables d'environnement

**Localement** (`.env.local`):
```bash
STORMGLASS_API_KEY=8311502a-9f5a-11f0-b07a-0242ac130006-831150fc-9f5a-11f0-b07a-0242ac130006
```

**Sur Vercel**:
1. Allez dans Settings → Environment Variables
2. Ajoutez `STORMGLASS_API_KEY` avec la clé ci-dessus
3. Redéployez le projet

## Utilisation

### Dans l'admin

1. Allez sur `/admin`
2. Pour chaque spot, vous verrez un bouton avec une icône ☁️ (CloudSun)
3. Cliquez dessus pour activer/désactiver le forecast quotidien Stormglass
4. **Maximum 10 spots** peuvent avoir le forecast activé (limite API)

### Données disponibles

Le système récupère automatiquement :

**Prévisions horaires** (7 jours) :
- 🌡️ Température de l'air (°C)
- 🌊 Température de l'eau (°C)
- 💨 Vent (km/h) avec direction
- 🌪️ Rafales (km/h)
- 🌊 Hauteur de houle (m) avec direction
- ⏱️ Période de houle (s)

**Marées** :
- Heures des marées hautes/basses
- Hauteur d'eau

## Endpoints API

### GET /api/stormglass

Récupère les prévisions pour un point géographique.

**Paramètres** :
- `lat` : Latitude (requis)
- `lng` : Longitude (requis)

**Exemple** :
```bash
curl "http://localhost:3000/api/stormglass?lat=43.48&lng=-1.56"
```

**Réponse** :
```json
{
  "forecast": [
    {
      "time": "2025-10-02T08:00:00Z",
      "airTemperature": 15,
      "waterTemperature": 18,
      "windSpeed": 20,
      "windDirection": 270,
      "gust": 30,
      "waveHeight": 1.5,
      "waveDirection": 290,
      "wavePeriod": 12
    }
  ],
  "tides": [
    {
      "time": "2025-10-02T06:15:00Z",
      "height": 4.2,
      "type": "high"
    }
  ],
  "meta": {
    "dailyQuota": 10,
    "cost": 1,
    "requestCount": 3
  }
}
```

## Cache

- Les données sont cachées pendant **24 heures**
- Le cache Next.js est utilisé pour minimiser les appels API
- Chaque spot avec `has_daily_forecast=true` compte pour 2 appels (forecast + marées)

## Limites et recommandations

### Limites du plan gratuit
- ✅ 10 appels par jour
- ✅ 7 jours de prévisions
- ✅ Données horaires
- ✅ Marées incluses

### Recommandations
1. **N'activez que 5 spots maximum** (2 appels par spot = 10 appels/jour)
2. Choisissez les spots les plus populaires
3. Les autres spots utiliseront Open-Meteo (gratuit, illimité mais moins précis)
4. Le cache de 24h évite de dépasser la limite

## Monitoring

Pour voir votre consommation API :
1. Allez sur [stormglass.io](https://stormglass.io)
2. Dashboard → API Usage
3. Vérifiez le nombre d'appels restants

## Troubleshooting

### Erreur "Daily quota exceeded"
- Vous avez dépassé les 10 appels quotidiens
- Attendez minuit (UTC) pour réinitialisation
- Désactivez temporairement certains spots

### Pas de données
- Vérifiez que `STORMGLASS_API_KEY` est bien configurée
- Vérifiez les logs serveur : `vercel logs`
- Testez l'API directement : [docs.stormglass.io](https://docs.stormglass.io)

## Documentation officielle

- [Stormglass API Docs](https://docs.stormglass.io)
- [Weather Point](https://docs.stormglass.io/#/weather)
- [Tide Extremes](https://docs.stormglass.io/#/tide)
