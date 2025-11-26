import { useQuery } from '@tanstack/react-query';
import { salesService } from '../services/salesService';

// Hook optimizado para obtener ventas completas con productos, armazones y micas
export const useOptimizedSales = (page = 1, limit = 20) => {
  const hasLimit = typeof limit === 'number';
  const offset = hasLimit ? (page - 1) * limit : null;
  
  return useQuery({
    queryKey: ['sales-notes', hasLimit ? page : 'all', hasLimit ? limit : 'all'],
    queryFn: () => salesService.getSalesNotes(hasLimit ? limit : null, offset),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (updated from cacheTime)
    keepPreviousData: true,
    retry: 1, // Limit retries
    retryDelay: 2000, // 2 second delay between retries
  });
};

// Hook para obtener el conteo total de ventas
export const useSalesCount = () => {
  return useQuery({
    queryKey: ['sales-count'],
    queryFn: () => salesService.getSalesCount(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos (updated from cacheTime)
    retry: 1, // Limit retries
    retryDelay: 2000, // 2 second delay between retries
  });
};

// Hook optimizado para obtener ventas de campaña
export const useOptimizedCampaignSales = (page = 1, limit = 20) => {
  const hasLimit = typeof limit === 'number';
  const offset = hasLimit ? (page - 1) * limit : null;
  return useQuery({
    queryKey: ['campaign-sales-notes', hasLimit ? page : 'all', hasLimit ? limit : 'all'],
    queryFn: () => salesService.getCampaignSalesNotes(hasLimit ? limit : null, offset),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    keepPreviousData: true,
    retry: 1,
    retryDelay: 2000,
  });
};

// Hook para obtener el conteo total de ventas de campaña
export const useCampaignSalesCount = () => {
  return useQuery({
    queryKey: ['campaign-sales-count'],
    queryFn: () => salesService.getCampaignSalesCount(),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
    retryDelay: 2000,
  });
};

// Hook optimizado para métricas de ventas
export const useSalesMetrics = (startDate = null, endDate = null) => {
  return useQuery({
    queryKey: ['sales-metrics', startDate, endDate],
    queryFn: () => salesService.getSalesMetrics(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (updated from cacheTime)
    enabled: true,
    retry: 1, // Limit retries
    retryDelay: 2000, // 2 second delay between retries
  });
};

// Hook optimizado para top marcas
export const useTopBrands = (limit = 10) => {
  return useQuery({
    queryKey: ['top-brands', limit],
    queryFn: () => salesService.getTopBrands(limit),
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos (updated from cacheTime)
    retry: 1, // Limit retries
    retryDelay: 2000, // 2 second delay between retries
  });
};

// Hook optimizado para rendimiento de vendedores
export const useVendorPerformance = (startDate = null, endDate = null, page = 1, pageSize = 100) => {
  return useQuery({
    queryKey: ['vendor-performance', startDate, endDate, page, pageSize],
    queryFn: () => salesService.getVendorPerformance(startDate, endDate, page, pageSize),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 20 * 60 * 1000, // 20 minutos (updated from cacheTime)
    retry: 1, // Limit retries
    retryDelay: 2000, // 2 second delay between retries
  });
};

// Hook optimizado para empresas top
export const useTopCompanies = (limit = 10) => {
  return useQuery({
    queryKey: ['top-companies', limit],
    queryFn: () => salesService.getTopCompanies(limit),
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos (updated from cacheTime)
    retry: 1, // Limit retries
    retryDelay: 2000, // 2 second delay between retries
  });
};

// Hook optimizado para productos más vendidos
export const useTopProducts = (limit = 10, month = null) => {
  return useQuery({
    queryKey: ['top-products', limit, month],
    queryFn: () => salesService.getTopProducts(limit, month),
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos (updated from cacheTime)
    retry: 1, // Limit retries
    retryDelay: 2000, // 2 second delay between retries
  });
};

// Hook optimizado para datos mensuales
export const useMonthlyData = (year, month) => {
  return useQuery({
    queryKey: ['monthly-data', year, month],
    queryFn: () => salesService.getMonthlyData(year, month),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 20 * 60 * 1000, // 20 minutos (updated from cacheTime)
    enabled: !!(year && month),
    retry: 1, // Limit retries
    retryDelay: 2000, // 2 second delay between retries
  });
};
