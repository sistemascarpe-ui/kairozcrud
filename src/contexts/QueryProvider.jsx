import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { logger } from '../utils/logger';

// Configuración del QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo de cache por defecto: 5 minutos
      staleTime: 5 * 60 * 1000,
      // Tiempo de garbage collection: 10 minutos
      gcTime: 10 * 60 * 1000,
      // Reintentar automáticamente en caso de error
      retry: (failureCount, error) => {
        // No reintentar para errores 4xx (errores del cliente)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Reintentar máximo 3 veces para otros errores
        return failureCount < 3;
      },
      // Tiempo entre reintentos
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch automático cuando la ventana vuelve a estar activa
      refetchOnWindowFocus: true,
      // Refetch automático cuando se reconecta la red
      refetchOnReconnect: true,
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
