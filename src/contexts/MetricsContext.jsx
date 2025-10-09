import React, { createContext, useContext, useState, useCallback } from 'react';

const MetricsContext = createContext({});

export const MetricsProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Función para notificar que las métricas necesitan actualizarse
  const triggerMetricsRefresh = useCallback((source = 'unknown') => {
    console.log(`Triggering metrics refresh from: ${source}`);
    setRefreshTrigger(prev => prev + 1);
    setLastUpdate(new Date().toISOString());
  }, []);

  // Función específica para cuando se actualiza una venta
  const notifySaleUpdate = useCallback((saleData) => {
    console.log('Sale updated, refreshing metrics:', saleData);
    triggerMetricsRefresh('sale_update');
  }, [triggerMetricsRefresh]);

  // Función específica para cuando se crea una venta
  const notifySaleCreated = useCallback((saleData) => {
    console.log('Sale created, refreshing metrics:', saleData);
    triggerMetricsRefresh('sale_created');
  }, [triggerMetricsRefresh]);

  // Función específica para cuando se actualiza el inventario
  const notifyInventoryUpdate = useCallback((inventoryData) => {
    console.log('Inventory updated, refreshing metrics:', inventoryData);
    triggerMetricsRefresh('inventory_update');
  }, [triggerMetricsRefresh]);

  const value = {
    refreshTrigger,
    lastUpdate,
    triggerMetricsRefresh,
    notifySaleUpdate,
    notifySaleCreated,
    notifyInventoryUpdate
  };

  return (
    <MetricsContext.Provider value={value}>
      {children}
    </MetricsContext.Provider>
  );
};

export const useMetrics = () => {
  const context = useContext(MetricsContext);
  if (!context) {
    throw new Error('useMetrics must be used within a MetricsProvider');
  }
  return context;
};