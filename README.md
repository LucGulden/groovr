# 🎵 Groovr

[![CI](https://github.com/lucgulden/groovr/actions/workflows/ci.yml/badge.svg)](https://github.com/lucgulden/groovr/actions/workflows/ci.yml)

Groovr est un réseau social dédié aux passionnés de vinyles. Partagez votre collection, découvrez de nouveaux albums et connectez-vous avec une communauté qui partage votre passion pour la musique et les vinyles.

## 📋 Description

Groovr permet aux collectionneurs de vinyles de :
- **Cataloguer leur collection** : Ajoutez vos vinyles, notez vos écoutes et suivez l'évolution de votre collection
- **Partager avec la communauté** : Postez vos dernières acquisitions, échangez des recommandations
- **Découvrir de nouveaux albums** : Explorez les collections des autres utilisateurs
- **Créer une wishlist** : Gardez une trace des vinyles que vous souhaitez acquérir

## 🛠️ Stack technique

- **Frontend** : Next.js 16 (App Router) avec React 19
- **Langage** : TypeScript
- **Styling** : Tailwind CSS 4
- **Backend** : Firebase
  - Authentication (Firebase Auth)
  - Database (Firestore)
  - Storage (Firebase Storage)
- **API externe** : Spotify API (à venir - Phase 4)

## 🚀 Installation

### Prérequis

- Node.js 20+
- npm ou yarn
- Un compte Firebase
- (Futur) Un compte développeur Spotify

### Étapes d'installation

1. Clonez le repository :
```bash
git clone https://github.com/votre-username/groovr.git
cd groovr
```

2. Installez les dépendances :
```bash
npm install
```

3. Créez un fichier `.env.local` à la racine du projet et ajoutez vos credentials Firebase :
```env
NEXT_PUBLIC_FIREBASE_API_KEY=votre_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=votre_app_id
```

4. Déployez les indexes Firestore requis :
```bash
# Installer Firebase CLI globalement (si pas déjà fait)
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Déployer les indexes
firebase deploy --only firestore:indexes
```

> **Note** : Les indexes Firestore sont nécessaires pour que toutes les queries de l'application fonctionnent. Le fichier `firestore.indexes.json` contient déjà la configuration complète. La création des indexes prend environ 5-15 minutes. Pour plus de détails, consultez [docs/FIRESTORE_INDEXES.md](docs/FIRESTORE_INDEXES.md).

## 🔑 Obtenir les credentials

### Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Dans les paramètres du projet, ajoutez une application web
4. Copiez la configuration Firebase et ajoutez les valeurs dans votre `.env.local`
5. Activez les services nécessaires :
   - **Authentication** : Email/Password
   - **Firestore Database** : Mode production
   - **Storage** : Mode production

### Spotify (Phase 4 - à venir)

1. Allez sur [Spotify for Developers](https://developer.spotify.com/dashboard)
2. Créez une nouvelle application
3. Notez votre Client ID et Client Secret
4. Ajoutez-les dans votre `.env.local` :
```env
SPOTIFY_CLIENT_ID=votre_client_id
SPOTIFY_CLIENT_SECRET=votre_client_secret
```

## 📁 Structure du projet

```
groovr/
├── src/
│   ├── app/                # App Router de Next.js
│   │   ├── layout.tsx      # Layout principal avec navigation et footer
│   │   ├── page.tsx        # Page d'accueil
│   │   └── globals.css     # Styles globaux et configuration Tailwind
│   ├── components/         # Composants React réutilisables
│   ├── lib/               # Utilitaires et configurations
│   │   └── firebase.ts    # Configuration Firebase
│   └── types/             # Types TypeScript
├── public/                # Fichiers statiques
├── .env.local            # Variables d'environnement (non versionné)
├── .env.example          # Template des variables d'environnement
├── package.json          # Dépendances et scripts
└── README.md            # Documentation
```

## 💻 Commandes disponibles

### Développement
```bash
npm run dev
```
Lance le serveur de développement sur [http://localhost:3000](http://localhost:3000)

### Build
```bash
npm run build
```
Crée une build optimisée pour la production

### Production
```bash
npm run start
```
Lance le serveur de production (après avoir exécuté `npm run build`)

### Qualité du code
```bash
npm run lint          # Vérifie la qualité du code avec ESLint
npm run type-check    # Vérifie les types TypeScript
```

### Tests
```bash
npm run test          # Lance les tests unitaires (Vitest)
npm run test:watch    # Lance les tests en mode watch
npm run test:e2e      # Lance les tests E2E (Playwright)
npm run test:e2e:ui   # Lance les tests E2E en mode UI
```

### Firebase
```bash
firebase login                            # Se connecter à Firebase
firebase deploy --only firestore:indexes  # Déployer les indexes Firestore
firebase use dev                          # Changer de projet Firebase (dev/prod)
```

> **Important** : Les indexes Firestore doivent être déployés avant d'utiliser l'application. Voir [docs/FIRESTORE_INDEXES.md](docs/FIRESTORE_INDEXES.md) pour plus de détails.

## 🎨 Design

Groovr utilise un design dark mode par défaut, inspiré de l'ambiance des vinyles et des soirées d'écoute :

### Palette de couleurs
- **Primary** : Orange `#E67E22` - Énergie et passion musicale
- **Secondary** : Marron `#8B4513` - Référence au vinyle et au vintage
- **Background** : Noir `#1A1A1A` - Ambiance dark
- **Text** : Blanc cassé `#F5F5F5` - Confort de lecture

### Inspiration
- Interface type Spotify pour l'expérience utilisateur
- Feed social type Instagram pour le partage de contenu
- Organisation type Discogs pour les collections

## 🗺️ Roadmap

### Phase 1 - Setup et authentification (en cours)
- [x] Configuration du projet Next.js
- [x] Configuration Firebase
- [x] Design system et thème
- [x] Layout et navigation
- [X] Pages d'authentification (login/signup)

### Phase 2 - Gestion de la collection
- [X] Création de profil utilisateur
- [X] Ajout manuel de vinyles
- [X] Visualisation de la collection
- [X] Système de wishlist

### Phase 3 - Social features
- [X] Feed d'actualités
- [X] Posts et partages
- [X] Commentaires et likes
- [X] Système de follow

### Phase 4 - Intégration Spotify
- [X] Recherche d'albums via Spotify API
- [X] Récupération des métadonnées
- [ ] Recommandations personnalisées

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

Ce projet est sous licence MIT.

## 📧 Contact

Pour toute question ou suggestion, contactez-nous via les issues GitHub.

---

Fait avec ❤️ par les passionnés de vinyles
