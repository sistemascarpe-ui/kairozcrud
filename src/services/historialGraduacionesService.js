import { supabase } from '../lib/supabase';

export const historialGraduacionesService = {
  // Get historial de graduaciones by cliente_id
  async getHistorialByCliente(clienteId) {
    try {
      const { data, error } = await supabase
        .from('historial_graduaciones')
        .select(`
          *,
          usuarios(nombre, apellido)
        `)
        .eq('cliente_id', clienteId)
        .order('fecha_consulta', { ascending: false });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get single graduacion by ID
  async getGraduacion(id) {
    try {
      const { data, error } = await supabase
        .from('historial_graduaciones')
        .select(`
          *,
          usuarios(nombre, apellido)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create new graduacion
  async createGraduacion(graduacionData) {
    try {
      const { data, error } = await supabase
        .from('historial_graduaciones')
        .insert([graduacionData])
        .select(`
          *,
          usuarios(nombre, apellido)
        `)
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Update graduacion
  async updateGraduacion(id, updates) {
    try {
      const { data, error } = await supabase
        .from('historial_graduaciones')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          usuarios(nombre, apellido)
        `)
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Delete graduacion
  async deleteGraduacion(id) {
    try {
      const { error } = await supabase
        .from('historial_graduaciones')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      return { error: error?.message };
    }
  },

  // Get graduaciones by date range
  async getGraduacionesByDateRange(clienteId, fechaInicio, fechaFin) {
    try {
      const { data, error } = await supabase
        .from('historial_graduaciones')
        .select(`
          *,
          usuarios(nombre, apellido)
        `)
        .eq('cliente_id', clienteId)
        .gte('fecha_consulta', fechaInicio)
        .lte('fecha_consulta', fechaFin)
        .order('fecha_consulta', { ascending: false });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get latest graduacion for a cliente
  async getLatestGraduacion(clienteId) {
    try {
      const { data, error } = await supabase
        .from('historial_graduaciones')
        .select(`
          *,
          usuarios(nombre, apellido)
        `)
        .eq('cliente_id', clienteId)
        .order('fecha_consulta', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  }
};
