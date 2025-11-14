import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashboxService } from '../services/cashboxService';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';

export const cashboxKeys = {
  all: ['cashbox'],
  session: () => [...cashboxKeys.all, 'session'],
  movements: (sesionId, filtros) => [...cashboxKeys.all, 'movements', sesionId, filtros || {}],
  movementsCount: (sesionId, filtros) => [...cashboxKeys.all, 'movements-count', sesionId, filtros || {}],
  totals: (sesionId) => [...cashboxKeys.all, 'totals', sesionId],
};

export const useOpenSessionState = () => {
  return useQuery({
    queryKey: cashboxKeys.session(),
    queryFn: () => cashboxService.getOpenSession(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    onError: (error) => {
      logger.error('Error obteniendo sesión de caja:', error);
    },
  });
};

export const useOpenCashbox = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => cashboxService.openSession(payload),
    onSuccess: (data, variables) => {
      if (!variables?.silent) {
        toast.success('Caja abierta');
      }
      queryClient.invalidateQueries({ queryKey: cashboxKeys.session() });
    },
    onError: (error) => {
      logger.error('Error abriendo caja:', error);
      toast.error(error?.message || 'Error al abrir caja');
    },
  });
};

export const useCloseCashbox = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => cashboxService.closeSession(payload),
    onSuccess: () => {
      toast.success('Caja cerrada');
      queryClient.invalidateQueries({ queryKey: cashboxKeys.session() });
    },
    onError: (error) => {
      logger.error('Error cerrando caja:', error);
      toast.error(error?.message || 'Error al cerrar caja');
    },
  });
};

export const useMovements = (sesionId, page = 1, limit = 20, filtros = {}) => {
  const offset = (page - 1) * limit;
  return useQuery({
    queryKey: cashboxKeys.movements(sesionId, { page, limit, ...filtros }),
    queryFn: () => cashboxService.getMovements({ sesionId, limit, offset, filtros }),
    enabled: !!sesionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    keepPreviousData: true,
    retry: 1,
  });
};

export const useMovementsCount = (sesionId, filtros = {}) => {
  return useQuery({
    queryKey: cashboxKeys.movementsCount(sesionId, filtros),
    queryFn: () => cashboxService.getMovementsCount({ sesionId, filtros }),
    enabled: !!sesionId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });
};

export const useSessionTotals = (sesionId) => {
  return useQuery({
    queryKey: cashboxKeys.totals(sesionId),
    queryFn: () => cashboxService.getSessionTotals({ sesionId }),
    enabled: !!sesionId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
};

export const useCreateMovement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => cashboxService.createMovement(payload),
    onSuccess: (data, variables) => {
      toast.success('Movimiento registrado');
      if (variables?.sesionId) {
        queryClient.invalidateQueries({ queryKey: cashboxKeys.movements(variables.sesionId, {}) });
        queryClient.invalidateQueries({ queryKey: cashboxKeys.movementsCount(variables.sesionId, {}) });
        queryClient.invalidateQueries({ queryKey: cashboxKeys.totals(variables.sesionId) });
      }
    },
    onError: (error) => {
      logger.error('Error creando movimiento:', error);
      toast.error(error?.message || 'Error al crear movimiento');
    },
  });
};
