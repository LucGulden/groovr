export interface Vinyl {
  id: string;
  album_id: string;
  title: string;
  artist: string;
  cover_url: string;
  year: number;
  label: string;
  catalog_number: string;
  country: string;
  format: string;
  created_by: string | null;
  created_at: string;
}

export interface Album {
  id: string;
  spotify_id: string | null;
  spotify_url: string | null;
  title: string;
  artist: string;
  cover_url: string;
  year: number;
  created_by: string | null;
  created_at: string;
}

export interface UserVinyl {
  id: string;
  user_id: string;
  release_id: string;
  type: UserVinylType;
  added_at: string;
}

export interface UserVinylWithDetails extends UserVinyl {
  vinyl: Vinyl;
  album: Album;
}

export type UserVinylType = 'collection' | 'wishlist';