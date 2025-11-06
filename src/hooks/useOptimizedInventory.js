import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventoryService';

// Hook optimizado para obtener resumen de productos con paginación
export const useOptimizedProducts = (page = 1, limit = 50, filters = {}, sort = { key: 'created_at', direction: 'desc' }) => {
  const offset = (page - 1) * limit;
  
  return useQuery({
    queryKey: ['products-summary', page, limit, filters, sort],
    queryFn: () => inventoryService.getProductsSummary(limit, offset, filters, sort),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 20 * 60 * 1000, // 20 minutos (updated from cacheTime)
    keepPreviousData: true,
    retry: 1, // Limit retries
    retryDelay: 2000, // 2 second delay between retries
  });
};

// Hook para obtener el conteo total de productos
export const useProductsCount = (filters = {}) => {
  return useQuery({
    queryKey: ['products-count', filters],
    queryFn: () => inventoryService.getProductsCount(filters),
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos (updated from cacheTime)
    retry: 1, // Limit retries
    retryDelay: 2000, // 2 second delay between retries
  });
};

// Hook para obtener la suma total de unidades (stock) con filtros
export const useTotalUnits = (filters = {}) => {
  return useQuery({
    queryKey: ['products-total-units', filters],
    queryFn: () => inventoryService.getTotalUnits(filters),
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 1,
    retryDelay: 2000,
  });
};