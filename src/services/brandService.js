import { supabase } from '../lib/supabase';

export const brandService = {
  async getBrands() {
    try {
      const { data, error } = await supabase.from('marcas').select('*').order('nombre', { ascending: true });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async createBrand(brandData) {
    try {
      const { data, error } = await supabase.from('marcas').insert([brandData]).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async updateBrand(id, updates) {
    try {
      const { data, error } = await supabase.from('marcas').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  async deleteBrand(id) {
    try {
      const { error } = await supabase.from('marcas').delete().eq('id', id);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },
};