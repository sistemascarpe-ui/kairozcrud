import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../services/salesService';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';

// Query Keys - Centralizadas para consistencia
export const salesKeys = {
  all: ['sales'],
  lists: () => [...salesKeys.all, 'list'],
  list: (filters) => [...salesKeys.lists(), { filters }],
  details: () => [...salesKeys.all, 'detail'],
  detail: (id) => [...salesKeys.details(), id],
  stats: () => [...salesKeys.all, 'stats'],
  byVendor: () => [...salesKeys.all, 'byVendor'],
  bestSelling: () => [...salesKeys.all, 'bestSelling'],
  byPeriod: (period) => [...salesKeys.all, 'byPeriod', period],
  outOfStock: () => [...salesKeys.all, 'outOfStock'],
};

// Hook para obtener todas las notas de venta
export const useSales = (filters = {}) => {
  return useQuery({
    queryKey: salesKeys.list(filters),
    queryFn: () => salesService.getSalesNotes(),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching sales:', error);
      toast.error('Error al cargar las notas de venta');
    },
  });
};

// Hook para obtener una nota de venta específica
export const useSale = (id) => {
  return useQuery({
    queryKey: salesKeys.detail(id),
    queryFn: () => salesService.getSalesNote(id),
    enabled: !!id, // Solo ejecutar si hay ID
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching sale:', error);
      toast.error('Error al cargar la nota de venta');
    },
  });
};

// Hook para obtener estadísticas de ventas
export const useSalesStats = () => {
  return useQuery({
    queryKey: salesKeys.stats(),
    queryFn: () => salesService.getSalesStats(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching sales stats:', error);
    },
  });
};

// Hook para obtener ventas por vendedor
export const useSalesByVendor = () => {
  return useQuery({
    queryKey: salesKeys.byVendor(),
    queryFn: () => salesService.getSalesByVendor(),
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching sales by vendor:', error);
    },
  });
};

// Hook para obtener productos más vendidos
export const useBestSellingProducts = () => {
  return useQuery({
    queryKey: salesKeys.bestSelling(),
    queryFn: () => salesService.getBestSellingProducts(),
    staleTime: 20 * 60 * 1000, // 20 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching best selling products:', error);
    },
  });
};

// Hook para obtener ventas por período
export const useSalesByPeriod = (period = 'month') => {
  return useQuery({
    queryKey: salesKeys.byPeriod(period),
    queryFn: () => salesService.getSalesByPeriod(period),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching sales by period:', error);
    },
  });
};

// Hook para crear una nueva nota de venta
export const useCreateSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (saleData) => salesService.createSalesNote(saleData),
    onSuccess: (data) => {
      logger.debug('Sale created successfully:', data);
      toast.success('Nota de venta creada exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      queryClient.invalidateQueries({ queryKey: salesKeys.byVendor() });
      queryClient.invalidateQueries({ queryKey: salesKeys.bestSelling() });
    },
    onError: (error) => {
      logger.error('Error creating sale:', error);
      toast.error(`Error al crear la nota de venta: ${error.message}`);
    },
  });
};

// Hook para actualizar una nota de venta
export const useUpdateSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }) => salesService.updateSalesNote(id, updates),
    onSuccess: (data, variables) => {
      logger.debug('Sale updated successfully:', data);
      toast.success('Nota de venta actualizada exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      queryClient.invalidateQueries({ queryKey: salesKeys.byVendor() });
      queryClient.invalidateQueries({ queryKey: salesKeys.bestSelling() });
    },
    onError: (error) => {
      logger.error('Error updating sale:', error);
      toast.error(`Error al actualizar la nota de venta: ${error.message}`);
    },
  });
};

// Hook para eliminar una nota de venta
export const useDeleteSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => salesService.deleteSalesNote(id),
    onSuccess: (data, id) => {
      logger.debug('Sale deleted successfully:', id);
      toast.success('Nota de venta eliminada exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: salesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: salesKeys.stats() });
      queryClient.invalidateQueries({ queryKey: salesKeys.byVendor() });
      queryClient.invalidateQueries({ queryKey: salesKeys.bestSelling() });
      
      // Remover de cache si existe
      queryClient.removeQueries({ queryKey: salesKeys.detail(id) });
    },
    onError: (error) => {
      logger.error('Error deleting sale:', error);
      toast.error(`Error al eliminar la nota de venta: ${error.message}`);
    },
  });
};
