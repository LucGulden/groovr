import { Timestamp } from 'firebase/firestore';

/**
 * Interface représentant un album dans Firestore
 */
export interface Album {
  id: string; // ID Firestore (document ID)
  spotifyId: string; // ID Spotify unique
  title: string;
  artist: string;
  year: number;
  coverUrl: string; // URL de la pochette haute qualité
  spotifyUrl: string; // Lien vers l'album sur Spotify
  createdAt: Timestamp;
}
