# Vercel Cron Job Setup

Ce projet utilise Vercel Cron Jobs pour archiver automatiquement les commentaires de plus de 48h.

## Configuration

### 1. Générer un secret CRON_SECRET

```bash
# Génère un token aléatoire sécurisé
openssl rand -base64 32
```

### 2. Ajouter les variables d'environnement dans Vercel

Dans **Vercel Dashboard** → **Settings** → **Environment Variables**, ajoute :

- `CRON_SECRET` = le token généré ci-dessus

### 3. Le cron job est automatiquement activé

Le fichier `vercel.json` configure le cron :

```json
{
  "crons": [
    {
      "path": "/api/cron/archive-comments",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Schedule** : `0 * * * *` = Toutes les heures à la minute 0

## Fonctionnement

1. Vercel appelle `/api/cron/archive-comments` toutes les heures
2. L'endpoint vérifie le `CRON_SECRET` pour la sécurité
3. Appelle la fonction Supabase `archive_old_comments()`
4. Marque `is_archived = true` pour les commentaires > 48h

## Tester manuellement

```bash
curl -X GET https://your-domain.vercel.app/api/cron/archive-comments \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Monitoring

Les logs sont visibles dans **Vercel Dashboard** → **Deployments** → **Functions** → **Cron Jobs**

## Note

- Le cron job est **gratuit** sur Vercel (toutes les offres)
- Les commentaires archivés ne sont plus affichés mais restent en base de données
- Pour les supprimer définitivement, ajouter un autre cron job ou le faire manuellement
