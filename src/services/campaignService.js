import { supabase } from '../lib/supabase';

export const campaignService = {
  // Obtener todas las campañas
  async getCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campanas')
        .select(`
          id,
          nombre,
          identificador,
          empresa,
          fecha_inicio,
          fecha_fin,
          estado,
          ubicacion,
          observaciones,
          creado_por_id,
          created_at
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
          id,
          nombre,
          identificador,
          empresa,
          fecha_inicio,
          fecha_fin,
          estado,
          ubicacion,
          observaciones,
          creado_por_id,
          created_at
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
        .insert([campaignData], { returning: 'minimal' });

      if (error) throw error;
      return { data: null, error: null };
    } catch (error) {
      console.error('Error creando campaña:', error);
      return { data: null, error: error.message };
    }
  },

  // Actualizar campaña
  async updateCampaign(id, updates) {
    try {
      const { error } = await supabase
        .from('campanas')
        .update(updates, { returning: 'minimal' })
        .eq('id', id);

      if (error) throw error;
      return { data: null, error: null };
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
          id,
          campana_id,
          armazon_id,
          cantidad_enviada,
          cantidad_devuelta,
          estado,
          fecha_envio,
          observaciones,
          creado_por_id,
          created_at,
          armazones(
            id, sku, color, stock, precio,
            marcas(id, nombre)
          )
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

  // Obtener cantidades en campañas por armazón
  async getProductsCampaignCounts(productIds = []) {
    try {
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return { data: {}, error: null };
      }
      const { data, error } = await supabase
        .from('campana_productos')
        .select('armazon_id, cantidad_enviada, cantidad_devuelta, estado')
        .in('armazon_id', productIds);

      if (error) throw error;

      const counts = {};
      (data || []).forEach(item => {
        const id = item?.armazon_id;
        if (!id) return;
        const enviada = parseInt(item?.cantidad_enviada || 0);
        const devuelta = parseInt(item?.cantidad_devuelta || 0);
        const neta = Math.max(0, enviada - devuelta);
        counts[id] = (counts[id] || 0) + neta;
      });

      return { data: counts, error: null };
    } catch (error) {
      console.error('Error obteniendo cantidades de campañas por armazón:', error);
      return { data: {}, error: error?.message };
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
        .select('id, armazon_id, stock_disponible, stock_en_campanas')
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
          id,
          campana_id,
          usuario_id,
          asignado_por_id,
          rol,
          created_at,
          usuario:usuarios!usuario_id(id, nombre, apellido),
          asignado_por:usuarios!asignado_por_id(id, nombre, apellido)
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
        .select('usuario_id', { count: 'exact' })
        .eq('campana_id', campaignId)
        .limit(1);

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
