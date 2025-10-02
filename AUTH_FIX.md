# Fix Auth Magic Link

## Problème résolu ✅

Votre callback accepte maintenant **les deux formats** de magic link :
- ✅ Ancien format : `?token=xxx&type=magiclink`
- ✅ Nouveau format : `?token_hash=xxx&type=email`
- ✅ PKCE flow : `?code=xxx`

## Configuration Supabase requise

### 1. Vérifier les Redirect URLs

Dans votre dashboard Supabase :

1. Allez dans **Authentication** → **URL Configuration**
2. Vérifiez que ces URLs sont configurées :

**Site URL:**
```
http://localhost:3000
```

**Redirect URLs** (ajoutez si manquantes) :
```
http://localhost:3000/**
http://localhost:3000/auth/callback
```

### 2. Activer Email Auth

Dans **Authentication** → **Providers** :
- ✅ Email doit être activé
- Configurez les templates d'email si nécessaire

### 3. Tester la connexion

1. Arrêtez le serveur : `Ctrl+C`
2. Relancez : `npm run dev`
3. Allez sur http://localhost:3000/auth/login
4. Entrez votre email
5. Cliquez sur le lien dans l'email
6. Vous devriez être redirigé et connecté ✅

## Si ça ne marche toujours pas

### Option A : Vérifier les logs Supabase
1. Dashboard Supabase → **Logs** → **Auth Logs**
2. Cherchez les erreurs lors du clic sur le magic link

### Option B : Vérifier les paramètres du lien
Le lien devrait ressembler à :
```
https://[projet].supabase.co/auth/v1/verify?token=xxx&type=magiclink&redirect_to=http://localhost:3000/auth/callback
```

### Option C : Forcer PKCE (Recommandé pour production)

Dans votre code, changez le type de flow dans `app/api/auth/magic-link/route.ts` :

```typescript
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
    emailRedirectTo: `${config.siteUrl}/auth/callback`,
    shouldCreateUser: true, // Ajouter si nécessaire
  },
})
```

## Test rapide

Relancez votre serveur et essayez de vous connecter à nouveau.
