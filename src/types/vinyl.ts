export interface Artist {
  id: string;
  name: string;
  spotifyId: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface Vinyl {
  id: string;
  albumId: string;
  title: string;
  artist: string;
  coverUrl: string;
  year: number;
  label: string;
  catalogNumber: string;
  country: string;
  format: string;
  createdBy: string | null;
  createdAt: string;
}

export interface Album {
  id: string;
  spotifyId: string | null;
  spotifyUrl: string | null;
  title: string;
  artist: string;
  coverUrl: string;
  year: number;
  createdBy: string | null;
  createdAt: string;
}

export interface UserVinyl {
  id: string;
  userId: string;
  releaseId: string;
  type: UserVinylType;
  addedAt: string;
}

export interface UserVinylWithDetails extends UserVinyl {
  vinyl: Vinyl;
  album: Album;
}

export type UserVinylType = 'collection' | 'wishlist';