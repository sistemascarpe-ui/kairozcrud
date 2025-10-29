import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { logger } from '../utils/logger';

// Configuración del QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // OPTIMIZED: Tiempo de cache más largo para reducir egress
      staleTime: 10 * 60 * 1000, // 10 minutos
      // Tiempo de garbage collection: 20 minutos
      gcTime: 20 * 60 * 1000,
      // Reintentar automáticamente en caso de error
      retry: (failureCount, error) => {
        // No reintentar para errores 4xx (errores del cliente)
        if (error?.status >= 400 && error?.status < 500) {
          logger.warn('No retrying 4xx error:', error?.status, error?.message);
          return false;
        }
        // No reintentar para errores específicos de Supabase
        if (error?.message?.includes('406') || 
            error?.message?.includes('Failed to load resource') ||
            error?.message?.includes('server responded with a status of 406')) {
          logger.warn('No retrying Supabase 406 error:', error?.message);
          return false;
        }
        // Reintentar máximo 1 vez para reducir requests
        return failureCount < 1;
      },
      // Tiempo entre reintentos
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // OPTIMIZED: Desactivar refetch automático en focus para reducir egress
      refetchOnWindowFocus: false,
      // OPTIMIZED: Mantener refetch en reconexión pero con throttle
      refetchOnReconnect: true,
      // OPTIMIZED: Desactivar refetch en mount para queries con cache válido
      refetchOnMount: 'stale',
    },
    mutations: {
      // Reintentar mutaciones en caso de error de red
      retry: 1,
      // Tiempo entre reintentos para mutaciones
      retryDelay: 1000,
    },
  },
  logger: {
    log: logger.debug,
    warn: logger.warn,
    error: logger.error,
  },
});

const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools solo en desarrollo */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};

export default QueryProvider;
