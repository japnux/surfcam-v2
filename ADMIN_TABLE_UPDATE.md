# 📊 Mise à jour du tableau Admin

## Changements effectués

### 1. Nouveau tableau avec timestamps des sources

**Fichier** : `components/admin/spots-table.tsx`

Le nouveau tableau affiche pour chaque spot :
- **Nom** + région
- **Source Forecast** (Stormglass/Open-Meteo) + timestamp de dernière mise à jour
- **Source Marées** (Mareepeche) + timestamp de dernière mise à jour
- **Statut** (Actif/Inactif) avec toggle
- **Actions** (Voir, Tester, Éditer, Supprimer)

### 2. Fonction pour récupérer les données

**Fichier** : `lib/data/admin-spots.ts`

```typescript
export interface SpotWithSources extends Spot {
  forecast_source: 'stormglass' | 'open-meteo' | null
  forecast_cached_at: string | null
  tide_source: 'mareepeche' | null
  tide_updated_at: string | null
}

export async function getSpotsWithSources(): Promise<SpotWithSources[]>
```

Cette fonction :
- Récupère tous les spots
- Joint les données de `spot_forecast_cache` pour les timestamps forecast
- Joint les données de `tides` pour les timestamps marées
- Retourne un tableau enrichi avec toutes les infos

### 3. Composants UI créés

**Fichiers** :
- `components/ui/table.tsx` - Composant Table shadcn/ui
- `components/ui/badge.tsx` - Composant Badge shadcn/ui

### 4. Page admin mise à jour

**Fichier** : `app/admin/page.tsx`

Remplace `AdminSpotsList` par `SpotsTable` avec les nouvelles données.

## Aperçu du tableau

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Nom              │ Forecast              │ Marées              │ Statut │ ... │
├──────────────────────────────────────────────────────────────────────────────┤
│ Biarritz         │ [Stormglass] [Toggle] │ [Mareepeche]        │ [✓]    │ ... │
│ Côte des Basques │ 14/10 15:09           │ 14/10 01:00         │        │     │
│                  │ (il y a 2h)           │ (il y a 14h)        │        │     │
├──────────────────────────────────────────────────────────────────────────────┤
│ Hossegor         │ [Open-Meteo] [Toggle] │ [Mareepeche]        │ [✓]    │ ... │
│ La Gravière      │ -                     │ 14/10 01:00         │        │     │
│                  │                       │ (il y a 14h)        │        │     │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Fonctionnalités

### Affichage des timestamps

```typescript
function formatTimestamp(timestamp: string | null): string {
  // Affiche : "14/10 15:09 (il y a 2h)"
  // Ou : "-" si pas de données
}
```

### Filtres

1. **Par statut** : Tous / Actifs / Inactifs
2. **Par source forecast** : Toutes sources / Stormglass / Open-Meteo

### Actions rapides

- **👁️ Voir** : Ouvre le spot dans un nouvel onglet
- **🧪 Tester** : Page de test du spot
- **✏️ Éditer** : Modifier le spot
- **🗑️ Supprimer** : Supprimer le spot

### Toggles inline

- **Statut** : Activer/Désactiver le spot
- **Forecast** : Basculer entre Stormglass et Open-Meteo

## Informations affichées

### Colonne Forecast
- Badge avec la source (Stormglass ou Open-Meteo)
- Toggle pour changer la source
- Timestamp de dernière mise à jour du cache
- Temps relatif (il y a Xh/Xj)

### Colonne Marées
- Badge "Mareepeche" si données disponibles
- Timestamp de dernière mise à jour
- Temps relatif (il y a Xh/Xj)
- "Aucune donnée" si pas de marées

## Avantages

✅ **Vue d'ensemble complète** : Toutes les infos en un coup d'œil
✅ **Monitoring facile** : Voir quels spots ont des données fraîches
✅ **Debug rapide** : Identifier les spots avec données obsolètes
✅ **Actions rapides** : Toggles et boutons directement dans le tableau
✅ **Filtres puissants** : Trier par statut et source

## Utilisation

### Identifier les problèmes

**Forecast obsolète** :
```
Stormglass
14/10 01:00 (il y a 14h)  ← Plus de 12h, sera rafraîchi au prochain accès
```

**Marées manquantes** :
```
Aucune donnée  ← Vérifier le shom_url du spot
```

**Spot inactif** :
```
[✗] Inactif  ← Ne sera pas affiché sur le site
```

### Basculer un spot vers Open-Meteo

1. Cliquer sur le toggle "Forecast"
2. Le spot utilisera Open-Meteo (gratuit, illimité)
3. Le cache Stormglass sera conservé mais non utilisé

### Rafraîchir les données

Les données se rafraîchissent automatiquement :
- **Forecast** : Au prochain accès si cache > 24h ou < 12h de prévisions
- **Marées** : Chaque jour à 1h du matin (cron Vercel)

## Prochaines améliorations possibles

1. **Indicateur de fraîcheur** : Badge rouge/orange/vert selon l'âge des données
2. **Bouton refresh manuel** : Forcer le rafraîchissement d'un spot
3. **Stats globales** : Nombre de spots avec données fraîches/obsolètes
4. **Tri par colonne** : Cliquer sur l'en-tête pour trier
5. **Export CSV** : Exporter la liste des spots avec leurs stats

## Notes techniques

### Performance

La requête `getSpotsWithSources()` fait 3 appels DB :
1. Récupérer tous les spots
2. Récupérer les caches forecast
3. Récupérer les données marées

Optimisation possible : Utiliser une vue SQL ou un JOIN pour réduire à 1 requête.

### Revalidation

```typescript
export const revalidate = 0 // Always fresh
```

La page admin ne cache jamais les données pour toujours afficher l'état actuel.
