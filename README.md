# FillCrate - Réseau social pour passionnés de vinyles

## Vue d'ensemble

FillCrate est un réseau social pour passionnés de vinyles : gestion de collection/wishlist, feed social, follows, likes, commentaires, notifications, recherche d'albums et utilisateurs, création d'albums (Spotify ou manuel) et de pressages vinyles.

**Stack** : React 18 + TypeScript + Vite 7 + Supabase + Tailwind CSS + Framer Motion

## Structure du projet
```
src/
├── components/          # Composants UI réutilisables
├── pages/               # Pages de l'application
├── hooks/               # Hooks personnalisés (useAuth, useFeedPagination, useVinylsPagination, useNotifications)
├── lib/                 # Fonctions utilitaires (API calls, helpers)
├── types/               # Types TypeScript
└── database/            # Migrations SQL
```

### Composants clés

| Composant | Rôle |
|-----------|------|
| `AddVinylModal` | Modal 5 étapes : albumSearch → createAlbum → vinylSelection → createVinyl → vinylDetails |
| `VinylCard` | Carte vinyle avec `variant`: `'full'` (badges, détails) ou `'compact'` (titre + artiste) |
| `VinylGrid` | Grille avec infinite scroll, utilise VinylCard en mode compact |
| `VinylDetails` | Détails vinyle avec actions contextuelles selon `targetType` et `isOwnProfile` |
| `AlbumCard` | Carte album (titre, artiste, année) |
| `ProfileVinyls` | Affiche collection/wishlist, ouvre modal au clic sur vinyle |

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
```
/                           Landing page
/signup, /login             Auth
/feed                       Feed social
/profile/:username          Profil (3 onglets : feed/collection/wishlist)
/profile/:username/followers|following
/notifications              
/search                     Albums + Utilisateurs
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
  artist?: Artist;                          // Filtre par artiste dans AlbumSearch
}
```

### Comportement VinylDetails

| Contexte | Condition | Actions |
|----------|-----------|---------|
| Mon profil > Collection | - | "Retirer de ma collection" |
| Mon profil > Wishlist | - | "J'ai acheté !" + "Retirer de ma wishlist" |
| Profil autre / Search | En collection | Message "déjà possédé" |
| Profil autre / Search | En wishlist | "Déplacer vers la collection" |
| Profil autre / Search | Non possédé | 2 boutons : collection + wishlist |

## Types principaux
```typescript
interface UserVinylWithDetails extends UserVinyl {
  vinyl: Vinyl;
  album: Album;  // Jointure incluse
}

type UserVinylType = 'collection' | 'wishlist';
```

## Patterns et conventions

### Custom Events (synchronisation)
```typescript
window.dispatchEvent(new Event('vinyl-added'));    // Rafraîchit les listes
window.dispatchEvent(new Event('profile-updated')); // Sync Navigation
window.dispatchEvent(new Event('notifications-read'));
```

### Modal avec état initial
```typescript
<AddVinylModal
  key={isModalOpen ? 'open' : 'closed'}  // Force remount pour reset
  initialStep="createAlbum"              // Ouvre directement à création
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
| `vinyls.ts` | getUserVinyls, addVinylToUser, removeVinylFromUser, moveToCollection, searchAlbums, searchArtists, getAlbumsByArtist, createAlbum (via RPC), createVinyl (via RPC) |
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

## Style d'interaction préféré

- ✅ Questions de clarification AVANT de coder
- ✅ Procéder étape par étape avec validation
- ✅ Modifications ciblées plutôt que fichiers complets
- ✅ Un composant = un fichier
- ✅ Réutiliser l'existant

---

**Dernière mise à jour** : 25 janvier 2026