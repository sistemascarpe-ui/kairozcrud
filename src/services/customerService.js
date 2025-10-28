import { supabase } from '../lib/supabase';

export const customerService = {
  // Get all customers
  async getCustomers() {
    try {
      const { data, error } = await supabase?.from('clientes')?.select(`
          *,
          usuarios(nombre, apellido), empresas(id, nombre)
        `)?.order('created_at', { ascending: false })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get customer by ID
  async getCustomer(id) {
    try {
      const { data, error } = await supabase?.from('clientes')?.select(`
          *,
          usuarios(nombre, apellido), empresas(id, nombre)
        `)?.eq('id', id)?.single()
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create new customer
  async createCustomer(customerData) {
    try {
      const { data, error } = await supabase?.from('clientes')?.insert([customerData])?.select()?.single()
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create multiple customers
  async createMultipleCustomers(customersData) {
    try {
      const { data, error } = await supabase?.from('clientes')?.insert(customersData)?.select(`
          *,
          usuarios(nombre, apellido), empresas(id, nombre)
        `)
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Update customer
  async updateCustomer(id, updates) {
    try {
      const { data, error } = await supabase?.from('clientes')?.update(updates)?.eq('id', id)?.select(`
          *,
          usuarios(nombre, apellido), empresas(id, nombre)
        `)?.single()
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Delete customer
  async deleteCustomer(id) {
    try {
      const { error } = await supabase?.from('clientes')?.delete()?.eq('id', id)
      
      if (error) throw error
      
      return { error: null }
    } catch (error) {
      return { error: error?.message };
    }
  },
  async getCustomerById(id) {
    if (!id) return null;
    const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single();
    if (error) return null;
    return data;
  },

  // Get customer sales history
  async getCustomerSales(customerId) {
    try {
      const { data, error } = await supabase?.from('notas_venta')?.select(`
          *,
          detalle_venta(*),
          usuarios(nombre, apellido), empresas(id, nombre)
        `)?.eq('cliente_id', customerId)?.order('created_at', { ascending: false })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Search customers
  async searchCustomers(searchTerm) {
    try {
      const { data, error } = await supabase?.from('clientes')?.select(`
          *,
          usuarios(nombre, apellido), empresas(id, nombre)
        `)?.or(`nombre.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%,correo.ilike.%${searchTerm}%,empresa.ilike.%${searchTerm}%`)?.order('created_at', { ascending: false })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  }
}
