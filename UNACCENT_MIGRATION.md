# Migration: Recherche insensible aux accents

## Problème résolu
La recherche ne trouvait pas "Côte" quand on tapait "cote" (sans accent).

## Solution
Activation de l'extension PostgreSQL `unaccent` et création d'une fonction de recherche insensible aux accents.

## Comment appliquer la migration

### Option 1: Via l'interface Supabase (Recommandé)

1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Créez une nouvelle requête
5. Copiez-collez le contenu du fichier `supabase/migration_unaccent.sql`
6. Cliquez sur **Run**

### Option 2: Via CLI Supabase (si installé)

```bash
# Si vous avez Supabase CLI installé
npx supabase db push --db-url "postgresql://[YOUR_DB_URL]"
```

## Vérification

Après avoir appliqué la migration, testez la recherche:
- Tapez "cote" → devrait trouver les spots avec "Côte"
- Tapez "biarritz" → devrait trouver "Biarritz"
- Tapez "sauvage" → devrait trouver "Sauvage"

## Fichiers modifiés

- ✅ `supabase/schema.sql` - Ajout de l'extension unaccent et de la fonction
- ✅ `supabase/migration_unaccent.sql` - Migration standalone
- ✅ `lib/data/spots.ts` - Utilisation de la fonction RPC au lieu de `.or()`

## Rollback (si nécessaire)

Pour revenir en arrière:

```sql
-- Supprimer la fonction
DROP FUNCTION IF EXISTS search_spots_unaccent(TEXT);

-- Désactiver l'extension (optionnel)
DROP EXTENSION IF EXISTS unaccent CASCADE;
```

Puis dans `lib/data/spots.ts`, revenir à:
```typescript
export async function searchSpots(query: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('spots')
    .select('*')
    .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
    .order('name')
  
  if (error) throw error
  return data
}
```
