const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SPOTIFY_API_URL = 'https://api.spotify.com/v1'

interface SpotifyToken {
  access_token: string;
  expires_at: number;
}

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
}

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  images: SpotifyImage[];
  release_date: string;
  external_urls: {
    spotify: string;
  };
}

interface SpotifySearchResponse {
  albums: {
    items: SpotifyAlbum[];
    total: number;
  };
}

export interface SpotifyAlbumResult {
  spotifyId: string;
  spotifyUrl: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  year: number | null;
}

// Token cache
let cachedToken: SpotifyToken | null = null

/**
 * Récupère un token d'accès Spotify (Client Credentials Flow)
 */
async function getAccessToken(): Promise<string> {
  // Vérifier si le token en cache est encore valide
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token
  }

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error('Clés API Spotify non configurées')
  }

  const credentials = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)

  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error('Erreur lors de l\'authentification Spotify')
  }

  const data = await response.json()

  // Mettre en cache avec une marge de 60 secondes
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in - 60) * 1000,
  }

  return cachedToken.access_token
}

/**
 * Extrait l'année depuis une date Spotify
 * Le format est YYYY, YYYY-MM, ou YYYY-MM-DD selon la précision
 */
function extractYear(releaseDate: string): number | null {
  if (!releaseDate) return null
  
  const year = parseInt(releaseDate.substring(0, 4), 10)
  return isNaN(year) ? null : year
}

/**
 * Récupère la meilleure image (la plus grande)
 */
function getBestImage(images: SpotifyImage[]): string | null {
  if (!images || images.length === 0) return null
  
  // Les images sont généralement triées par taille décroissante
  // Mais on s'assure de prendre la plus grande
  const sorted = [...images].sort((a, b) => (b.height || 0) - (a.height || 0))
  return sorted[0]?.url || null
}

/**
 * Recherche des albums sur Spotify
 * @param query - Terme de recherche
 * @param limit - Nombre de résultats (max 50)
 * @returns Liste d'albums formatés
 */
export async function searchSpotifyAlbums(
  query: string,
  limit: number = 20,
): Promise<SpotifyAlbumResult[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  const token = await getAccessToken()

  const params = new URLSearchParams({
    q: query.trim(),
    type: 'album',
    limit: Math.min(limit, 50).toString(),
  })

  const response = await fetch(`${SPOTIFY_API_URL}/search?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      // Token expiré, reset le cache et réessayer
      cachedToken = null
      return searchSpotifyAlbums(query, limit)
    }
    throw new Error('Erreur lors de la recherche Spotify')
  }

  const data: SpotifySearchResponse = await response.json()

  return data.albums.items.map((album) => ({
    spotifyId: album.id,
    spotifyUrl: album.external_urls.spotify,
    title: album.name,
    artist: album.artists.map((a) => a.name).join(', '),
    coverUrl: getBestImage(album.images),
    year: extractYear(album.release_date),
  }))
}

/**
 * Récupère les détails d'un album Spotify par son ID
 * @param spotifyId - ID Spotify de l'album
 * @returns Détails de l'album
 */
export async function getSpotifyAlbum(spotifyId: string): Promise<SpotifyAlbumResult | null> {
  if (!spotifyId) return null

  const token = await getAccessToken()

  const response = await fetch(`${SPOTIFY_API_URL}/albums/${spotifyId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 404) return null
    if (response.status === 401) {
      cachedToken = null
      return getSpotifyAlbum(spotifyId)
    }
    throw new Error('Erreur lors de la récupération de l\'album Spotify')
  }

  const album: SpotifyAlbum = await response.json()

  return {
    spotifyId: album.id,
    spotifyUrl: album.external_urls.spotify,
    title: album.name,
    artist: album.artists.map((a) => a.name).join(', '),
    coverUrl: getBestImage(album.images),
    year: extractYear(album.release_date),
  }
}