import { supabase } from '../lib/supabase';

export const userService = {
  // Get all users (excluding Sistemas for non-inventory use)
  async getUsers(excludeSistemas = true) {
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
          
          // Filtrar usuarios no deseados (como "kairoz")
          const filteredData = data?.filter(user => {
            const nombre = user.nombre?.toLowerCase() || '';
            const apellido = user.apellido?.toLowerCase() || '';
            const fullName = `${nombre} ${apellido}`.trim().toLowerCase();
            
            // Lista de usuarios a excluir
            const excludedUsers = ['kairoz', 'usuario', 'admin', 'test'];
            
            // Excluir Sistemas si se especifica
            if (excludeSistemas) {
              excludedUsers.push('sistemas');
            }
            
            return !excludedUsers.some(excluded => 
              nombre.includes(excluded) || 
              fullName.includes(excluded) ||
              excluded.includes(nombre)
            );
          }) || [];
          
          console.log('✅ Usuarios obtenidos exitosamente:', filteredData?.length || 0, '(filtrados)');
          return { data: filteredData, error: null };
          
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

  // Get users for inventory (including Sistemas)
  async getUsersForInventory() {
    return this.getUsers(false);
  },

  // Get user by ID
  async getUser(id) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        // Si es un error de usuario no encontrado, no es realmente un error
        if (error.code === 'PGRST116') {
          console.debug('Usuario no encontrado:', id);
          return { data: null, error: null, userNotFound: true };
        }
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      console.debug('Error al obtener usuario:', error?.message);
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