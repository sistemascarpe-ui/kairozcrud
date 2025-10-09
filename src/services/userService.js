import { supabase } from '../lib/supabase';

export const userService = {
  // Get all users
  async getUsers() {
    try {
      console.log('🔄 Iniciando consulta de usuarios...');
      
      // Retry logic para manejar timeouts
      let retries = 3;
      let lastError = null;
      
      while (retries > 0) {
        try {
          const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .order('nombre', { ascending: true });
          
          if (error) {
            console.error('❌ Error en consulta Supabase:', error);
            throw error;
          }
          
          console.log('✅ Usuarios obtenidos exitosamente:', data?.length || 0);
          return { data, error: null };
          
        } catch (err) {
          lastError = err;
          retries--;
          console.warn(`⚠️ Intento fallido, reintentos restantes: ${retries}`, err.message);
          
          if (retries > 0) {
            // Esperar antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      throw lastError;
      
    } catch (error) {
      console.error('💥 Error final en getUsers:', error);
      return { data: null, error: error?.message || 'Error desconocido' };
    }
  },

  // Get user by ID
  async getUser(id) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create new user
  async createUser(userData) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .insert([userData])
        .select()
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Update user
  async updateUser(id, userData) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .update(userData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Delete user
  async deleteUser(id) {
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      return { error: error?.message };
    }
  },
  async getUsersByIds(ids) {
    if (!ids || ids.length === 0) return [];
    const { data, error } = await supabase.from('usuarios').select('*').in('id', ids);
    if (error) return [];
    return data;
  }
};