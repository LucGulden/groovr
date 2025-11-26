import { Timestamp } from 'firebase/firestore';

/**
 * Convertit une Timestamp Firestore en texte de date relative
 * Exemples: "à l'instant", "il y a 5 min", "il y a 2h", "hier", "il y a 3 jours"
 */
export function getRelativeTimeString(timestamp: Timestamp | null | undefined): string {
  // Gérer le cas où timestamp est null (serverTimestamp pas encore résolu)
  if (!timestamp) {
    return "à l'instant";
  }

  const now = Date.now();
  const date = timestamp.toDate();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Moins d'une minute
  if (diffSeconds < 60) {
    return "à l'instant";
  }

  // Moins d'une heure
  if (diffMinutes < 60) {
    return `il y a ${diffMinutes} min`;
  }

  // Moins d'un jour
  if (diffHours < 24) {
    return `il y a ${diffHours}h`;
  }

  // Hier
  if (diffDays === 1) {
    return 'hier';
  }

  // Moins d'une semaine
  if (diffDays < 7) {
    return `il y a ${diffDays} jours`;
  }

  // Moins d'un mois
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? 'il y a 1 semaine' : `il y a ${weeks} semaines`;
  }

  // Moins d'un an
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? 'il y a 1 mois' : `il y a ${months} mois`;
  }

  // Plus d'un an
  const years = Math.floor(diffDays / 365);
  return years === 1 ? 'il y a 1 an' : `il y a ${years} ans`;
}

/**
 * Formate une date Firestore en format court (ex: "12 nov 2024")
 */
export function formatShortDate(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) {
    return "Date inconnue";
  }

  const date = timestamp.toDate();
  const months = [
    'jan', 'fév', 'mar', 'avr', 'mai', 'juin',
    'juil', 'août', 'sep', 'oct', 'nov', 'déc'
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Formate une date Firestore en format complet (ex: "12 novembre 2024 à 14:30")
 */
export function formatFullDate(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) {
    return "Date inconnue";
  }

  const date = timestamp.toDate();
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${day} ${month} ${year} à ${hours}:${minutes}`;
}
