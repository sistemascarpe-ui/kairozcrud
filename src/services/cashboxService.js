import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export const cashboxService = {
  async getOpenSession() {
    try {
      const { data, error } = await supabase
        .from('caja_sesiones')
        .select('*')
        .eq('estado', 'abierta')
        .order('fecha_apertura', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return { data: data || null, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  async ensureOpenSession({ usuarioId = null, saldoInicial = 0, observaciones = '' } = {}) {
    try {
      const res = await this.getOpenSession();
      if (res.data) return { data: res.data, error: null };
      const opened = await this.openSession({ usuarioId, saldoInicial, observaciones });
      return opened;
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  async openSession({ usuarioId, saldoInicial = 0, observaciones = '' }) {
    try {
      const existing = await this.getOpenSession();
      if (existing.data) {
        return { data: null, error: 'Ya existe una sesión de caja abierta' };
      }
      const insertData = {
        usuario_apertura_id: usuarioId || null,
        saldo_inicial: parseFloat(saldoInicial || 0),
        estado: 'abierta',
        observaciones: observaciones || '',
        fecha_apertura: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('caja_sesiones')
        .insert([insertData])
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  async closeSession({ sesionId, usuarioId, saldoCierre = 0, observaciones = '' }) {
    try {
      const updates = {
        estado: 'cerrada',
        usuario_cierre_id: usuarioId || null,
        saldo_cierre: parseFloat(saldoCierre || 0),
        observaciones: observaciones || '',
        fecha_cierre: new Date().toISOString()
      };
      const { error } = await supabase
        .from('caja_sesiones')
        .update(updates, { returning: 'minimal' })
        .eq('id', sesionId);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error?.message };
    }
  },

  async getMovements({ sesionId, limit = 50, offset = 0, filtros = {} }) {
    try {
      let query = supabase
        .from('caja_movimientos')
        .select(`
          id,
          sesion_id,
          tipo,
          monto,
          categoria,
          concepto,
          metodo_pago,
          referencia,
          venta_id,
          usuario_id,
          created_at
        `)
        .eq('sesion_id', sesionId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
      if (filtros.metodo_pago) query = query.eq('metodo_pago', filtros.metodo_pago);
      if (filtros.categoria) query = query.eq('categoria', filtros.categoria);
      if (filtros.fecha_inicio) query = query.gte('created_at', new Date(filtros.fecha_inicio).toISOString());
      if (filtros.fecha_fin) query = query.lte('created_at', new Date(filtros.fecha_fin).toISOString());
      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: [], error: error?.message };
    }
  },

  async getMovementsCount({ sesionId, filtros = {} }) {
    try {
      let query = supabase
        .from('caja_movimientos')
        .select('id', { count: 'exact' })
        .eq('sesion_id', sesionId)
        .limit(1);
      if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
      if (filtros.metodo_pago) query = query.eq('metodo_pago', filtros.metodo_pago);
      if (filtros.categoria) query = query.eq('categoria', filtros.categoria);
      if (filtros.fecha_inicio) query = query.gte('created_at', new Date(filtros.fecha_inicio).toISOString());
      if (filtros.fecha_fin) query = query.lte('created_at', new Date(filtros.fecha_fin).toISOString());
      const { count, error } = await query;
      if (error) throw error;
      return { count, error: null };
    } catch (error) {
      return { count: 0, error: error?.message };
    }
  },

  async createMovement({ sesionId, tipo, monto, concepto = '', categoria = '', metodo_pago = 'efectivo', referencia = '', ventaId = null, usuarioId = null }) {
    try {
      if (!sesionId) return { data: null, error: 'Sesión de caja requerida' };
      if (!tipo || !['ingreso', 'egreso'].includes(tipo)) return { data: null, error: 'Tipo inválido' };
      const insertData = {
        sesion_id: sesionId,
        tipo,
        monto: parseFloat(monto || 0),
        concepto,
        categoria,
        metodo_pago,
        referencia,
        venta_id: ventaId,
        usuario_id: usuarioId,
        created_at: new Date().toISOString()
      };
      const { data, error } = await supabase
        .from('caja_movimientos')
        .insert([insertData])
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  async getSessionTotals({ sesionId }) {
    try {
      const ingresosRes = await supabase
        .from('caja_movimientos')
        .select('monto')
        .eq('sesion_id', sesionId)
        .eq('tipo', 'ingreso');
      if (ingresosRes.error) throw ingresosRes.error;
      const egresosRes = await supabase
        .from('caja_movimientos')
        .select('monto')
        .eq('sesion_id', sesionId)
        .eq('tipo', 'egreso');
      if (egresosRes.error) throw egresosRes.error;
      const ingresos = (ingresosRes.data || []).reduce((s, r) => s + (parseFloat(r.monto) || 0), 0);
      const egresos = (egresosRes.data || []).reduce((s, r) => s + (parseFloat(r.monto) || 0), 0);
      const { data: sesion, error: sesionError } = await supabase
        .from('caja_sesiones')
        .select('saldo_inicial')
        .eq('id', sesionId)
        .single();
      if (sesionError) throw sesionError;
      const saldoInicial = parseFloat(sesion?.saldo_inicial || 0);
      const saldoActual = saldoInicial + ingresos - egresos;
      return { data: { ingresos, egresos, saldoInicial, saldoActual }, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  }
};

export default cashboxService;
