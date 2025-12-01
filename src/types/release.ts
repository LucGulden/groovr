import { Timestamp } from 'firebase/firestore';

export interface Release {
  id: string; // ID Firestore (document ID)
  albumId: string; // Référence à l'album parent
  
  // Titre et pochette (avec fallback sur l'album)
  title: string; // Titre alternatif de l'édition
  coverUrl: string; // URL de la cover alternative
  
  artist: string; // Artiste principal (copié depuis l'album pour faciliter l'affichage)
  year: number; // Année de l'album (copié depuis l'album pour faciliter l'affichage)
  
  // Détails de l'édition
  label: string; // Label de pressage
  catalogNumber: string; // Numéro de catalogue
  country: string; // Pays de pressage
  releaseYear: number; // Année de cette édition spécifique
  format: string; // Ex: "LP", "12\"", "2xLP"
  
  // Métadonnées
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface CreateReleaseData {
  albumId: string; // Référence à l'album parent
  
  // Titre et pochette (avec fallback sur l'album)
  title: string; // Titre alternatif de l'édition (optionnel, sinon titre de l'album)
  coverUrl: string; // URL de la cover alternative (optionnel, sinon cover de l'album)
  
  // Détails de l'édition
  label: string; // Label de pressage
  catalogNumber: string; // Numéro de catalogue
  country: string; // Pays de pressage
  releaseYear: number; // Année de cette édition spécifique
  format: string; // Ex: "LP", "12\"", "2xLP"
}

export interface updateReleaseData {
  id: string; // ID Firestore (document ID)
  albumId: string; // Référence à l'album parent
  
  // Titre et pochette (avec fallback sur l'album)
  title?: string; // Titre alternatif de l'édition (optionnel, sinon titre de l'album)
  coverUrl?: string; // URL de la cover alternative (optionnel, sinon cover de l'album)
  
  // Détails de l'édition
  label: string; // Label de pressage
  catalogNumber: string; // Numéro de catalogue
  country: string; // Pays de pressage
  releaseYear: number; // Année de cette édition spécifique
  format: string; // Ex: "LP", "12\"", "2xLP"
}
