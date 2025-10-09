// Sistema de logging condicional para desarrollo/producción
const isDev = import.meta.env.DEV;

export const logger = {
  // Solo en desarrollo
  log: isDev ? console.log : () => {},
  warn: isDev ? console.warn : () => {},
  error: console.error, // Siempre mostrar errores
  info: isDev ? console.info : () => {},
  debug: isDev ? console.debug : () => {},
  
  // Para métricas importantes (siempre activo)
  metric: console.log,
  
  // Para errores críticos (siempre activo)
  critical: console.error,
  
  // Para analytics/telemetría (siempre activo)
  analytics: console.log
};

// Función helper para formatear logs
export const logWithContext = (context, message, data = null) => {
  if (isDev) {
    console.group(`🔍 ${context}`);
    console.log(message);
    if (data) console.log(data);
    console.groupEnd();
  }
};

// Función para performance
export const logPerformance = (operation, startTime) => {
  if (isDev) {
    const duration = performance.now() - startTime;
    console.log(`⚡ ${operation}: ${duration.toFixed(2)}ms`);
  }
};
