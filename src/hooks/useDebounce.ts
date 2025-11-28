import { useEffect, useState } from 'react';

/**
 * Hook pour debouncer une valeur
 *
 * Utile pour éviter des requêtes API à chaque frappe clavier.
 * La valeur retournée change uniquement après le délai spécifié.
 *
 * @param value - Valeur à debouncer
 * @param delay - Délai en millisecondes (défaut: 500ms)
 *
 * @example
 * ```typescript
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebouncedValue(searchTerm, 500);
 *
 * // debouncedSearch change seulement 500ms après la dernière frappe
 * const { data } = useSearchAlbums(debouncedSearch);
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant la fin du délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
