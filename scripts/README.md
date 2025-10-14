# 🛠️ Scripts utilitaires

Scripts de maintenance et debug pour le système de marées.

## 📋 Scripts disponibles

### 🌊 Fetch des marées

#### `fetch-all-tides.ts` - **Script principal**
Récupère et sauvegarde les marées pour tous les spots actifs.

```bash
npx tsx scripts/fetch-all-tides.ts
```

**Utilisation** :
- Fetch manuel de toutes les marées
- Populate la base de données
- Alternative au cron job automatique

**Résultat** : 39/45 spots (87% succès)

---

#### `force-fetch-tide.ts`
Fetch les marées pour un spot spécifique (Biarritz par défaut).

```bash
npx tsx scripts/force-fetch-tide.ts
```

**Utilisation** :
- Debug d'un spot spécifique
- Test du parsing HTML
- Vérification du coefficient

---

### 🔍 Vérification

#### `check-tide-data.ts`
Vérifie les données de marées en DB pour Biarritz.

```bash
npx tsx scripts/check-tide-data.ts
```

**Affiche** :
- Coefficient
- Date d'expiration
- Horaires des marées
- Statut (valide/expiré)

---

#### `refresh-tides.ts`
Vérifie que toutes les URLs Mareespeche.com sont accessibles.

```bash
npx tsx scripts/refresh-tides.ts
```

**Affiche** :
- Liste des 45 spots
- Statut HTTP de chaque URL
- Spots avec erreurs 404

---

### 🧹 Maintenance

#### `clean-expired-tides.ts`
Supprime les données de marées expirées de la DB.

```bash
npx tsx scripts/clean-expired-tides.ts
```

**Utilisation** :
- Nettoyer les vieilles données
- Forcer un nouveau fetch
- Maintenance DB

---

#### `clean-old-forecast-cache.ts`
Supprime les caches de prévisions Stormglass de plus de 7 jours.

```bash
npx tsx scripts/clean-old-forecast-cache.ts
```

**Utilisation** :
- Nettoyer les vieux caches Stormglass
- Libérer de l'espace DB
- Maintenance préventive

---

#### `delete-all-tides.ts`
Supprime **TOUTES** les données de marées.

```bash
npx tsx scripts/delete-all-tides.ts
```

⚠️ **ATTENTION** : Supprime toutes les marées !

**Utilisation** :
- Reset complet de la DB
- Avant un nouveau fetch global
- Debug système

---

## 🔄 Workflow typique

### Populate initial
```bash
npx tsx scripts/fetch-all-tides.ts
```

### Vérifier les données
```bash
npx tsx scripts/check-tide-data.ts
```

### Nettoyer les données expirées
```bash
npx tsx scripts/clean-expired-tides.ts
```

### Vérifier les URLs
```bash
npx tsx scripts/refresh-tides.ts
```

---

## 📊 Statistiques

- **6 scripts** maintenus
- **11 scripts** supprimés (setup/migrations/debug ponctuels)
- **Taux de succès** : 87% (39/45 spots)

---

## 🤖 Automatisation

Le cron job Vercel (`/api/cron/fetch-tides`) remplace l'exécution manuelle de `fetch-all-tides.ts`.

**Fréquence** : Tous les jours à 1h du matin (UTC)

Voir `TIDE_SYSTEM.md` pour plus de détails.
