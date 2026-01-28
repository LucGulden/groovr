import { supabase } from '../supabaseClient'
import type { Album, Vinyl, UserVinyl, UserVinylWithDetails, UserVinylType, Artist } from '../types/vinyl'

const ITEMS_PER_PAGE = 20

/**
 * Récupère les vinyles d'un utilisateur avec pagination
 */
export async function getUserVinyls(
  userId: string,
  type: UserVinylType,
  limit: number = ITEMS_PER_PAGE,
  lastAddedAt?: string,
): Promise<UserVinylWithDetails[]> {
  let query = supabase
    .from('user_vinyls')
    .select(`
      *,
      vinyl:vinyls(
        *,
        vinyl_artists(
          artist:artists(name)
        )
      ),
      album:vinyls(
        album:albums(
          *,
          album_artists(
            artist:artists(name)
          )
        )
      )
    `)
    .eq('user_id', userId)
    .eq('type', type)
    .order('added_at', { ascending: false })
    .limit(limit)

  // Cursor-based pagination
  if (lastAddedAt) {
    query = query.lt('added_at', lastAddedAt)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Erreur lors de la récupération des vinyles: ${error.message}`)
  }

  // Transformer la structure pour avoir album au même niveau que vinyl
  return (data || []).map((item: any) => {
    // Extraire les artistes du vinyle
    const vinylArtists = item.vinyl?.vinyl_artists?.map((va: any) => va.artist?.name).filter(Boolean) || []
    const vinyl = {
      ...item.vinyl,
      artist: vinylArtists.join(', ') || 'Artiste inconnu',
      vinyl_artists: undefined,
    }

    // Extraire les artistes de l'album
    const albumArtists = item.album?.album?.album_artists?.map((aa: any) => aa.artist?.name).filter(Boolean) || []
    const album = item.album?.album ? {
      ...item.album.album,
      artist: albumArtists.join(', ') || 'Artiste inconnu',
      album_artists: undefined,
    } : null

    return {
      ...item,
      vinyl,
      album,
    }
  }) as UserVinylWithDetails[]
}

/**
 * Compte le nombre total de vinyles
 */
export async function getUserVinylsCount(
  userId: string,
  type: UserVinylType,
): Promise<number> {
  const { count, error } = await supabase
    .from('user_vinyls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', type)

  if (error) {
    throw new Error(`Erreur lors du comptage: ${error.message}`)
  }

  return count || 0
}

/**
 * Vérifie si un vinyle existe déjà dans la collection/wishlist de l'utilisateur
 */
export async function hasVinyl(
  userId: string,
  vinylId: string,
  type: UserVinylType,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_vinyls')
    .select('id')
    .eq('user_id', userId)
    .eq('release_id', vinylId)
    .eq('type', type)

  if (error) {
    console.error('Erreur lors de la vérification:', error)
    return false
  }

  return data.length > 0
}

/**
 * Ajoute un vinyle à la collection ou wishlist
 */
export async function addVinylToUser(
  userId: string,
  vinylId: string,
  type: UserVinylType,
): Promise<UserVinyl> {
  // Vérifier si déjà présent
  const exists = await hasVinyl(userId, vinylId, type)
  if (exists) {
    throw new Error(`Ce vinyle est déjà dans votre ${type === 'collection' ? 'collection' : 'wishlist'}`)
  }

  const { data, error } = await supabase
    .from('user_vinyls')
    .insert({
      user_id: userId,
      release_id: vinylId,
      type,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erreur lors de l'ajout: ${error.message}`)
  }

  return data as UserVinyl
}

/**
 * Retire un vinyle de la collection ou wishlist
 */
export async function removeVinylFromUser(
  userId: string,
  vinylId: string,
  type: UserVinylType,
): Promise<void> {
  const { error } = await supabase
    .from('user_vinyls')
    .delete()
    .eq('user_id', userId)
    .eq('release_id', vinylId)
    .eq('type', type)

  if (error) {
    throw new Error(`Erreur lors de la suppression: ${error.message}`)
  }
}

/**
 * Déplace un vinyle de la wishlist vers la collection
 */
export async function moveToCollection(
  userId: string,
  vinylId: string,
): Promise<void> {
  // Vérifier qu'il est dans la wishlist
  const inWishlist = await hasVinyl(userId, vinylId, 'wishlist')
  if (!inWishlist) {
    throw new Error('Ce vinyle n\'est pas dans votre wishlist')
  }

  // Vérifier qu'il n'est pas déjà dans la collection
  const inCollection = await hasVinyl(userId, vinylId, 'collection')
  if (inCollection) {
    throw new Error('Ce vinyle est déjà dans votre collection')
  }

  // Retirer de la wishlist
  await removeVinylFromUser(userId, vinylId, 'wishlist')

  // Ajouter à la collection
  await addVinylToUser(userId, vinylId, 'collection')
}

