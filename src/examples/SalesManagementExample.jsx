// EJEMPLO DE USO DE LOS NUEVOS HOOKS DE REACT QUERY
// Este archivo muestra cómo migrar de los servicios antiguos a los nuevos hooks

import React, { useState } from 'react';
import { useSales, useCreateSale, useUpdateSale, useDeleteSale } from '../hooks/useSales';
import { useCustomers } from '../hooks/useCustomers';
import { useUsers } from '../hooks/useUsers';
import { useInventory } from '../hooks/useInventory';
import toast from 'react-hot-toast';

const SalesManagementExample = () => {
  const [selectedSale, setSelectedSale] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ NUEVO: Usar hooks de React Query
  const { 
    data: sales, 
    isLoading: salesLoading, 
    error: salesError,
    refetch: refetchSales 
  } = useSales();

  const { 
    data: customers, 
    isLoading: customersLoading 
  } = useCustomers();

  const { 
    data: users, 
    isLoading: usersLoading 
  } = useUsers();

  const { 
    data: products, 
    isLoading: productsLoading 
  } = useInventory();

  // Mutaciones con React Query
  const createSaleMutation = useCreateSale();
  const updateSaleMutation = useUpdateSale();
  const deleteSaleMutation = useDeleteSale();

  // ✅ VENTAJAS DE REACT QUERY:
  // 1. Cache automático - no se vuelve a cargar si los datos están frescos
  // 2. Loading states automáticos
  // 3. Error handling centralizado
  // 4. Refetch automático en reconexión
  // 5. Optimistic updates
  // 6. Invalidation automática de queries relacionadas

  const handleCreateSale = async (saleData) => {
    try {
      // ✅ React Query maneja automáticamente:
      // - Loading state
      // - Error handling
      // - Success toast
      // - Cache invalidation
      // - Refetch de queries relacionadas
      await createSaleMutation.mutateAsync(saleData);
      
      // El modal se cierra automáticamente
      setIsModalOpen(false);
      
      // Los datos se actualizan automáticamente en toda la app
      // No necesitas hacer refetch manual
    } catch (error) {
      // El error ya se maneja en el hook
      console.error('Error creating sale:', error);
    }
  };

  const handleUpdateSale = async (id, updates) => {
    try {
      await updateSaleMutation.mutateAsync({ id, updates });
      setSelectedSale(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating sale:', error);
    }
  };

  const handleDeleteSale = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
      try {
        await deleteSaleMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting sale:', error);
      }
    }
  };

  // ✅ LOADING STATES AUTOMÁTICOS
  if (salesLoading || customersLoading || usersLoading || productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando datos...</div>
      </div>
    );
  }

  // ✅ ERROR HANDLING AUTOMÁTICO
  if (salesError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">
          Error al cargar las ventas: {salesError.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Ventas (React Query)</h1>
      
      {/* ✅ DATOS AUTOMÁTICAMENTE CACHED Y SINCRONIZADOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-semibold">Total Ventas</h3>
          <p className="text-2xl font-bold">{sales?.data?.length || 0}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="font-semibold">Total Clientes</h3>
          <p className="text-2xl font-bold">{customers?.data?.length || 0}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <h3 className="font-semibold">Total Productos</h3>
          <p className="text-2xl font-bold">{products?.data?.length || 0}</p>
        </div>
      </div>

      {/* ✅ MUTATION STATES AUTOMÁTICOS */}
      <div className="mb-4">
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={createSaleMutation.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {createSaleMutation.isPending ? 'Creando...' : 'Nueva Venta'}
        </button>
        
        <button
          onClick={() => refetchSales()}
          className="bg-gray-600 text-white px-4 py-2 rounded ml-2"
        >
          Refrescar Datos
        </button>
      </div>

      {/* Lista de ventas */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Ventas Recientes</h2>
        </div>
        <div className="divide-y">
          {sales?.data?.slice(0, 5).map((sale) => (
            <div key={sale.id} className="px-6 py-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{sale.cliente?.nombre || 'Sin cliente'}</p>
                <p className="text-gray-600">${sale.total || 0}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedSale(sale);
                    setIsModalOpen(true);
                  }}
                  disabled={updateSaleMutation.isPending}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteSale(sale.id)}
                  disabled={deleteSaleMutation.isPending}
                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {deleteSaleMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ INFORMACIÓN DE CACHE (solo en desarrollo) */}
      {import.meta.env.DEV && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Info (React Query):</h3>
          <p><strong>Sales Loading:</strong> {salesLoading ? 'Sí' : 'No'}</p>
          <p><strong>Sales Error:</strong> {salesError ? salesError.message : 'Ninguno'}</p>
          <p><strong>Create Mutation Loading:</strong> {createSaleMutation.isPending ? 'Sí' : 'No'}</p>
          <p><strong>Update Mutation Loading:</strong> {updateSaleMutation.isPending ? 'Sí' : 'No'}</p>
          <p><strong>Delete Mutation Loading:</strong> {deleteSaleMutation.isPending ? 'Sí' : 'No'}</p>
        </div>
      )}
    </div>
  );
};

export default SalesManagementExample;

/*
✅ BENEFICIOS IMPLEMENTADOS:

1. **CACHE AUTOMÁTICO**: Los datos se cachean automáticamente y no se vuelven a cargar innecesariamente

2. **LOADING STATES**: Estados de carga automáticos para queries y mutaciones

3. **ERROR HANDLING**: Manejo centralizado de errores con toasts automáticos

4. **INVALIDATION**: Cuando creas/actualizas/eliminas una venta, automáticamente se invalidan y refrescan las queries relacionadas

5. **RETRY LOGIC**: Reintentos automáticos en caso de errores de red

6. **BACKGROUND REFETCH**: Los datos se refrescan automáticamente cuando la ventana vuelve a estar activa

7. **OPTIMISTIC UPDATES**: Las mutaciones se pueden configurar para actualizar la UI inmediatamente

8. **DEVTOOLS**: Herramientas de desarrollo para debuggear el cache y las queries

9. **MEMORIA REDUCIDA**: Solo se mantienen en memoria los datos necesarios

10. **MEJOR UX**: La aplicación se siente más rápida y responsiva
*/
