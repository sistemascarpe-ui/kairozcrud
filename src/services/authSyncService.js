import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

// Cache para evitar llamadas repetitivas
const userCache = new Map();
// Duración de caché configurable vía entorno; default a 15 minutos
const CACHE_DURATION = (() => {
  const raw = import.meta?.env?.VITE_AUTH_CACHE_DURATION_MS;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : (15 * 60 * 1000);
})();

export const authSyncService = {
  // Sincronizar usuario de Supabase Auth con la tabla usuarios
  async syncUser(userId, userData = {}) {
    try {
      if (!userId) {
        logger.warn('syncUser: No se proporcionó userId');
        return { data: null, error: 'ID de usuario requerido' };
      }

      // Verificar cache primero
      const cacheKey = `user_${userId}`;
      const cached = userCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        logger.debug('Returning cached user data for:', userId);
        return cached.result;
      }

      // Verificar si el usuario ya existe en la tabla usuarios
      const { data: existingUser, error: checkError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido')
        .eq('id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error('Error al verificar usuario existente:', checkError);
        const errorResult = { data: null, error: checkError.message };
        // Cache error result for a shorter time to avoid repeated failures
        userCache.set(cacheKey, { result: errorResult, timestamp: Date.now() });
        return errorResult;
      }

      let result;
      if (existingUser) {
        logger.debug('Usuario ya existe en tabla usuarios:', existingUser);
        result = { data: existingUser, error: null };
      } else {
        // NO crear usuario automáticamente para evitar duplicados en selectores
        // Solo devolver null para que el sistema maneje el caso sin usuario
        // Usar debug en lugar de warn para reducir ruido en consola
        logger.debug(`Usuario de auth ${userId} no existe en tabla usuarios, pero no se creará automáticamente para evitar duplicados`);
        result = { data: null, error: null, userNotFound: true }; // Cambiar error por flag
      }

      // Cache the result
      userCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;

    } catch (error) {
      logger.error('Error en syncUser:', error);
      const errorResult = { data: null, error: error.message };
      // Cache error for shorter time
      const cacheKey = `user_${userId}`;
      userCache.set(cacheKey, { result: errorResult, timestamp: Date.now() });
      return errorResult;
    }
  },

  // Obtener o crear usuario actual
  async getCurrentUserSync() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        logger.warn('No hay usuario autenticado');
        return { data: null, error: 'No hay usuario autenticado' };
      }

      // Sincronizar el usuario
      const result = await this.syncUser(user.id);
      
      if (result.error) {
        logger.error('Error al sincronizar usuario:', result.error);
        return { data: null, error: result.error };
      }

      // Si el usuario no se encuentra en la tabla usuarios, devolver null sin error
      if (result.userNotFound) {
        logger.debug('Usuario autenticado pero no encontrado en tabla usuarios');
        return { data: null, error: null, userNotFound: true };
      }

      return { data: result.data, error: null };

    } catch (error) {
      logger.error('Error en getCurrentUserSync:', error);
      return { data: null, error: error.message };
    }
  }
};
