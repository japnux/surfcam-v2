# 🌊 Système de Marées

## Vue d'ensemble

Le système récupère automatiquement les horaires de marées depuis Mareespeche.com pour tous les spots actifs.

## 🔄 Automatisation

### Cron Job Vercel

**Fréquence** : Tous les jours à 1h du matin (UTC)  
**Configuration** : `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch-tides",
      "schedule": "0 1 * * *"
    }
  ]
}
```

### API Route

**Endpoint** : `/api/cron/fetch-tides`  
**Méthode** : GET  
**Auth** : Bearer token via `CRON_SECRET`

Le cron job :
1. Récupère tous les spots actifs avec `shom_url`
2. Fetch le HTML de Mareespeche.com
3. Parse les horaires de marées (PM/BM)
4. Extrait le coefficient du jour
5. Sauvegarde dans la table `tides`

## 📊 Données stockées

**Table** : `tides`

| Champ | Type | Description |
|-------|------|-------------|
| spot_id | UUID | ID du spot |
| date | DATE | Date des marées |
| coefficient | TEXT | Coefficient de marée (20-120) |
| tides | JSONB | Array des horaires [{time, type, height}] |
| expires_at | TIMESTAMP | Expiration (lendemain à 00:00) |
| updated_at | TIMESTAMP | Dernière mise à jour |

## 🔍 Parsing HTML

### Pattern des marées

```regex
Marée haute: /marée haute[^\d]+(\d{1,2}h\d{2})[^\d]+suivante[^\d]+(\d{1,2}h\d{2})/i
Marée basse: /marée basse[^\d]+(\d{1,2}h\d{2})[^\d]+suivante[^\d]+(\d{1,2}h\d{2})/i
```

### Pattern du coefficient

```regex
Priorité: /aujourd'hui[^\d]*coefficient[^\d]*(\d{2,3})/i
Fallback: /coefficient[^\d]*(\d{2,3})/i
```

## 🛠️ Scripts disponibles

### Fetch manuel de tous les spots
```bash
npx tsx scripts/fetch-all-tides.ts
```

### Fetch d'un spot spécifique (Biarritz)
```bash
npx tsx scripts/force-fetch-tide.ts
```

### Vérifier les données
```bash
npx tsx scripts/check-tide-data.ts
npx tsx scripts/check-tide-moliets.ts
```

### Nettoyer les données expirées
```bash
npx tsx scripts/clean-expired-tides.ts
```

### Supprimer toutes les marées
```bash
npx tsx scripts/delete-all-tides.ts
```

## 📝 Configuration Vercel

### Variables d'environnement requises

```bash
CRON_SECRET=your-random-secret-string
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Activation du cron

1. Déployer sur Vercel
2. Le cron s'active automatiquement
3. Vérifier dans Vercel Dashboard > Cron Jobs

## 🎯 Taux de succès

**Actuel** : 87% (39/45 spots)

**Échecs connus** :
- Spots Bretagne/Normandie : URLs 404 ou format HTML différent
- Spots sans données : Pas de marées disponibles

## 🔄 Fallback

Si le cron échoue ou si les données sont expirées :
1. Le composant `TideInfo` affiche un avertissement "⚠️ Expiré"
2. Les données expirées restent affichées (mieux que rien)
3. Le prochain cron mettra à jour les données

## 📈 Monitoring

Vérifier les logs du cron dans Vercel Dashboard :
- Nombre de spots traités
- Taux de succès/échec
- Erreurs détaillées

## 🚀 Déploiement

```bash
git add -A
git commit -m "feat: add automated tide fetching with Vercel cron"
git push
```

Vercel déploiera automatiquement et activera le cron job.
