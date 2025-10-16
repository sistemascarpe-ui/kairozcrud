import { supabase } from '../lib/supabase';

export const campaignService = {
  // Obtener todas las campañas
  async getCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campanas')
        .select(`
          *,
          creado_por:usuarios!creado_por_id(id, nombre, apellido)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo campañas:', error);
      return { data: null, error: error.message };
    }
  },

  // Obtener campaña por ID
  async getCampaign(id) {
    try {
      const { data, error } = await supabase
        .from('campanas')
        .select(`
          *,
          creado_por:usuarios!creado_por_id(id, nombre, apellido)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo campaña:', error);
      return { data: null, error: error.message };
    }
  },

  // Crear nueva campaña
  async createCampaign(campaignData) {
    try {
      const { data, error } = await supabase
        .from('campanas')
        .insert([campaignData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creando campaña:', error);
      return { data: null, error: error.message };
    }
  },

  // Actualizar campaña
  async updateCampaign(id, updates) {
    try {
      const { data, error } = await supabase
        .from('campanas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error actualizando campaña:', error);
      return { data: null, error: error.message };
    }
  },

  // Eliminar campaña
  async deleteCampaign(id) {
    try {
      const { data, error } = await supabase
        .from('campanas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error eliminando campaña:', error);
      return { data: null, error: error.message };
    }
  },

  // Obtener productos de una campaña
  async getCampaignProducts(campaignId) {
    try {
      const { data, error } = await supabase
        .from('campana_productos')
        .select(`
          *,
          armazones(
            id, sku, color, stock, precio,
            marcas(id, nombre),
            grupos(id, nombre),
            sub_marcas(id, nombre),
            descripciones(id, nombre)
          ),
          usuarios(id, nombre, apellido)
        `)
        .eq('campana_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo productos de campaña:', error);
      return { data: null, error: error.message };
    }
  },

  // Enviar producto a campaña
  async sendProductToCampaign(campaignId, productId, quantity, sentBy, observations = null) {
    try {
      const { data, error } = await supabase.rpc('enviar_producto_a_campana', {
        p_campana_id: campaignId,
        p_armazon_id: productId,
        p_cantidad: quantity,
        p_enviado_por_id: sentBy,
        p_observaciones: observations
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error enviando producto a campaña:', error);
      return { data: null, error: error.message };
    }
  },

  // Devolver producto de campaña
  async returnProductFromCampaign(campaignProductId, quantity, observations = null) {
    try {
      const { data, error } = await supabase.rpc('devolver_producto_de_campana', {
        p_campana_producto_id: campaignProductId,
        p_cantidad_devolver: quantity,
        p_observaciones: observations
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error devolviendo producto de campaña:', error);
      return { data: null, error: error.message };
    }
  },

  // Obtener stock disponible de un producto (disponible vs en campaña)
  async getProductStockInfo(productId) {
    try {
      const { data, error } = await supabase
        .from('stock_armazones')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo información de stock:', error);
      return { data: null, error: error.message };
    }
  },

  // Obtener todas las campañas activas
  async getActiveCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campanas')
        .select('id, nombre, empresa, fecha_inicio, fecha_fin')
        .eq('estado', 'activa')
        .order('fecha_inicio', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo campañas activas:', error);
      return { data: null, error: error.message };
    }
  },

  // Obtener miembros de una campaña
  async getCampaignMembers(campaignId) {
    try {
      const { data, error } = await supabase
        .from('campana_miembros')
        .select(`
          *,
          usuario:usuarios!usuario_id(id, nombre, apellido),
          asignado_por:usuarios!asignado_por_id(id, nombre, apellido),
          campana:campanas!campana_id(id, nombre)
        `)
        .eq('campana_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error obteniendo miembros de campaña:', error);
      return { data: null, error: error.message };
    }
  },

  // Agregar miembro a campaña
  async addMemberToCampaign(campaignId, userId, assignedBy, role = 'miembro') {
    try {
      const { data, error } = await supabase.rpc('agregar_miembro_a_campana', {
        p_campana_id: campaignId,
        p_usuario_id: userId,
        p_asignado_por_id: assignedBy,
        p_rol: role
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error agregando miembro a campaña:', error);
      return { data: null, error: error.message };
    }
  },

  // Remover miembro de campaña
  async removeMemberFromCampaign(campaignId, userId) {
    try {
      const { data, error } = await supabase.rpc('remover_miembro_de_campana', {
        p_campana_id: campaignId,
        p_usuario_id: userId
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error removiendo miembro de campaña:', error);
      return { data: null, error: error.message };
    }
  },

  // Obtener conteo de miembros de una campaña
  async getCampaignMembersCount(campaignId) {
    try {
      const { count, error } = await supabase
        .from('campana_miembros')
        .select('*', { count: 'exact', head: true })
        .eq('campana_id', campaignId);

      if (error) throw error;
      return { count, error: null };
    } catch (error) {
      console.error('Error obteniendo conteo de miembros:', error);
      return { count: 0, error: error.message };
    }
  },

  // Verificar si un usuario es miembro de una campaña
  async isUserCampaignMember(campaignId, userId) {
    try {
      const { data, error } = await supabase
        .from('campana_miembros')
        .select('rol')
        .eq('campana_id', campaignId)
        .eq('usuario_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return { 
        isMember: !!data, 
        role: data?.rol || null, 
        error: null 
      };
    } catch (error) {
      console.error('Error verificando membresía:', error);
      return { isMember: false, role: null, error: error.message };
    }
  }
};
