import { supabase } from '../supabaseClient';
import type { Album, Vinyl, UserVinyl, UserVinylWithDetails, UserVinylType } from '../types/vinyl';

const ITEMS_PER_PAGE = 20;

/**
 * Récupère les vinyles d'un utilisateur avec pagination
 */
export async function getUserVinyls(
  userId: string,
  type: UserVinylType,
  limit: number = ITEMS_PER_PAGE,
  lastAddedAt?: string
): Promise<UserVinylWithDetails[]> {
  let query = supabase
    .from('user_vinyls')
    .select(`
      *,
      vinyl:vinyls(*),
      album:vinyls(album:albums(*))
    `)
    .eq('user_id', userId)
    .eq('type', type)
    .order('added_at', { ascending: false })
    .limit(limit);

  // Cursor-based pagination
  if (lastAddedAt) {
    query = query.lt('added_at', lastAddedAt);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erreur lors de la récupération des vinyles: ${error.message}`);
  }

  // Transformer la structure pour avoir album au même niveau que vinyl
  return (data || []).map((item: any) => ({
    ...item,
    album: item.album?.album || null,
  })) as UserVinylWithDetails[];
}

/**
 * Compte le nombre total de vinyles
 */
export async function getUserVinylsCount(
  userId: string,
  type: UserVinylType
): Promise<number> {
  const { count, error } = await supabase
    .from('user_vinyls')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', type);

  if (error) {
    throw new Error(`Erreur lors du comptage: ${error.message}`);
  }

  return count || 0;
}

/**
 * Vérifie si un vinyle existe déjà dans la collection/wishlist de l'utilisateur
 */
export async function hasVinyl(
  userId: string,
  vinylId: string,
  type: UserVinylType
): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_vinyls')
    .select('id')
    .eq('user_id', userId)
    .eq('release_id', vinylId)
    .eq('type', type);

  if (error) {
    console.error('Erreur lors de la vérification:', error);
    return false;
  }

  return data.length > 0;
}

/**
 * Ajoute un vinyle à la collection ou wishlist
 */
export async function addVinylToUser(
  userId: string,
  vinylId: string,
  type: UserVinylType
): Promise<UserVinyl> {
  // Vérifier si déjà présent
  const exists = await hasVinyl(userId, vinylId, type);
  if (exists) {
    throw new Error(`Ce vinyle est déjà dans votre ${type === 'collection' ? 'collection' : 'wishlist'}`);
  }

  const { data, error } = await supabase
    .from('user_vinyls')
    .insert({
      user_id: userId,
      release_id: vinylId,
      type,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de l'ajout: ${error.message}`);
  }

  return data as UserVinyl;
}

/**
 * Retire un vinyle de la collection ou wishlist
 */
export async function removeVinylFromUser(
  userId: string,
  vinylId: string,
  type: UserVinylType
): Promise<void> {
  const { error } = await supabase
    .from('user_vinyls')
    .delete()
    .eq('user_id', userId)
    .eq('release_id', vinylId)
    .eq('type', type);

  if (error) {
    throw new Error(`Erreur lors de la suppression: ${error.message}`);
  }
}

/**
 * Déplace un vinyle de la wishlist vers la collection
 */
export async function moveToCollection(
  userId: string,
  vinylId: string
): Promise<void> {
  // Vérifier qu'il est dans la wishlist
  const inWishlist = await hasVinyl(userId, vinylId, 'wishlist');
  if (!inWishlist) {
    throw new Error('Ce vinyle n\'est pas dans votre wishlist');
  }

  // Vérifier qu'il n'est pas déjà dans la collection
  const inCollection = await hasVinyl(userId, vinylId, 'collection');
  if (inCollection) {
    throw new Error('Ce vinyle est déjà dans votre collection');
  }

  // Retirer de la wishlist
  await removeVinylFromUser(userId, vinylId, 'wishlist');

  // Ajouter à la collection
  await addVinylToUser(userId, vinylId, 'collection');
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
  ]);

  return {
    collectionCount,
    wishlistCount,
  };
}

/**
 * Recherche d'albums dans la base de données
 */
export async function searchAlbums(
  query: string,
  limit: number = 20
): Promise<Album[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .or(`title.ilike.${searchTerm},artist.ilike.${searchTerm}`)
    .order('artist', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Erreur lors de la recherche: ${error.message}`);
  }

  return data as Album[];
}

/**
 * Récupère tous les pressages vinyles d'un album
 */
export async function getVinylsByAlbum(albumId: string): Promise<Vinyl[]> {
  const { data, error } = await supabase
    .from('vinyls')
    .select('*')
    .eq('album_id', albumId)
    .order('year', { ascending: false }); // Plus récent en premier

  if (error) {
    throw new Error(`Erreur lors de la récupération des vinyles: ${error.message}`);
  }

  return data as Vinyl[];
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
  const { data, error } = await supabase
    .from('albums')
    .insert({
      title: input.title,
      artist: input.artist,
      year: input.year,
      cover_url: input.coverUrl,
      spotify_id: input.spotifyId || null,
      spotify_url: input.spotifyUrl || null,
      created_by: input.createdBy,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la création de l'album: ${error.message}`);
  }

  return data as Album;
}

/**
 * Vérifie si un album existe déjà par son spotify_id
 */
export async function getAlbumBySpotifyId(spotifyId: string): Promise<Album | null> {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .eq('spotify_id', spotifyId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Pas de résultat trouvé
      return null;
    }
    throw new Error(`Erreur lors de la recherche: ${error.message}`);
  }

  return data as Album;
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
  const { data, error } = await supabase
    .from('vinyls')
    .insert({
      album_id: input.albumId,
      title: input.title,
      artist: input.artist,
      year: input.year,
      label: input.label,
      catalog_number: input.catalogNumber,
      country: input.country,
      format: input.format,
      cover_url: input.coverUrl,
      created_by: input.createdBy,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Erreur lors de la création du vinyle: ${error.message}`);
  }

  return data as Vinyl;
}

/**
 * Met à jour la cover d'un album
 */
export async function updateAlbumCover(albumId: string, coverUrl: string): Promise<void> {
  const { error } = await supabase
    .from('albums')
    .update({ cover_url: coverUrl })
    .eq('id', albumId);

  if (error) {
    throw new Error(`Erreur lors de la mise à jour de la cover: ${error.message}`);
  }
}

/**
 * Met à jour la cover d'un vinyle
 */
export async function updateVinylCover(vinylId: string, coverUrl: string): Promise<void> {
  const { error } = await supabase
    .from('vinyls')
    .update({ cover_url: coverUrl })
    .eq('id', vinylId);

  if (error) {
    throw new Error(`Erreur lors de la mise à jour de la cover: ${error.message}`);
  }
}