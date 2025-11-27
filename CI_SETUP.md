# 🚀 Configuration CI/CD - Groovr

Ce guide vous accompagne dans la configuration complète de votre pipeline CI/CD GitHub Actions.

## 📋 Table des matières

1. [Installation des dépendances](#installation-des-dépendances)
2. [Configuration des secrets GitHub](#configuration-des-secrets-github)
3. [Mise à jour du badge CI](#mise-à-jour-du-badge-ci)
4. [Test du pipeline](#test-du-pipeline)
5. [Dépannage](#dépannage)

## Installation des dépendances

Installez les nouvelles dépendances de test :

```bash
npm install
```

Cette commande installera :
- **Vitest** : Framework de test unitaire rapide
- **Playwright** : Framework de test E2E
- **Testing Library** : Utilitaires pour tester React

## Configuration des secrets GitHub

### 1. Accéder aux secrets

1. Allez sur votre repository GitHub
2. Cliquez sur **Settings** > **Secrets and variables** > **Actions**
3. Cliquez sur **New repository secret**

### 2. Secrets requis

Ajoutez les secrets suivants (utilisez vos valeurs Firebase) :

| Nom du secret | Description | Exemple |
|--------------|-------------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Clé API Firebase | `AIzaSyC...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Domaine d'authentification | `groovr-xxx.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID du projet Firebase | `groovr-xxx` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de stockage | `groovr-xxx.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ID de l'expéditeur | `123456789` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ID de l'application | `1:123:web:abc` |
| `SPOTIFY_CLIENT_ID` | Client ID Spotify (optionnel) | `abc123...` |
| `SPOTIFY_CLIENT_SECRET` | Client Secret Spotify (optionnel) | `def456...` |

> **Note** : Même si ces variables commencent par `NEXT_PUBLIC_`, il est recommandé de les stocker en tant que secrets pour une meilleure sécurité en CI/CD.

### 3. Où trouver vos credentials Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet Groovr
3. Allez dans **⚙️ Paramètres du projet**
4. Scrollez jusqu'à **Vos applications** > Sélectionnez votre application web
5. Copiez les valeurs de configuration

## Mise à jour du badge CI

Dans [README.md](README.md), remplacez `YOUR_USERNAME` par votre nom d'utilisateur GitHub :

```markdown
[![CI](https://github.com/YOUR_USERNAME/groovr/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/groovr/actions/workflows/ci.yml)
```

Par exemple, si votre username est `johndoe` :

```markdown
[![CI](https://github.com/johndoe/groovr/actions/workflows/ci.yml/badge.svg)](https://github.com/johndoe/groovr/actions/workflows/ci.yml)
```

## Test du pipeline

### 1. Premier déclenchement

Le pipeline se déclenchera automatiquement lors du prochain push :

```bash
git add .
git commit -m "ci: setup GitHub Actions pipeline"
git push
```

### 2. Vérifier l'exécution

1. Allez sur votre repository GitHub
2. Cliquez sur l'onglet **Actions**
3. Vous devriez voir votre workflow "CI" en cours d'exécution

### 3. Jobs exécutés

Le pipeline comprend 4 jobs :

| Job | Description | Durée estimée |
|-----|-------------|---------------|
| **Lint & Type Check** | Vérifie la qualité du code | ~2 min |
| **Unit Tests** | Exécute les tests unitaires | ~2 min |
| **Build** | Compile l'application | ~3 min |
| **E2E Tests** | Tests end-to-end (uniquement sur PR) | ~5 min |

### 4. Test en local

Avant de pusher, testez en local :

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Tests unitaires
npm run test

# Build
npm run build

# Tests E2E (nécessite un build)
npm run test:e2e
```

## Structure du pipeline

### Déclencheurs

Le pipeline s'exécute sur :
- **Push** vers `main`, `develop`, `feature/*`
- **Pull Request** vers `main`, `develop`

### Optimisations

- ✅ **Cache npm** : Réduit le temps d'installation des dépendances
- ✅ **Cache Next.js** : Accélère les builds
- ✅ **Jobs parallèles** : Lint et Tests s'exécutent en parallèle
- ✅ **Annulation automatique** : Annule les runs en cours si nouveau push
- ✅ **Timeout** : 10 minutes max par job (15 pour E2E)

### Artefacts générés

Le pipeline génère et conserve :
- **Coverage report** : Rapport de couverture des tests (7 jours)
- **Build output** : Build Next.js (7 jours)
- **Playwright report** : Rapport des tests E2E en cas d'échec (7 jours)

## Dépannage

### ❌ Erreur : "Error: Process completed with exit code 1"

**Cause** : Une étape du pipeline a échoué

**Solution** :
1. Cliquez sur le job en erreur dans GitHub Actions
2. Lisez les logs pour identifier l'erreur
3. Corrigez en local et testez avec la commande appropriée
4. Poussez le fix

### ❌ Tests E2E timeout

**Cause** : L'application Next.js ne démarre pas assez vite

**Solution** :
- Vérifiez que votre build fonctionne en local
- Augmentez le timeout dans [playwright.config.ts](playwright.config.ts)

### ❌ Secrets manquants

**Cause** : Variables d'environnement non configurées

**Solution** :
- Vérifiez que tous les secrets sont bien ajoutés dans GitHub
- Respectez exactement les noms de secrets (sensibles à la casse)

### ❌ Cache npm invalide

**Cause** : Le cache npm est corrompu

**Solution** :
1. Allez dans **Actions** > **Caches**
2. Supprimez les caches obsolètes
3. Relancez le workflow

## 🎯 Prochaines étapes

### Preview Deployments (optionnel)

Pour ajouter des déploiements de preview automatiques sur Vercel :

1. Créez un compte [Vercel](https://vercel.com)
2. Liez votre repository GitHub
3. Récupérez votre token Vercel
4. Ajoutez le secret `VERCEL_TOKEN` dans GitHub
5. Activez le workflow `preview-deploy.yml` (à créer)

### Firebase Emulator (optionnel)

Pour tester avec Firebase Emulator en CI :

1. Installez Firebase Tools : `npm install -D firebase-tools`
2. Configurez l'émulateur : `firebase init emulators`
3. Ajoutez un step dans le workflow pour démarrer l'émulateur
4. Configurez les tests pour utiliser l'émulateur

### Améliorer la couverture de tests

Actuellement, seuls des tests d'exemple sont présents. Pour améliorer :

1. Ajoutez des tests pour vos composants dans `__tests__/`
2. Ajoutez des scénarios E2E dans `e2e/`
3. Configurez des seuils de couverture minimale dans `vitest.config.ts`

## 📚 Ressources

- [Documentation GitHub Actions](https://docs.github.com/en/actions)
- [Documentation Vitest](https://vitest.dev/)
- [Documentation Playwright](https://playwright.dev/)
- [Next.js Testing](https://nextjs.org/docs/testing)

## ✅ Checklist finale

Avant de considérer votre CI/CD comme opérationnel :

- [ ] Toutes les dépendances sont installées (`npm install`)
- [ ] Tous les secrets GitHub sont configurés
- [ ] Le badge CI est mis à jour avec votre username
- [ ] Le premier workflow s'exécute avec succès
- [ ] Les tests passent en local (`npm run test`)
- [ ] Le build réussit en local (`npm run build`)
- [ ] Le lint passe (`npm run lint`)
- [ ] Le type-check passe (`npm run type-check`)

---

**Besoin d'aide ?** Ouvrez une issue sur GitHub avec les logs du workflow en erreur.
