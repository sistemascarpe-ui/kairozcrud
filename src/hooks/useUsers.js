import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';

// Query Keys para usuarios
export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (filters) => [...userKeys.lists(), { filters }],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
};

// Hook para obtener todos los usuarios
export const useUsers = (filters = {}) => {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => userService.getUsers(),
    staleTime: 10 * 60 * 1000, // 10 minutos (usuarios no cambian frecuentemente)
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 3, // Más reintentos para usuarios (crítico para la app)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onError: (error) => {
      logger.error('Error fetching users:', error);
      toast.error('Error al cargar los usuarios');
    },
  });
};

// Hook para obtener un usuario específico
export const useUser = (id) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userService.getUser(id),
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onError: (error) => {
      logger.error('Error fetching user:', error);
      toast.error('Error al cargar el usuario');
    },
  });
};

// Hook para crear un usuario
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData) => userService.createUser(userData),
    onSuccess: (data) => {
      logger.debug('User created successfully:', data);
      toast.success('Usuario creado exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      
      // Agregar al cache si es posible
      if (data?.data?.id) {
        queryClient.setQueryData(userKeys.detail(data.data.id), data);
      }
    },
    onError: (error) => {
      logger.error('Error creating user:', error);
      toast.error(`Error al crear el usuario: ${error.message}`);
    },
  });
};

// Hook para actualizar un usuario
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }) => userService.updateUser(id, updates),
    onSuccess: (data, variables) => {
      logger.debug('User updated successfully:', data);
      toast.success('Usuario actualizado exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      
      // Actualizar cache si es posible
      if (data?.data) {
        queryClient.setQueryData(userKeys.detail(variables.id), data);
      }
    },
    onError: (error) => {
      logger.error('Error updating user:', error);
      toast.error(`Error al actualizar el usuario: ${error.message}`);
    },
  });
};

// Hook para eliminar un usuario
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: (data, id) => {
      logger.debug('User deleted successfully:', id);
      toast.success('Usuario eliminado exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      
      // Remover de cache si existe
      queryClient.removeQueries({ queryKey: userKeys.detail(id) });
    },
    onError: (error) => {
      logger.error('Error deleting user:', error);
      toast.error(`Error al eliminar el usuario: ${error.message}`);
    },
  });
};
