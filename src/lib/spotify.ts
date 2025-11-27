import type { SpotifySearchResult, AlbumSearchResult } from '@/types/album';

// Cache du token Spotify
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Obtient un token d'accès Spotify via Client Credentials Flow
 * Le token est caché pendant 1 heure
 */
export async function getSpotifyAccessToken(): Promise<string> {
  // Vérifier si le token caché est encore valide
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Credentials Spotify manquants dans .env.local');
  }

  try {
    // Créer le header d'authentification Basic
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Erreur Spotify Auth: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Cacher le token (valide 1 heure)
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // -1 minute de sécurité

    return data.access_token;
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token Spotify:', error);
    throw new Error('Impossible d\'obtenir le token Spotify');
  }
}

/**
 * Recherche des albums sur Spotify
 * @param query - Terme de recherche
 * @param limit - Nombre de résultats (max 50)
 */
export async function searchAlbums(
  query: string,
  limit: number = 10
): Promise<AlbumSearchResult[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  try {
    // Obtenir le token d'accès
    const token = await getSpotifyAccessToken();

    // Encoder la query pour l'URL
    const encodedQuery = encodeURIComponent(query.trim());

    // Effectuer la recherche
    const response = await fetch(
      `https://api.spotify.com/v1/search?type=album&q=${encodedQuery}&limit=${Math.min(limit, 50)}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur Spotify API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Parser et formater les résultats
    const albums: AlbumSearchResult[] = data.albums.items.map((item: SpotifySearchResult) => {
      // Extraire l'année depuis la date de sortie
      const year = parseInt(item.release_date.split('-')[0], 10);

      // Prendre la pochette de meilleure qualité (première image)
      const coverUrl = item.images[0]?.url || '/placeholder-album.png';

      // Extraire les noms des artistes
      const artist = item.artists.map(a => a.name).join(', ');

      return {
        spotifyId: item.id,
        title: item.name,
        artist,
        year,
        coverUrl,
        spotifyUrl: item.external_urls.spotify,
      };
    });

    return albums;
  } catch (error) {
    console.error('Erreur lors de la recherche Spotify:', error);
    throw new Error('Impossible de rechercher des albums sur Spotify');
  }
}

/**
 * Obtient les détails d'un album par son ID Spotify
 * @param spotifyId - ID Spotify de l'album
 */
export async function getAlbumDetails(spotifyId: string): Promise<AlbumSearchResult> {
  try {
    const token = await getSpotifyAccessToken();

    const response = await fetch(
      `https://api.spotify.com/v1/albums/${spotifyId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur Spotify API: ${response.status} ${response.statusText}`);
    }

    const item: SpotifySearchResult = await response.json();

    const year = parseInt(item.release_date.split('-')[0], 10);
    const coverUrl = item.images[0]?.url || '/placeholder-album.png';
    const artist = item.artists.map(a => a.name).join(', ');

    return {
      spotifyId: item.id,
      title: item.name,
      artist,
      year,
      coverUrl,
      spotifyUrl: item.external_urls.spotify,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de l\'album:', error);
    throw new Error('Impossible de récupérer les détails de l\'album');
  }
}
