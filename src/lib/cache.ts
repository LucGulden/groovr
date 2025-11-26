/**
 * Cache générique avec TTL (Time To Live)
 * Utilisé pour mettre en cache les albums et users et éviter les requêtes répétées
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class Cache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private ttl: number; // Time to live en millisecondes

  constructor(ttlMinutes: number = 5) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  /**
   * Récupère une valeur du cache
   * Retourne null si la clé n'existe pas ou si le TTL est expiré
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Vérifier si l'entrée est expirée
    if (age > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Ajoute une valeur au cache
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Retourne la taille du cache
   */
  size(): number {
    return this.cache.size;
  }
}

// Instances de cache pour albums et users
// TTL de 10 minutes pour les albums et users
export const albumCache = new Cache<any>(10);
export const userCache = new Cache<any>(10);

// Nettoyer le cache toutes les 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    albumCache.cleanup();
    userCache.cleanup();
  }, 5 * 60 * 1000);
}
