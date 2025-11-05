import { supabase } from '../lib/supabase';

export const customerService = {
  // Get all customers
  async getCustomers() {
    try {
      const minimal = import.meta?.env?.VITE_POSTGREST_MINIMAL_SELECTS === 'true'
      const selectColumns = minimal
        ? `id, nombre, telefono, correo, empresa_id, creado_por_id, created_at,
            usuarios(nombre, apellido), empresas(id, nombre)`
        : `*, usuarios(nombre, apellido), empresas(id, nombre)`

      const { data, error } = await supabase
        .from('clientes')
        .select(selectColumns)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get customer by ID
  async getCustomer(id) {
    try {
      const minimal = import.meta?.env?.VITE_POSTGREST_MINIMAL_SELECTS === 'true'
      const selectColumns = minimal
        ? `id, nombre, telefono, correo, empresa_id, creado_por_id, created_at,
            usuarios(nombre, apellido), empresas(id, nombre)`
        : `*, usuarios(nombre, apellido), empresas(id, nombre)`
      const { data, error } = await supabase
        .from('clientes')
        .select(selectColumns)
        .eq('id', id)
        .single()
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create new customer
  async createCustomer(customerData) {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([customerData], { returning: 'minimal' })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create multiple customers
  async createMultipleCustomers(customersData) {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert(customersData, { returning: 'minimal' })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Update customer
  async updateCustomer(id, updates) {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update(updates, { returning: 'minimal' })
        .eq('id', id)
      
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
      const minimal = import.meta?.env?.VITE_POSTGREST_MINIMAL_SELECTS === 'true'
      const selectColumns = minimal
        ? `id, cliente_id, created_at,
            detalle_venta(id, cantidad, precio_unitario, subtotal),
            usuarios(nombre, apellido), empresas(id, nombre)`
        : `*, detalle_venta(*), usuarios(nombre, apellido), empresas(id, nombre)`
      const { data, error } = await supabase
        .from('notas_venta')
        .select(selectColumns)
        .eq('cliente_id', customerId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Search customers
  async searchCustomers(searchTerm) {
    try {
      const minimal = import.meta?.env?.VITE_POSTGREST_MINIMAL_SELECTS === 'true'
      const selectColumns = minimal
        ? `id, nombre, telefono, correo, empresa_id, creado_por_id, created_at,
            usuarios(nombre, apellido), empresas(id, nombre)`
        : `*, usuarios(nombre, apellido), empresas(id, nombre)`
      const { data, error } = await supabase
        .from('clientes')
        .select(selectColumns)
        .or(`nombre.ilike.%${searchTerm}%,telefono.ilike.%${searchTerm}%,correo.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  }
}
