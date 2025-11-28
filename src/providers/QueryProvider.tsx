'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * React Query Provider avec configuration optimisée pour Groovr
 *
 * Configuration:
 * - staleTime: 1 minute (données considérées fraîches pendant 1min)
 * - gcTime: 5 minutes (cache garbage collected après 5min sans utilisation)
 * - refetchOnWindowFocus: false (pas de refetch automatique au focus)
 * - retry: 1 (1 seule retry en cas d'erreur)
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Données fraîches pendant 1 minute
            staleTime: 60 * 1000,

            // Cache maintenu pendant 5 minutes après dernière utilisation
            gcTime: 5 * 60 * 1000,

            // Pas de refetch au focus de la fenêtre
            refetchOnWindowFocus: false,

            // 1 seule retry en cas d'erreur
            retry: 1,

            // Pas de retry sur les erreurs 4xx (client errors)
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools visible uniquement en développement */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