/**
 * Obtient les statistiques des vinyles d'un utilisateur
 */
export async function getVinylStats(userId: string): Promise<{
  collectionCount: number;
  wishlistCount: number;
}> {
  const [collectionCount, wishlistCount] = await Promise.all([
    getUserVinylsCount(userId, 'collection'),
    getUserVinylsCount(userId, 'wishlist'),
  ])

  return {
    collectionCount,
    wishlistCount,
  }
}

/**
 * Recherche d'albums dans la base de données par titre ou artiste
 */
export async function searchAlbums(
  query: string,
  limit: number = 20,
): Promise<Album[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  const searchTerm = `%${query.trim()}%`

  // 1. Chercher par titre d'album (avec artistes)
  const { data: albumsByTitle, error: titleError } = await supabase
    .from('albums')
    .select(`
      *,
      album_artists(
        artist:artists(name)
      )
    `)
    .ilike('title', searchTerm)
    .limit(limit)

  if (titleError) {
    throw new Error(`Erreur lors de la recherche: ${titleError.message}`)
  }

  // 2. Chercher par artiste (via la jointure album_artists)
  const { data: matchingArtists, error: artistError } = await supabase
    .from('artists')
    .select('id')
    .ilike('name', searchTerm)

  if (artistError) {
    throw new Error(`Erreur lors de la recherche: ${artistError.message}`)
  }

  let albumsByArtistData: any[] = []
  if (matchingArtists && matchingArtists.length > 0) {
    const artistIds = matchingArtists.map(a => a.id)
    
    const { data: artistAlbums, error: artistAlbumsError } = await supabase
      .from('album_artists')
      .select(`
        album:albums(
          *,
          album_artists(
            artist:artists(name)
          )
        )
      `)
      .in('artist_id', artistIds)
      .limit(limit)

    if (artistAlbumsError) {
      throw new Error(`Erreur lors de la recherche: ${artistAlbumsError.message}`)
    }

    albumsByArtistData = (artistAlbums || [])
      .map((item: any) => item.album)
      .filter(Boolean)
  }

  // 3. Fusionner et dédupliquer par ID
  const allAlbums = [...(albumsByTitle || []), ...albumsByArtistData]
  const uniqueAlbums = Array.from(
    new Map(allAlbums.map(album => [album.id, album])).values(),
  )

  // 4. Transformer pour extraire le nom de l'artiste
  const transformedAlbums = uniqueAlbums.map((album: any) => {
    const artists = album.album_artists?.map((aa: any) => aa.artist?.name).filter(Boolean) || []
    return {
      ...album,
      artist: artists.join(', ') || 'Artiste inconnu',
      album_artists: undefined, // Retirer la jointure du résultat final
    }
  })

  return transformedAlbums.slice(0, limit)
}

/**
 * Récupère tous les pressages vinyles d'un album
 */
export async function getVinylsByAlbum(albumId: string): Promise<Vinyl[]> {
  const { data, error } = await supabase
    .from('vinyls')
    .select(`
      *,
      vinyl_artists(
        artist:artists(name)
      )
    `)
    .eq('album_id', albumId)
    .order('year', { ascending: false })

  if (error) {
    throw new Error(`Erreur lors de la récupération des vinyles: ${error.message}`)
  }

  // Transformer pour extraire les artistes
  return (data || []).map((vinyl: any) => {
    const artists = vinyl.vinyl_artists?.map((va: any) => va.artist?.name).filter(Boolean) || []
    return {
      ...vinyl,
      artist: artists.join(', ') || 'Artiste inconnu',
      vinyl_artists: undefined,
    }
  }) as Vinyl[]
}


/**
 * Crée un nouvel album
 */
export interface CreateAlbumInput {
  title: string;
  artist: string;
  year: number | null;
  coverUrl: string | null;
  spotifyId?: string | null;
  spotifyUrl?: string | null;
  createdBy: string;
}

export async function createAlbum(input: CreateAlbumInput): Promise<Album> {
  // Appeler la fonction RPC qui gère artiste + album + relation
  const { data: albumId, error: rpcError } = await supabase.rpc(
    'create_album_with_artist',
    {
      p_title: input.title,
      p_artist_name: input.artist,
      p_year: input.year,
      p_cover_url: input.coverUrl,
      p_spotify_id: input.spotifyId || null,
      p_spotify_url: input.spotifyUrl || null,
      p_created_by: input.createdBy,
    },
  )

  if (rpcError) {
    throw new Error(`Erreur lors de la création de l'album: ${rpcError.message}`)
  }

  // Récupérer l'album complet avec ses artistes
  const { data: album, error: fetchError } = await supabase
    .from('albums')
    .select(`
      *,
      album_artists(
        artist:artists(name)
      )
    `)
    .eq('id', albumId)
    .single()

  if (fetchError) {
    throw new Error(`Erreur lors de la récupération de l'album: ${fetchError.message}`)
  }

  // Transformer pour avoir le champ artist
  const artists = album.album_artists?.map((aa: any) => aa.artist?.name).filter(Boolean) || []
  return {
    ...album,
    artist: artists.join(', ') || 'Artiste inconnu',
    album_artists: undefined,
  } as Album
}

