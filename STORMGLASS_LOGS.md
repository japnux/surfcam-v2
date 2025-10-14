# 📊 Système de Logs Stormglass

## Vue d'ensemble

Système complet de logging pour tous les appels à l'API Stormglass, permettant de monitorer l'utilisation, débugger les erreurs et optimiser les coûts.

## 🗄️ Base de données

### Table `stormglass_logs`

```sql
CREATE TABLE stormglass_logs (
  id UUID PRIMARY KEY,
  spot_id UUID REFERENCES spots(id),
  endpoint TEXT NOT NULL,           -- 'forecast' ou 'tides'
  status TEXT NOT NULL,              -- 'success', 'error', 'quota_exceeded'
  response_summary JSONB,            -- Résumé de la réponse
  error_message TEXT,                -- Message d'erreur si échec
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Index
- `idx_stormglass_logs_spot_id` : Recherche par spot
- `idx_stormglass_logs_created_at` : Tri chronologique
- `idx_stormglass_logs_status` : Filtrage par statut

## 📝 Logging automatique

### Cas loggés

#### 1. Succès
```typescript
{
  spotId: "uuid",
  endpoint: "forecast",
  status: "success",
  responseSummary: {
    hoursCount: 48,
    dataStart: "2025-10-14T00:00:00Z",
    dataEnd: "2025-10-16T00:00:00Z",
    source: "stormglass"
  },
  latitude: 43.4832,
  longitude: -1.5586
}
```

#### 2. Erreur
```typescript
{
  spotId: "uuid",
  endpoint: "forecast",
  status: "error",
  errorMessage: "Failed to fetch forecast",
  latitude: 43.4832,
  longitude: -1.5586
}
```

#### 3. Quota dépassé
```typescript
{
  spotId: "uuid",
  endpoint: "forecast",
  status: "quota_exceeded",
  errorMessage: "Daily limit reached (10/10)",
  latitude: 43.4832,
  longitude: -1.5586
}
```

## 🖥️ Interface Admin

### Page `/admin/stormglass-logs`

#### Stats en temps réel
- **Total aujourd'hui** : Nombre total d'appels
- **Succès** : Appels réussis (badge vert)
- **Erreurs** : Appels échoués (badge rouge)
- **Quota dépassé** : Limite atteinte (badge orange)

#### Tableau des logs
Affiche les 100 derniers appels avec :
- **Date** : Timestamp + temps relatif (il y a Xmin/Xh)
- **Spot** : Nom du spot (cliquable)
- **Endpoint** : forecast ou tides
- **Statut** : Badge coloré selon le résultat
- **Résumé** : 
  - Si succès : "48 heures • 14/10 → 16/10"
  - Si erreur : Message d'erreur en rouge
- **Coordonnées** : Lat/Lng utilisées
- **Actions** : Bouton pour voir le spot

## 🔍 Cas d'usage

### 1. Identifier les spots problématiques

**Rechercher** : Spots avec beaucoup d'erreurs
```sql
SELECT spots.name, COUNT(*) as error_count
FROM stormglass_logs
JOIN spots ON spots.id = stormglass_logs.spot_id
WHERE status = 'error'
GROUP BY spots.name
ORDER BY error_count DESC;
```

### 2. Analyser l'utilisation quotidienne

**Voir** : Répartition des appels par heure
```sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as calls,
  COUNT(*) FILTER (WHERE status = 'success') as success,
  COUNT(*) FILTER (WHERE status = 'error') as errors
FROM stormglass_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

### 3. Vérifier les dépassements de quota

**Filtrer** : Appels bloqués par la limite
```sql
SELECT created_at, spots.name, error_message
FROM stormglass_logs
JOIN spots ON spots.id = stormglass_logs.spot_id
WHERE status = 'quota_exceeded'
ORDER BY created_at DESC;
```

## 📈 Monitoring

### Métriques importantes

1. **Taux de succès** : `success / total * 100`
2. **Taux d'erreur** : `error / total * 100`
3. **Utilisation quota** : `total / DAILY_LIMIT * 100`

