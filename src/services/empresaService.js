import { supabase } from '../lib/supabase';

export const empresaService = {
  // Get all empresas
  async getEmpresas() {
    try {
      const { data, error } = await supabase?.from('empresas')?.select('*')?.order('nombre', { ascending: true });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get empresa by ID
  async getEmpresa(id) {
    try {
      const { data, error } = await supabase?.from('empresas')?.select('*')?.eq('id', id)?.single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create new empresa
  async createEmpresa(empresaData) {
    try {
      const { data, error } = await supabase?.from('empresas')?.insert([empresaData])?.select()?.single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Update empresa
  async updateEmpresa(id, updates) {
    try {
      const { data, error } = await supabase?.from('empresas')?.update(updates)?.eq('id', id)?.select()?.single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Delete empresa
  async deleteEmpresa(id) {
    try {
      const { error } = await supabase?.from('empresas')?.delete()?.eq('id', id);
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      return { error: error?.message };
    }
  }
};
