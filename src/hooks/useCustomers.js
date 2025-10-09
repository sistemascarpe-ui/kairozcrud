import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';

// Query Keys para clientes
export const customerKeys = {
  all: ['customers'],
  lists: () => [...customerKeys.all, 'list'],
  list: (filters) => [...customerKeys.lists(), { filters }],
  details: () => [...customerKeys.all, 'detail'],
  detail: (id) => [...customerKeys.details(), id],
  stats: () => [...customerKeys.all, 'stats'],
  appointments: () => [...customerKeys.all, 'appointments'],
  graduations: (customerId) => [...customerKeys.all, 'graduations', customerId],
};

// Hook para obtener todos los clientes
export const useCustomers = (filters = {}) => {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: () => customerService.getCustomers(),
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching customers:', error);
      toast.error('Error al cargar los clientes');
    },
  });
};

// Hook para obtener un cliente específico
export const useCustomer = (id) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customerService.getCustomer(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching customer:', error);
      toast.error('Error al cargar el cliente');
    },
  });
};

// Hook para obtener estadísticas de clientes
export const useCustomerStats = () => {
  return useQuery({
    queryKey: customerKeys.stats(),
    queryFn: () => customerService.getCustomerStats(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching customer stats:', error);
    },
  });
};

// Hook para obtener citas de clientes
export const useCustomerAppointments = (filters = {}) => {
  return useQuery({
    queryKey: customerKeys.appointments(),
    queryFn: () => customerService.getAppointments(filters),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching appointments:', error);
      toast.error('Error al cargar las citas');
    },
  });
};

// Hook para obtener historial de graduaciones de un cliente
export const useCustomerGraduations = (customerId) => {
  return useQuery({
    queryKey: customerKeys.graduations(customerId),
    queryFn: () => customerService.getHistorialGraduaciones(customerId),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching graduations:', error);
      toast.error('Error al cargar el historial de graduaciones');
    },
  });
};

// Hook para crear un cliente
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (customerData) => customerService.createCustomer(customerData),
    onSuccess: (data) => {
      logger.debug('Customer created successfully:', data);
      toast.success('Cliente creado exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
      
      // Agregar al cache si es posible
      if (data?.data?.id) {
        queryClient.setQueryData(customerKeys.detail(data.data.id), data);
      }
    },
    onError: (error) => {
      logger.error('Error creating customer:', error);
      toast.error(`Error al crear el cliente: ${error.message}`);
    },
  });
};

// Hook para actualizar un cliente
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }) => customerService.updateCustomer(id, updates),
    onSuccess: (data, variables) => {
      logger.debug('Customer updated successfully:', data);
      toast.success('Cliente actualizado exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
      
      // Actualizar cache si es posible
      if (data?.data) {
        queryClient.setQueryData(customerKeys.detail(variables.id), data);
      }
    },
    onError: (error) => {
      logger.error('Error updating customer:', error);
      toast.error(`Error al actualizar el cliente: ${error.message}`);
    },
  });
};

// Hook para eliminar un cliente
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => customerService.deleteCustomer(id),
    onSuccess: (data, id) => {
      logger.debug('Customer deleted successfully:', id);
      toast.success('Cliente eliminado exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
      
      // Remover de cache si existe
      queryClient.removeQueries({ queryKey: customerKeys.detail(id) });
      queryClient.removeQueries({ queryKey: customerKeys.graduations(id) });
    },
    onError: (error) => {
      logger.error('Error deleting customer:', error);
      toast.error(`Error al eliminar el cliente: ${error.message}`);
    },
  });
};

// Hook para crear una cita
export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appointmentData) => customerService.createAppointment(appointmentData),
    onSuccess: (data) => {
      logger.debug('Appointment created successfully:', data);
      toast.success('Cita creada exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: customerKeys.appointments() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
    },
    onError: (error) => {
      logger.error('Error creating appointment:', error);
      toast.error(`Error al crear la cita: ${error.message}`);
    },
  });
};

// Hook para actualizar una cita
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }) => customerService.updateAppointment(id, updates),
    onSuccess: (data, variables) => {
      logger.debug('Appointment updated successfully:', data);
      toast.success('Cita actualizada exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: customerKeys.appointments() });
    },
    onError: (error) => {
      logger.error('Error updating appointment:', error);
      toast.error(`Error al actualizar la cita: ${error.message}`);
    },
  });
};

// Hook para eliminar una cita
export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => customerService.deleteAppointment(id),
    onSuccess: (data, id) => {
      logger.debug('Appointment deleted successfully:', id);
      toast.success('Cita eliminada exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: customerKeys.appointments() });
      queryClient.invalidateQueries({ queryKey: customerKeys.stats() });
    },
    onError: (error) => {
      logger.error('Error deleting appointment:', error);
      toast.error(`Error al eliminar la cita: ${error.message}`);
    },
  });
};

// Hook para agregar graduación a un cliente
export const useCreateGraduation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (graduationData) => customerService.createHistorialGraduacion(graduationData),
    onSuccess: (data, variables) => {
      logger.debug('Graduation created successfully:', data);
      toast.success('Graduación agregada exitosamente');
      
      // Invalidar queries relacionadas
      if (variables.cliente_id) {
        queryClient.invalidateQueries({ queryKey: customerKeys.graduations(variables.cliente_id) });
        queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.cliente_id) });
      }
    },
    onError: (error) => {
      logger.error('Error creating graduation:', error);
      toast.error(`Error al agregar la graduación: ${error.message}`);
    },
  });
};

// Hook para actualizar una graduación
export const useUpdateGraduation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }) => customerService.updateHistorialGraduacion(id, updates),
    onSuccess: (data, variables) => {
      logger.debug('Graduation updated successfully:', data);
      toast.success('Graduación actualizada exitosamente');
      
      // Invalidar queries relacionadas
      if (variables.cliente_id) {
        queryClient.invalidateQueries({ queryKey: customerKeys.graduations(variables.cliente_id) });
        queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.cliente_id) });
      }
    },
    onError: (error) => {
      logger.error('Error updating graduation:', error);
      toast.error(`Error al actualizar la graduación: ${error.message}`);
    },
  });
};

// Hook para eliminar una graduación
export const useDeleteGraduation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => customerService.deleteHistorialGraduacion(id),
    onSuccess: (data, id) => {
      logger.debug('Graduation deleted successfully:', id);
      toast.success('Graduación eliminada exitosamente');
      
      // Invalidar todas las queries de graduaciones ya que no sabemos el cliente_id
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
    },
    onError: (error) => {
      logger.error('Error deleting graduation:', error);
      toast.error(`Error al eliminar la graduación: ${error.message}`);
    },
  });
};
