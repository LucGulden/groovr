# Image Loading Strategy - Groovr

Documentation de la stratégie de chargement d'images optimisée pour performance et UX.

## Architecture

Groovr utilise Next.js Image avec optimisations automatiques:
- **Format**: Conversion automatique WebP/AVIF
- **Responsive**: Génération multi-tailles
- **Lazy loading**: Par défaut sauf images critiques
- **Placeholders**: Blur générique SVG

## Classification des Images

### Images Critiques (Priority Loading)

**Above-the-fold - Chargement prioritaire**

1. **Avatar utilisateur connecté (Navigation)**
   - Composant: `Avatar` dans Navigation/Header
   - Taille: 40px (md)
   - Priority: `true`
   - Sizes: `40px`

2. **Premier post du feed**
   - Composant: `PostCard` (index 0)
   - Taille: Max 448px (mobile: 100vw)
   - Priority: `true`
   - Sizes: `(max-width: 768px) 100vw, 448px`

3. **3 premiers albums Collection/Wishlist**
   - Composant: `AlbumCard` (index 0-2)
   - Taille: Responsive grid
   - Priority: `true` (premiers 3 uniquement)
   - Sizes: `(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw`

### Images Non-Critiques (Lazy Loading)

**Below-the-fold - Chargement différé**

1. **Posts feed après le premier**
   - Composant: `PostCard` (index > 0)
   - Loading: `lazy`
   - Sizes: `(max-width: 768px) 100vw, 448px`

2. **Albums collection après les 3 premiers**
   - Composant: `AlbumCard` (index > 2)
   - Loading: `lazy`
   - Sizes: `(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw`

3. **Avatars dans commentaires**
   - Composant: `Avatar` dans `CommentItem`
   - Loading: `lazy`
   - Size: 32px (sm)
   - Sizes: `32px`

4. **Images résultats recherche**
   - Composant: `AlbumCard` dans recherche
   - Loading: `lazy`
   - Sizes: `(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw`

5. **Profile photos autres users**
   - Composant: `Avatar` dans liste users
   - Loading: `lazy`
   - Sizes: `40px` ou `64px` selon contexte

## Sizes Attribute Strategy

### Albums dans Grid Responsive
```typescript
sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
```
- Mobile (≤768px): 2 colonnes = 50vw
- Tablet (769-1200px): 3 colonnes = 33vw
- Desktop (>1200px): 4 colonnes = 25vw

### Post Images dans Feed
```typescript
sizes="(max-width: 768px) 100vw, 448px"
```
- Mobile: Pleine largeur
- Desktop: Max 448px (max-w-md)

### Avatars
```typescript
sizes="40px"  // ou "32px", "64px", "96px" selon size
```
- Taille fixe, pas de responsive

## Placeholder Strategy

### Generic SVG Blur Placeholder

Utilisation d'un placeholder SVG générique gris pour toutes les images:

```typescript
const GENERIC_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2U1ZTdlYiIvPjwvc3ZnPg==";
```

**Avantages:**
- Aucun traitement serveur requis
- Léger (< 1KB)
- Évite layout shift
- UX cohérente

**Future Enhancement (Phase 9):**
- Base64 blur réels générés avec `plaiceholder`
- Meilleure UX avec couleurs réelles
- Nécessite build-time processing

## Anti-Layout Shift (CLS)

### Règles strictes

1. **Toujours spécifier dimensions**
   ```typescript
   // ✅ BON
   <Image src={url} alt="..." width={400} height={400} />

   // ❌ MAUVAIS (cause shift sans container)
   <Image src={url} alt="..." fill />
   ```

2. **Fill avec aspect-ratio**
   ```typescript
   // ✅ BON
   <div className="relative aspect-square">
     <Image src={url} alt="..." fill className="object-cover" />
   </div>
   ```

3. **Responsive avec sizes**
   ```typescript
   // ✅ BON - Next.js charge la bonne taille
   <Image
     src={url}
     alt="..."
     width={400}
     height={400}
     sizes="(max-width: 768px) 50vw, 25vw"
   />
   ```

## Composants

### ImageOptimized

Wrapper principal avec features:
- ✅ Placeholder blur générique
- ✅ Lazy/Priority loading
- ✅ Error handling avec fallback
- ✅ Shimmer animation pendant chargement
- ✅ Sizes attribute
- ✅ Quality 85 (optimal)

### AlbumImage

Wrapper spécifique albums:
- Utilise `ImageOptimized`
- Ratio 1:1 (aspect-square)
- Sizes configurables

### Avatar

Photos utilisateurs avec fallback initiales:
- Sizes fixes (32, 40, 64, 96px)
- Fallback coloré avec initiales
- Support priority pour header

## Performance Targets

### Lighthouse Scores Cibles

- **LCP (Largest Contentful Paint)**: < 2.5s
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FID (First Input Delay)**: < 100ms
- **Speed Index**: < 3.5s

### Optimisations Appliquées

1. **Priority loading** sur 3-5 images max par page
2. **Lazy loading** sur toutes les autres
3. **Blur placeholders** pour UX fluide
4. **Sizes attribute** pour responsive optimal
5. **Quality 85** (sweet spot taille/qualité)
6. **Aspect ratios** pour éviter CLS

## Tests de Validation

### Checklist

- [ ] Images critiques chargent immédiatement
- [ ] Images below-fold lazy load au scroll
- [ ] Aucun layout shift (CLS < 0.1)
- [ ] Placeholders visibles pendant chargement
- [ ] Fallback s'affiche si erreur
- [ ] Lighthouse Performance > 90
- [ ] Network waterfall optimisé
- [ ] Responsive correcte sur tous viewports

### Commandes Test

```bash
# Build production
npm run build
npm run start

# Lighthouse audit
# Chrome DevTools → Lighthouse → Run audit

# Network throttling
# Chrome DevTools → Network → Fast 3G
```

## Maintenance

### Ajout d'une nouvelle image

1. Utiliser `ImageOptimized` component
2. Spécifier `width`/`height` ou `fill` + aspect-ratio
3. Définir `sizes` si responsive
4. `priority={true}` SI above-the-fold critique
5. Tester CLS avec DevTools

### Debugging

```typescript
// Voir quelles images chargent
console.log(document.querySelectorAll('img[loading="lazy"]').length);
console.log(document.querySelectorAll('img[fetchpriority="high"]').length);

// Vérifier CLS
// DevTools → Performance → Record → Check Layout Shifts
```

## Resources

- [Next.js Image Docs](https://nextjs.org/docs/api-reference/next/image)
- [Web.dev Images Guide](https://web.dev/fast/#optimize-your-images)
- [CLS Guide](https://web.dev/cls/)
