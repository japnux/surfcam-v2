# Authentification Email/Mot de passe ✅

## Changements effectués

J'ai converti le système d'authentification de **magic link** vers **email/mot de passe classique**.

### Fichiers modifiés

1. **`app/auth/login/login-form.tsx`** - Formulaire de connexion
   - Ajout du champ mot de passe
   - Appel API vers `/api/auth/login`

2. **`app/auth/login/page.tsx`** - Page de connexion
   - Texte mis à jour

### Nouveaux fichiers créés

3. **`app/auth/signup/page.tsx`** - Page d'inscription
4. **`app/auth/signup/signup-form.tsx`** - Formulaire d'inscription
5. **`app/api/auth/login/route.ts`** - API de connexion
6. **`app/api/auth/signup/route.ts`** - API d'inscription

## Configuration Supabase requise

### 1. Désactiver la confirmation email (Important)

Dans votre **Dashboard Supabase** :

1. Allez dans **Authentication** → **Providers** → **Email**
2. Désactivez **"Confirm email"**
3. Cliquez **Save**

Ceci permet aux utilisateurs de se connecter immédiatement après inscription sans vérifier leur email.

### 2. Vérifier Password Auth

Dans **Authentication** → **Providers** :
- ✅ Email doit être activé
- ✅ "Enable email provider" = ON

### 3. (Optionnel) Configuration des politiques de mot de passe

Par défaut Supabase requiert :
- Minimum 6 caractères
- Vous pouvez ajuster dans **Authentication** → **Policies**

## Comment tester

### 1. Créer un compte

```bash
# Démarrez le serveur
npm run dev
```

1. Allez sur http://localhost:3000/auth/signup
2. Entrez un email et mot de passe (min 6 caractères)
3. Cliquez "Créer mon compte"
4. Vous êtes automatiquement connecté et redirigé vers la page d'accueil ✅

### 2. Se connecter

1. Allez sur http://localhost:3000/auth/login
2. Entrez vos identifiants
3. Cliquez "Se connecter"
4. Vous êtes redirigé vers la page d'accueil ✅

### 3. Accéder à l'admin

1. Connectez-vous avec votre compte
2. Allez dans **Supabase** → **Authentication** → **Users**
3. Copiez votre **User UUID**
4. Dans `.env.local`, ajoutez :
   ```env
   ADMIN_USER_IDS=votre-uuid-ici
   ```
5. Redémarrez le serveur
6. Allez sur http://localhost:3000/admin ✅

## Pour Vercel (Production)

### Configuration identique :

1. **Supabase Dashboard**
   - Désactivez "Confirm email" dans Email provider
   - Vérifiez les Redirect URLs (toujours nécessaires pour le callback)

2. **Variables Vercel**
   - Toutes les mêmes variables que précédemment
   - `ADMIN_USER_IDS` à configurer après premier signup

3. **Plus besoin de s'embêter avec les magic links !** 🎉

## Avantages

✅ Plus simple pour les utilisateurs
✅ Connexion instantanée
✅ Pas de problème de liens expirés
✅ Fonctionne offline (après première connexion)
✅ Pas de dépendance email

## Notes de sécurité

- Minimum 6 caractères pour les mots de passe
- Supabase hash automatiquement les mots de passe
- Les sessions sont sécurisées via cookies httpOnly
- RLS policies toujours actives en base de données

---

**Votre authentification est maintenant prête ! 🚀**