### Alertes recommandées

- ⚠️ **Taux d'erreur > 10%** : Problème avec l'API
- ⚠️ **Quota > 80%** : Risque de dépassement
- ⚠️ **Même spot en erreur > 3 fois** : Coordonnées invalides ?

## 🛠️ Fonctions utilitaires

### `logStormglassCall()`
```typescript
await logStormglassCall({
  spotId: "uuid",
  endpoint: "forecast",
  status: "success",
  responseSummary: { ... },
  latitude: 43.4832,
  longitude: -1.5586
})
```

### `getStormglassLogs(limit)`
```typescript
const logs = await getStormglassLogs(100)
// Retourne les 100 derniers logs avec les infos du spot
```

### `getStormglassLogsStats()`
```typescript
const stats = await getStormglassLogsStats()
// {
//   today: {
//     total: 8,
//     success: 6,
//     error: 1,
//     quota_exceeded: 1
//   }
// }
```

## 🔐 Sécurité

### RLS (Row Level Security)

- **Lecture** : Uniquement les admins
- **Écriture** : Uniquement le service role (backend)

```sql
-- Policy lecture
CREATE POLICY "Admins can read stormglass logs"
  ON stormglass_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
```

## 📊 Exemples de visualisation

### Dashboard idéal

```
┌─────────────────────────────────────────────────────────────┐
│ Aujourd'hui                                                  │
├─────────────────────────────────────────────────────────────┤
│ Total: 8    Succès: 6 ✅    Erreurs: 1 ❌    Quota: 1 ⚠️   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Logs récents                                                 │
├──────────────┬──────────────┬──────────┬──────────┬─────────┤
│ Date         │ Spot         │ Endpoint │ Statut   │ Résumé  │
├──────────────┼──────────────┼──────────┼──────────┼─────────┤
│ 14/10 15:23  │ Biarritz     │ forecast │ ✅ Succès│ 48h     │
│ (il y a 2min)│              │          │          │ 14→16/10│
├──────────────┼──────────────┼──────────┼──────────┼─────────┤
│ 14/10 15:20  │ Hossegor     │ forecast │ ⚠️ Quota │ Limite  │
│ (il y a 5min)│              │          │          │ atteinte│
└──────────────┴──────────────┴──────────┴──────────┴─────────┘
```

## 🚀 Améliorations futures

1. **Graphiques** : Visualisation des appels par heure/jour
2. **Export** : Télécharger les logs en CSV
3. **Filtres avancés** : Par spot, par statut, par période
4. **Notifications** : Email/Slack quand quota > 80%
5. **Rétention** : Nettoyage automatique des logs > 30 jours
6. **Analytics** : Spots les plus consultés, heures de pic

## 📝 Maintenance

### Nettoyer les vieux logs

```sql
-- Supprimer les logs de plus de 30 jours
DELETE FROM stormglass_logs
WHERE created_at < NOW() - INTERVAL '30 days';
```

### Script de nettoyage automatique

```typescript
// scripts/clean-old-logs.ts
const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

await supabase
  .from('stormglass_logs')
  .delete()
  .lt('created_at', thirtyDaysAgo.toISOString())
```

## 🎯 Objectifs

- ✅ **Transparence** : Voir exactement quand et comment l'API est utilisée
- ✅ **Debug** : Identifier rapidement les problèmes
- ✅ **Optimisation** : Réduire les appels inutiles
- ✅ **Coûts** : Monitorer l'utilisation pour éviter les dépassements
- ✅ **Performance** : Analyser les temps de réponse (future feature)

## 📚 Références

- Migration : `supabase/migrations/005_stormglass_logs.sql`
- Logger : `lib/api/stormglass-logger.ts`
- Cache : `lib/api/stormglass-cache.ts`
- Page admin : `app/admin/stormglass-logs/page.tsx`
- Composant : `components/admin/stormglass-logs-table.tsx`
