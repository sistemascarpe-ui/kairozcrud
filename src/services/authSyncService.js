import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export const authSyncService = {
  // Sincronizar usuario de Supabase Auth con la tabla usuarios
  async syncUser(userId, userData = {}) {
    try {
      if (!userId) {
        logger.warn('syncUser: No se proporcionó userId');
        return { data: null, error: 'ID de usuario requerido' };
      }

      // Verificar si el usuario ya existe en la tabla usuarios
      const { data: existingUser, error: checkError } = await supabase
        .from('usuarios')
        .select('id, nombre, apellido')
        .eq('id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        logger.error('Error al verificar usuario existente:', checkError);
        return { data: null, error: checkError.message };
      }

      if (existingUser) {
        logger.debug('Usuario ya existe en tabla usuarios:', existingUser);
        return { data: existingUser, error: null };
      }

      // NO crear usuario automáticamente para evitar duplicados en selectores
      // Solo devolver null para que el sistema maneje el caso sin usuario
      logger.warn('Usuario de auth no existe en tabla usuarios, pero no se creará automáticamente para evitar duplicados');
      return { data: null, error: 'Usuario no encontrado en tabla usuarios' };

    } catch (error) {
      logger.error('Error en syncUser:', error);
      return { data: null, error: error.message };
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

      return { data: result.data, error: null };

    } catch (error) {
      logger.error('Error en getCurrentUserSync:', error);
      return { data: null, error: error.message };
    }
  }
};
