import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventoryService';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';

// Query Keys para inventario
export const inventoryKeys = {
  all: ['inventory'],
  products: () => [...inventoryKeys.all, 'products'],
  product: (id) => [...inventoryKeys.products(), id],
  categories: () => [...inventoryKeys.all, 'categories'],
  brands: () => [...inventoryKeys.all, 'brands'],
  groups: () => [...inventoryKeys.all, 'groups'],
  descriptions: () => [...inventoryKeys.all, 'descriptions'],
  subBrands: () => [...inventoryKeys.all, 'subBrands'],
};

// Hook para obtener todos los productos
export const useProducts = (filters = {}) => {
  return useQuery({
    queryKey: inventoryKeys.products(),
    queryFn: () => inventoryService.getProducts(),
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching products:', error);
      toast.error('Error al cargar el inventario');
    },
  });
};

// Hook para obtener un producto específico
export const useProduct = (id) => {
  return useQuery({
    queryKey: inventoryKeys.product(id),
    queryFn: () => inventoryService.getProduct(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching product:', error);
      toast.error('Error al cargar el producto');
    },
  });
};

// Hook para obtener marcas
export const useBrands = () => {
  return useQuery({
    queryKey: inventoryKeys.brands(),
    queryFn: () => inventoryService.getBrands(),
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching brands:', error);
    },
  });
};

// Hook para obtener grupos
export const useGroups = () => {
  return useQuery({
    queryKey: inventoryKeys.groups(),
    queryFn: () => inventoryService.getGroups(),
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching groups:', error);
    },
  });
};

// Hook para obtener descripciones
export const useDescriptions = () => {
  return useQuery({
    queryKey: inventoryKeys.descriptions(),
    queryFn: () => inventoryService.getDescriptions(),
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching descriptions:', error);
    },
  });
};

// Hook para obtener sub-marcas
export const useSubBrands = () => {
  return useQuery({
    queryKey: inventoryKeys.subBrands(),
    queryFn: () => inventoryService.getSubBrands(),
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
    onError: (error) => {
      logger.error('Error fetching sub-brands:', error);
    },
  });
};

// Hook para crear un producto
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productData) => inventoryService.createProduct(productData),
    onSuccess: (data) => {
      logger.debug('Product created successfully:', data);
      toast.success('Producto creado exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.brands() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.groups() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.descriptions() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.subBrands() });
    },
    onError: (error) => {
      logger.error('Error creating product:', error);
      toast.error(`Error al crear el producto: ${error.message}`);
    },
  });
};

// Hook para actualizar un producto
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }) => inventoryService.updateProduct(id, updates),
    onSuccess: (data, variables) => {
      logger.debug('Product updated successfully:', data);
      toast.success('Producto actualizado exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.product(variables.id) });
    },
    onError: (error) => {
      logger.error('Error updating product:', error);
      toast.error(`Error al actualizar el producto: ${error.message}`);
    },
  });
};

// Hook para eliminar un producto
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id) => inventoryService.deleteProduct(id),
    onSuccess: (data, id) => {
      logger.debug('Product deleted successfully:', id);
      toast.success('Producto eliminado exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
      
      // Remover de cache si existe
      queryClient.removeQueries({ queryKey: inventoryKeys.product(id) });
    },
    onError: (error) => {
      logger.error('Error deleting product:', error);
      toast.error(`Error al eliminar el producto: ${error.message}`);
    },
  });
};

// Hook para actualizar stock
export const useUpdateStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, newStock, userId, reason }) => 
      inventoryService.updateStock(productId, newStock, userId, reason),
    onSuccess: (data, variables) => {
      logger.debug('Stock updated successfully:', data);
      toast.success('Stock actualizado exitosamente');
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.product(variables.productId) });
    },
    onError: (error) => {
      logger.error('Error updating stock:', error);
      toast.error(`Error al actualizar el stock: ${error.message}`);
    },
  });
};

// Hook para reducir stock por venta
export const useReduceStockForSale = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, quantity, userId }) => 
      inventoryService.reduceStockForSale(productId, quantity, userId),
    onSuccess: (data, variables) => {
      logger.debug('Stock reduced for sale successfully:', data);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: inventoryKeys.products() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.product(variables.productId) });
    },
    onError: (error) => {
      logger.error('Error reducing stock for sale:', error);
      toast.error(`Error al reducir el stock: ${error.message}`);
    },
  });
};
