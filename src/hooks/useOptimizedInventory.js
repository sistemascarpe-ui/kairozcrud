import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventoryService';

// Hook optimizado para obtener resumen de productos con paginación
export const useOptimizedProducts = (page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  
  return useQuery({
    queryKey: ['products-summary', page, limit],
    queryFn: () => inventoryService.getProductsSummary(limit, offset),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 20 * 60 * 1000, // 20 minutos (updated from cacheTime)
    keepPreviousData: true,
    retry: 1, // Limit retries
    retryDelay: 2000, // 2 second delay between retries
  });
};

// Hook para obtener el conteo total de productos
export const useProductsCount = () => {
  return useQuery({
    queryKey: ['products-count'],
    queryFn: () => inventoryService.getProductsCount(),
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos (updated from cacheTime)
    retry: 1, // Limit retries
    retryDelay: 2000, // 2 second delay between retries
  });
};