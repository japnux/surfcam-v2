# Configuration Auth pour Vercel

## 🚀 Déploiement initial

### 1. Déployez sur Vercel

```bash
# Si pas encore fait
git add .
git commit -m "Fix auth callback for all flow types"
git push
```

Puis sur Vercel :
1. Importez votre repo GitHub
2. Laissez les paramètres par défaut
3. Cliquez **Deploy**

### 2. Variables d'environnement Vercel

Dans **Vercel Dashboard** → **Settings** → **Environment Variables**, ajoutez :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rshyglzcyeeqgkqkbpmw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key

# Site Config
NEXT_PUBLIC_SITE_URL=https://votre-projet.vercel.app
NEXT_PUBLIC_SITE_NAME=GoSurf Webcams

# Open-Meteo
OPEN_METEO_WEATHER_URL=https://api.open-meteo.com/v1/forecast
OPEN_METEO_MARINE_URL=https://marine-api.open-meteo.com/v1/marine

# Cache
FORECAST_CACHE_TTL=900

# Admin (ajoutez après premier login)
ADMIN_USER_IDS=
```

**Important** : Appliquez ces variables pour **Production**, **Preview** et **Development**.

## 🔐 Configuration Supabase pour Vercel

### 3. Configurer les Redirect URLs

Dans votre **Supabase Dashboard** :

#### A. Authentication → URL Configuration

**Site URL:**
```
https://votre-projet.vercel.app
```

**Redirect URLs** (ajoutez TOUTES ces lignes) :

```
# Production
https://votre-projet.vercel.app/**
https://votre-projet.vercel.app/auth/callback

# Preview deployments (IMPORTANT !)
https://*.vercel.app/**
https://*.vercel.app/auth/callback

# Local dev
http://localhost:3000/**
http://localhost:3000/auth/callback
```

⚠️ **Le wildcard `*.vercel.app` est crucial** pour que l'auth fonctionne sur les preview deployments !

#### B. Vérifier Email Auth

Dans **Authentication** → **Providers** :
- ✅ Email doit être activé
- Vérifiez le template d'email si besoin

### 4. Tester sur Vercel

1. Allez sur `https://votre-projet.vercel.app/auth/login`
2. Entrez votre email
3. Cliquez sur le lien dans l'email
4. Vous devriez être redirigé vers Vercel et connecté ✅

### 5. Configurer l'accès Admin

Une fois connecté :

1. Allez dans **Supabase** → **Authentication** → **Users**
2. Trouvez votre utilisateur et copiez l'**UUID** (ex: `a1b2c3d4-...`)
3. Dans **Vercel** → **Settings** → **Environment Variables**
4. Modifiez `ADMIN_USER_IDS` :
   ```
   ADMIN_USER_IDS=votre-uuid-ici
   ```
5. Redéployez : **Deployments** → **⋯** → **Redeploy**
6. Testez : `https://votre-projet.vercel.app/admin`

## 🌐 Avec un domaine custom

Si vous utilisez un domaine personnalisé (ex: `surfcam.com`) :

### 1. Ajouter le domaine dans Vercel
**Vercel** → **Settings** → **Domains** → Ajoutez votre domaine

### 2. Mettre à jour les variables
Dans Vercel, changez :
```env
NEXT_PUBLIC_SITE_URL=https://surfcam.com
```

### 3. Mettre à jour Supabase
Dans **Supabase** → **Authentication** → **URL Configuration** :

**Site URL:**
```
https://surfcam.com
```

**Redirect URLs** (ajoutez) :
```
https://surfcam.com/**
https://surfcam.com/auth/callback
https://www.surfcam.com/**
https://www.surfcam.com/auth/callback
```

### 4. Redéployez
```bash
# Depuis Vercel Dashboard
Deployments → ⋯ → Redeploy
```

## 🐛 Troubleshooting

### Erreur "Invalid redirect URL"
- Vérifiez que **toutes** les URLs sont dans Supabase Redirect URLs
- N'oubliez pas le wildcard `*.vercel.app/**`

### Magic link ne fonctionne pas
- Vérifiez que `NEXT_PUBLIC_SITE_URL` correspond à votre domaine réel
- Le lien doit pointer vers votre domaine Vercel, pas localhost

### Preview deployments cassés
- Assurez-vous d'avoir `https://*.vercel.app/**` dans Supabase
- Les variables d'env doivent être activées pour "Preview"

### Après redeploy, pas d'accès admin
- Vérifiez que `ADMIN_USER_IDS` est bien configuré
- Vérifiez que vous avez redéployé après la modification

## ✅ Checklist complète

- [ ] Code déployé sur Vercel
- [ ] Toutes les variables d'environnement ajoutées
- [ ] Supabase Site URL configurée
- [ ] Supabase Redirect URLs ajoutées (avec wildcards)
- [ ] Premier login réussi sur Vercel
- [ ] User UUID récupéré dans Supabase
- [ ] ADMIN_USER_IDS mis à jour dans Vercel
- [ ] Redéployé après config admin
- [ ] Accès à /admin confirmé

---

**Votre app est maintenant prête pour la production ! 🎉**