/**
 * Vérifie si un album existe déjà par son spotify_id
 */
export async function getAlbumBySpotifyId(spotifyId: string): Promise<Album | null> {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('spotify_id', spotifyId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Pas de résultat trouvé
      return null
    }
    throw new Error(`Erreur lors de la recherche: ${error.message}`)
  }

  return data as Album
}

/**
 * Crée un nouveau pressage vinyle
 */
export interface CreateVinylInput {
  albumId: string;
  title: string;
  artist: string;
  year: number;
  label: string;
  catalogNumber: string;
  country: string;
  format: string;
  coverUrl: string;
  createdBy: string;
}

export async function createVinyl(input: CreateVinylInput): Promise<Vinyl> {
  // Appeler la fonction RPC qui gère artiste + vinyle + relation
  const { data: vinylId, error: rpcError } = await supabase.rpc(
    'create_vinyl_with_artist',
    {
      p_album_id: input.albumId,
      p_title: input.title,
      p_artist_name: input.artist,
      p_year: input.year,
      p_label: input.label,
      p_catalog_number: input.catalogNumber,
      p_country: input.country,
      p_format: input.format,
      p_cover_url: input.coverUrl,
      p_created_by: input.createdBy,
    },
  )

  if (rpcError) {
    throw new Error(`Erreur lors de la création du vinyle: ${rpcError.message}`)
  }

  // Récupérer le vinyle complet avec ses artistes
  const { data: vinyl, error: fetchError } = await supabase
    .from('vinyls')
    .select(`
      *,
      vinyl_artists(
        artist:artists(name)
      )
    `)
    .eq('id', vinylId)
    .single()

  if (fetchError) {
    throw new Error(`Erreur lors de la récupération du vinyle: ${fetchError.message}`)
  }

  // Transformer pour avoir le champ artist
  const artists = vinyl.vinyl_artists?.map((va: any) => va.artist?.name).filter(Boolean) || []
  return {
    ...vinyl,
    artist: artists.join(', ') || 'Artiste inconnu',
    vinyl_artists: undefined,
  } as Vinyl
}

/**
 * Met à jour la cover d'un album
 */
export async function updateAlbumCover(albumId: string, coverUrl: string): Promise<void> {
  const { error } = await supabase
    .from('albums')
    .update({ cover_url: coverUrl })
    .eq('id', albumId)

  if (error) {
    throw new Error(`Erreur lors de la mise à jour de la cover: ${error.message}`)
  }
}

/**
 * Met à jour la cover d'un vinyle
 */
export async function updateVinylCover(vinylId: string, coverUrl: string): Promise<void> {
  const { error } = await supabase
    .from('vinyls')
    .update({ cover_url: coverUrl })
    .eq('id', vinylId)

  if (error) {
    throw new Error(`Erreur lors de la mise à jour de la cover: ${error.message}`)
  }
}

/**
 * Recherche d'artistes par nom
 */
export async function searchArtists(
  query: string,
  limit: number = 20,
): Promise<Artist[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  const searchTerm = `%${query.trim()}%`

  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .ilike('name', searchTerm)
    .order('name', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`Erreur lors de la recherche d'artistes: ${error.message}`)
  }

  return data as Artist[]
}

/**
 * Récupère les albums d'un artiste via la jointure album_artists
 */
export async function getAlbumsByArtist(artistId: string): Promise<Album[]> {
  const { data, error } = await supabase
    .from('album_artists')
    .select(`
      album:albums(
        *,
        album_artists(
          artist:artists(name)
        )
      )
    `)
    .eq('artist_id', artistId)

  if (error) {
    throw new Error(`Erreur lors de la récupération des albums: ${error.message}`)
  }

  // Transformer la structure pour extraire les albums avec leurs artistes
  return (data || [])
    .map((item: any) => {
      if (!item.album) return null
      const artists = item.album.album_artists?.map((aa: any) => aa.artist?.name).filter(Boolean) || []
      return {
        ...item.album,
        artist: artists.join(', ') || 'Artiste inconnu',
        album_artists: undefined,
      }
    })
    .filter(Boolean) as Album[]
}
