# FillCrate - Réseau social pour passionnés de vinyles

## Vue d'ensemble

FillCrate est un réseau social pour passionnés de vinyles : gestion de collection/wishlist, feed social, follows, likes, commentaires, notifications, recherche d'albums et utilisateurs, création d'albums (Spotify ou manuel) et de pressages vinyles.

**Stack** : React 18 + TypeScript + Vite 7 + Supabase + Tailwind CSS + Framer Motion + Zustand

## Structure du projet
```
src/
├── components/          # Composants UI réutilisables
├── pages/               # Pages de l'application
├── guards/              # Route guards (ProtectedRoute, PublicOnlyRoute, HomeRoute)
├── hooks/               # Hooks personnalisés (useAuth, useFeedPagination, useVinylsPagination, useAlbumSearch, useArtistSearch, useUserSearch, useNotifications)
├── lib/                 # Fonctions utilitaires (API calls, helpers)
├── stores/              # State management Zustand
├── types/               # Types TypeScript
└── database/            # Migrations SQL
```

## State Management

### Architecture Zustand

Trois stores centralisés gèrent l'état global de l'application :

| Store | Localisation | Responsabilité |
|-------|--------------|----------------|
| `notificationsStore` | `/stores/notificationsStore.ts` | Compteur de notifications non lues + subscription temps réel |
| `userStore` | `/stores/userStore.ts` | Données du profil utilisateur connecté (photo, username, bio) |
| `vinylStatsStore` | `/stores/vinylStatsStore.ts` | Compteurs collection/wishlist de l'utilisateur connecté |

### Cycle de vie des stores

**Initialisation** : `App.tsx` initialise tous les stores au login :
```typescript
useEffect(() => {
  if (user) {
    initializeNotifications(user.id)
    initializeUser(user.id)
    initializeVinylStats(user.id)
  } else {
    cleanupNotifications()
    cleanupUser()
    cleanupVinylStats()
  }
}, [user])
```

**Mise à jour** : Les composants appellent les actions du store après mutation DB :
```typescript
// Ajout en collection
await addVinylToUser(userId, vinylId, 'collection')
incrementCollection()

// Suppression de la wishlist
await removeVinylFromUser(userId, vinylId, 'wishlist')
decrementWishlist()

// Déplacement wishlist → collection
await moveToCollection(userId, vinylId)
decrementWishlist()
incrementCollection()

// Modification du profil
await updateUserProfile(userId, updates)
updateAppUser(updates)
```

**Consommation** : Les composants s'abonnent aux stores via hooks :
```typescript
const { unreadCount } = useNotificationsStore()
const { appUser } = useUserStore()
const { stats } = useVinylStatsStore()
```

### Pattern de synchronisation

1. Mutation en base de données (Supabase)
2. Action Zustand pour mettre à jour le state local
3. Re-render automatique des composants abonnés
4. Pas d'events custom, pas de props drilling

### Composants clés

