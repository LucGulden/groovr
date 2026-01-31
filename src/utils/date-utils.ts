/**
 * Convertit une date en chaîne de temps relatif (ex: "il y a 2h")
 * @param date - Date au format ISO string ou Date object
 * @returns Chaîne de temps relatif en français
 */
export function getRelativeTimeString(date: string | Date): string {
  const now = new Date()
  const past = typeof date === 'string' ? new Date(date) : date
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  // À l'instant (< 1 minute)
  if (diffInSeconds < 60) {
    return "à l'instant"
  }

  // Minutes (< 1 heure)
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `il y a ${minutes}m`
  }

  // Heures (< 24 heures)
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `il y a ${hours}h`
  }

  // Jours (< 7 jours)
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `il y a ${days}j`
  }

  // Semaines (< 30 jours)
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800)
    return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`
  }

  // Mois (< 365 jours)
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000)
    return `il y a ${months} mois`
  }

  // Années
  const years = Math.floor(diffInSeconds / 31536000)
  return `il y a ${years} an${years > 1 ? 's' : ''}`
}

/**
 * Formate une date en format lisible (ex: "31 décembre 2024")
 * @param date - Date au format ISO string ou Date object
 * @returns Date formatée en français
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Formate une date avec l'heure (ex: "31 décembre 2024 à 14:30")
 * @param date - Date au format ISO string ou Date object
 * @returns Date et heure formatées en français
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Vérifie si une date est aujourd'hui
 * @param date - Date au format ISO string ou Date object
 * @returns true si la date est aujourd'hui
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}

/**
 * Vérifie si une date était hier
 * @param date - Date au format ISO string ou Date object
 * @returns true si la date était hier
 */
export function isYesterday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  )
}