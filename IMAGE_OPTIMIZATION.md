# Image Optimization - Guide de Migration

## 📋 Vue d'ensemble

Ce document explique la configuration d'optimisation des images dans Groovr et comment migrer les composants vers `ImageOptimized`.

## ✅ Configuration Next.js

### Domaines autorisés

La configuration dans [next.config.ts](next.config.ts) autorise :

- **Spotify CDN** : `i.scdn.co/image/**` (covers d'albums)
- **Firebase Storage** : `firebasestorage.googleapis.com/v0/b/**` (photos de profil, images de posts)

### Formats optimisés

- **AVIF** : Meilleur compression (~30% plus petit que WebP)
- **WebP** : Fallback si AVIF non supporté
- Fallback automatique vers format original si nécessaire

### Configuration cache

- `minimumCacheTTL: 60` = Cache CDN de 60 secondes minimum
- Tailles d'écrans : `[640, 750, 828, 1080, 1200, 1920, 2048, 3840]`
- Tailles d'images : `[16, 32, 48, 64, 96, 128, 256, 384]`

## 🎨 Utilisation du composant ImageOptimized

### Import

```tsx
import ImageOptimized from '@/components/ImageOptimized';
```

### Exemples d'utilisation

#### Image avec dimensions fixes

```tsx
<ImageOptimized
  src="https://i.scdn.co/image/ab67616d0000b273..."
  alt="Album cover"
  width={300}
  height={300}
  className="rounded-lg"
/>
```

#### Image responsive (fill)

```tsx
<div className="relative aspect-square w-full">
  <ImageOptimized
    src={album.coverUrl}
    alt={album.title}
    fill
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    className="object-cover"
  />
</div>
```

#### Image prioritaire (above the fold)

```tsx
<ImageOptimized
  src={user.photoURL}
  alt={user.username}
  width={200}
  height={200}
  priority // Désactive lazy loading
  quality={90} // Qualité supérieure
/>
```

### Props disponibles

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `src` | `string` | **requis** | URL de l'image |
| `alt` | `string` | **requis** | Texte alternatif |
| `width` | `number` | - | Largeur en pixels (requis si fill=false) |
| `height` | `number` | - | Hauteur en pixels (requis si fill=false) |
| `fill` | `boolean` | `false` | Remplit le conteneur parent |
| `sizes` | `string` | - | Responsive breakpoints (requis si fill=true) |
| `quality` | `number` | `85` | Qualité de compression (1-100) |
| `priority` | `boolean` | `false` | Désactive lazy loading |
| `className` | `string` | `''` | Classes CSS additionnelles |
| `objectFit` | `string` | `'cover'` | Mode d'ajustement de l'image |

## 🔄 Composants à migrer

### Statut de migration

- ✅ **AlbumCard.tsx** - Migré (ligne 19-25)
- ✅ **AlbumImage.tsx** - Migré (wrapper simple)
- ✅ **Avatar.tsx** - Migré (ligne 66-72)
- ✅ **PostCard.tsx** - Migré (ligne 225-231)
- ✅ **AddAlbumModal.tsx** - Migré (ligne 149-155)

**🎉 Tous les composants ont été migrés avec succès !**

### Guide de migration

#### Avant (ancien code avec `<img>`)

```tsx
const [imageLoaded, setImageLoaded] = useState(false);

// ...

{!imageLoaded && (
  <div className="absolute inset-0 animate-pulse bg-gradient-to-r...">
    {/* Shimmer placeholder */}
  </div>
)}

<img
  src={album.coverUrl}
  alt={album.title}
  className={`transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
  loading="lazy"
  onLoad={() => setImageLoaded(true)}
/>
```

#### Après (nouveau code avec ImageOptimized)

```tsx
import ImageOptimized from './ImageOptimized';

// Pas besoin de state imageLoaded ni de shimmer manuel

<ImageOptimized
  src={album.coverUrl}
  alt={album.title}
  fill
  sizes="(max-width: 768px) 50vw, 33vw"
  className="object-cover"
/>
```

### Checklist de migration

1. ✅ Importer `ImageOptimized` au lieu de gérer le state manuellement
2. ✅ Retirer le state `imageLoaded` et `setImageLoaded`
3. ✅ Retirer le code de shimmer placeholder (géré automatiquement)
4. ✅ Remplacer `<img>` par `<ImageOptimized>`
5. ✅ Définir `width`/`height` OU utiliser `fill={true}`
6. ✅ Ajouter `sizes` si `fill={true}` pour responsive optimal
7. ✅ Tester visuellement que l'image s'affiche correctement

## 🎯 Avantages

### Performance

- ✅ **AVIF/WebP automatique** : ~50% de réduction de poids
- ✅ **Lazy loading** : Charge uniquement les images visibles
- ✅ **Responsive images** : Sert la bonne taille selon l'écran
- ✅ **CDN optimization** : Cache automatique via Vercel

### UX

- ✅ **Shimmer placeholder** : Feedback visuel pendant le chargement
- ✅ **Fallback gracieux** : Icône vinyle si l'image échoue
- ✅ **Transition smooth** : Fade-in à l'apparition de l'image

### DX (Developer Experience)

- ✅ **API simple** : Moins de code boilerplate
- ✅ **Type-safe** : Props TypeScript strictes
- ✅ **Réutilisable** : Un seul composant pour toutes les images

## 🧪 Tests de validation

### 1. Vérifier images Spotify

1. Aller sur `/collection` ou `/wishlist`
2. Rechercher un album via la recherche
3. ✅ Les covers Spotify doivent s'afficher

### 2. Vérifier images Firebase

1. Aller sur un profil utilisateur
2. ✅ La photo de profil doit s'afficher
3. Aller sur `/feed`
4. ✅ Les images des posts doivent s'afficher

### 3. Vérifier formats modernes

1. Ouvrir DevTools > Network
2. Filtrer par `img`
3. Rafraîchir la page
4. ✅ Les images doivent être servies en **WebP** ou **AVIF** (navigateurs modernes)

### 4. Vérifier le build

```bash
npm run build
# ✅ Pas d'erreur sur optimisation images
```

## 📝 Notes importantes

- **remotePatterns** est la syntaxe Next.js 14+ (préférer à `domains` deprecated)
- **AVIF** a meilleur compression que WebP mais moins supporté (fallback automatique)
- **minimumCacheTTL** définit cache CDN Vercel (60s = 1min)
- **sizes** est crucial pour `fill={true}` - définir les breakpoints responsive

## 🚀 Prochaines étapes

1. Migrer les 4 composants restants vers `ImageOptimized`
2. Tester en production que les images Spotify et Firebase fonctionnent
3. Monitorer les Core Web Vitals (LCP devrait s'améliorer)

## 📚 Ressources

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Image Component API](https://nextjs.org/docs/app/api-reference/components/image)
- [AVIF vs WebP](https://web.dev/learn/images/avif)