| Composant | Rôle |
|-----------|------|
| `AddVinylModal` | Modal 5 étapes : albumSearch (mode artiste uniquement) → createAlbum → vinylSelection → createVinyl → vinylDetails |
| `AlbumSearch` | Recherche filtrée par artiste (filtrage client sur les albums de l'artiste) |
| `VinylCard` | Carte vinyle avec `variant`: `'full'` (badges, détails) ou `'compact'` (titre + artiste) |
| `VinylGrid` | Grille avec infinite scroll, utilise VinylCard en mode compact |
| `VinylDetails` | Détails vinyle avec actions contextuelles selon `targetType` et `isOwnProfile` |
| `AlbumCard` | Carte album (titre, artiste, année) |
| `ProfileVinyls` | Affiche collection/wishlist, ouvre modal au clic sur vinyle, écoute `vinylStatsStore` pour rafraîchir |
| `LoadingSpinner` | Spinner de chargement centralisé avec options fullScreen et taille |
| `PostCard` | Carte post avec optimistic UI et subscriptions temps réel (likes, commentaires) |
| `CommentItem` | Item commentaire avec support mode `isPending` |
| `SearchAlbumsTab` | Recherche d'albums avec infinite scroll (pagination offset-based) |
| `SearchArtistsTab` | Recherche d'artistes avec infinite scroll (pagination offset-based) |
| `SearchUsersTab` | Recherche d'utilisateurs avec infinite scroll (pagination offset-based) |

### Guards

| Guard | Rôle |
|-------|------|
| `ProtectedRoute` | Bloque l'accès si non connecté → redirect `/` |
| `PublicOnlyRoute` | Bloque l'accès si connecté → redirect `/` |
| `HomeRoute` | Route `/` dynamique : Landing si déconnecté, Feed si connecté |

## Base de données

### Tables principales

- **users** : uid, email, username, first_name, last_name, photo_url, bio
- **artists** : id, name, spotify_id?, image_url?, created_at
- **albums** : id, spotify_id?, musicbrainz_release_group_id?, title, cover_url, year, created_by?
- **album_artists** : album_id (FK), artist_id (FK), position — **Relation many-to-many albums ↔ artists**
- **vinyls** : id, album_id (FK), musicbrainz_release_id?, title, cover_url, year, label, catalog_number, country, format, created_by?
- **vinyl_artists** : vinyl_id (FK), artist_id (FK), position — **Relation many-to-many vinyls ↔ artists**
- **user_vinyls** : user_id, release_id, type ('collection'|'wishlist') — **un vinyle ne peut JAMAIS être dans les deux**
- **posts** : user_id, vinyl_id, type ('collection_add'|'wishlist_add'), content?
- **post_likes**, **comments**, **follows**, **notifications**

### Architecture vinyles

- **Album** = œuvre musicale abstraite (peut avoir plusieurs pressages)
- **Vinyl** = pressage physique spécifique (lié à un album)
- **UserVinyl** = relation user ↔ vinyle (collection ou wishlist)

### Architecture artistes

- Les albums et vinyles n'ont **plus de colonne `artist` directe** (migration vers tables de jointure)
- Relation many-to-many via `album_artists` et `vinyl_artists` (supporte les collaborations)
- Fonction RPC `ensure_artist(artist_name)` : crée ou récupère un artiste (case-insensitive, déduplique automatiquement)
- Fonction RPC `create_album_with_artist()` : gère atomiquement la création album + artiste + relation
- Fonction RPC `create_vinyl_with_artist()` : gère atomiquement la création vinyle + artiste + relation
- Les requêtes récupèrent les artistes via jointures et reconstituent le champ `artist` (concaténation avec virgules pour les collabs)

### Triggers automatiques

- Création user à l'inscription
- Création post à l'ajout en collection
- Notifications : follow, like, comment (+ cleanup à la suppression)

## Routes

### Routes publiques (accessibles déconnecté ET connecté)
```
/search                     Recherche albums (par titre), artistes, utilisateurs avec infinite scroll
/profile/:username          Profil (3 onglets : feed/collection/wishlist)
/profile/:username/followers|following
```

### Route dynamique selon auth
```
/                           Landing si déconnecté, Feed si connecté
```

### Routes "public only" (bloquées si connecté)
```
/signup, /login             Auth
```

### Routes protégées (bloquées si déconnecté)
```
/notifications              
/settings                   Modification profil
```

## Logique contextuelle AddVinylModal

### Props
```typescript
interface AddVinylModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  targetType?: 'collection' | 'wishlist';  // Contexte d'ajout
  initialAlbum?: Album;                     // Démarre à vinylSelection
  initialStep?: ModalStep;                  // Démarre à une étape spécifique
  initialVinyl?: Vinyl;                     // Démarre à vinylDetails
  isOwnProfile?: boolean;                   // Actions de gestion vs ajout
  artist?: Artist;                          // Requis pour albumSearch, démarre à createAlbum si absent
}
```

### Comportement VinylDetails

| Contexte | Condition | Actions |
|----------|-----------|---------|
| Mon profil > Collection | - | "Retirer de ma collection" (decrementCollection) |
| Mon profil > Wishlist | - | "J'ai acheté !" (decrementWishlist + incrementCollection) + "Retirer de ma wishlist" (decrementWishlist) |
| Profil autre / Search | En collection | Message "déjà possédé" |
| Profil autre / Search | En wishlist | "Déplacer vers la collection" (decrementWishlist + incrementCollection) |
| Profil autre / Search | Non possédé | 2 boutons : collection (incrementCollection) + wishlist (incrementWishlist) |

## Types principaux
```typescript
interface UserVinylWithDetails extends UserVinyl {
  vinyl: Vinyl;
  album: Album;  // Jointure incluse
}

type UserVinylType = 'collection' | 'wishlist';
```

## Patterns et conventions

### Modal avec état initial
```typescript
<AddVinylModal
  key={isModalOpen ? 'open' : 'closed'}  // Force remount pour reset
  initialStep="createAlbum"              // Ouvre directement à création
  artist={selectedArtist}                // Requis pour albumSearch
  // ...
/>
```

### VinylImage
```typescript
// ✅ Utiliser opacity (pas hidden avec loading="lazy")
<img className={loaded ? 'opacity-100' : 'opacity-0'} loading="lazy" />
```

## Variables CSS
```css
--background: #1A1A1A
--background-light: #242424
--background-lighter: #2A2A2A
--foreground: #F5F5F5
--foreground-muted: #A0A0A0
--primary: #E67E22 (orange)
--secondary: #8B4513 (marron)
```

## Libs utilitaires

| Fichier | Fonctions clés |
|---------|----------------|
| `vinyls.ts` | getUserVinyls, addVinylToUser, removeVinylFromUser, moveToCollection, searchAlbums (titre uniquement, offset-based), searchArtists (offset-based), getAlbumsByArtist, createAlbum (via RPC), createVinyl (via RPC) |
| `search.ts` | searchUsers (offset-based) |
| `spotify.ts` | searchSpotifyAlbums, getSpotifyAlbum (Client Credentials Flow) |
| `covers.ts` | uploadAlbumCover, uploadVinylCover (compression WebP 600px) |
| `storage.ts` | uploadProfilePhoto |

## Points d'attention

1. **Ordre des routes** : spécifiques AVANT génériques
2. **Policies Supabase** : INSERT sur users, UPDATE sur albums/vinyls
3. **Règle collection/wishlist** : jamais les deux en même temps
4. **Images** : opacity au lieu de hidden avec lazy loading
5. **Modal reset** : utiliser `key` pour forcer le remount
6. **Covers Spotify** : URL stockée directement (pas de copie)
7. **Route guards** : ProtectedRoute gère le loading centralisé, pas de checks manuels dans les pages
8. **State management** : Zustand pour état global, pas d'events custom (`window.dispatchEvent`)
9. **Realtime** : Activer les tables dans Supabase publication pour temps réel
10. **Infinite scroll** : IntersectionObserver avec pagination offset-based pour la recherche

## Style d'interaction préféré

- ✅ Questions de clarification AVANT de coder
- ✅ Procéder étape par étape avec validation
- ✅ Modifications ciblées plutôt que fichiers complets
- ✅ Un composant = un fichier
- ✅ Réutiliser l'existant

---

**Dernière mise à jour** : 31 janvier 2026