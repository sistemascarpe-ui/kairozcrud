import { supabase } from '../lib/supabase';

export const abonosService = {
  // Obtener todos los abonos de una venta
  async getAbonosByVentaId(ventaId) {
    try {
      const { data, error } = await supabase
        .from('abonos')
        .select(`
          *,
          usuarios:creado_por_id (id, nombre, apellido)
        `)
        .eq('venta_id', ventaId)
        .order('fecha_abono', { ascending: true });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Crear un nuevo abono
  async createAbono(abonoData) {
    try {
      const { data, error } = await supabase
        .from('abonos')
        .insert([abonoData])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Calcular el saldo pendiente de una venta
  async getSaldoPendiente(ventaId) {
    try {
      // Obtener el total de la venta
      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .select('total')
        .eq('id', ventaId)
        .single();

      if (ventaError) {
        return { saldo: 0, error: ventaError.message };
      }

      // Obtener la suma de todos los abonos
      const { data: abonos, error: abonosError } = await supabase
        .from('abonos')
        .select('monto')
        .eq('venta_id', ventaId);

      if (abonosError) {
        return { saldo: venta.total, error: abonosError.message };
      }

      const totalAbonos = abonos.reduce((sum, abono) => sum + parseFloat(abono.monto || 0), 0);
      const saldoPendiente = parseFloat(venta.total) - totalAbonos;

      return { saldo: Math.max(0, saldoPendiente), error: null };
    } catch (error) {
      return { saldo: 0, error: error?.message };
    }
  },

  // Verificar si una venta está completamente pagada y marcarla como completada
  async verificarYCompletarVenta(ventaId) {
    try {
      const { saldo, error } = await this.getSaldoPendiente(ventaId);
      
      if (error) {
        return { data: null, error };
      }

      // Si el saldo es 0 o menor, marcar como completada
      if (saldo <= 0) {
        const { data, error: updateError } = await supabase
          .from('ventas')
          .update({ estado: 'completada' })
          .eq('id', ventaId)
          .select()
          .single();

        if (updateError) {
          return { data: null, error: updateError.message };
        }

        return { data: { completada: true, saldo }, error: null };
      }

      return { data: { completada: false, saldo }, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Obtener estadísticas de abonos para una venta
  async getEstadisticasAbonos(ventaId) {
    try {
      const { data: abonos, error } = await supabase
        .from('abonos')
        .select('monto, fecha_abono')
        .eq('venta_id', ventaId)
        .order('fecha_abono', { ascending: true });

      if (error) {
        return { data: null, error: error.message };
      }

      const totalAbonos = abonos.reduce((sum, abono) => sum + parseFloat(abono.monto || 0), 0);
      const cantidadAbonos = abonos.length;
      const primerAbono = abonos.length > 0 ? abonos[0].fecha_abono : null;
      const ultimoAbono = abonos.length > 0 ? abonos[abonos.length - 1].fecha_abono : null;

      return {
        data: {
          totalAbonos,
          cantidadAbonos,
          primerAbono,
          ultimoAbono,
          abonos
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Obtener estadísticas generales de pagos de adeudos
  async getEstadisticasPagosAdeudos() {
    try {
      // Obtener todos los abonos
      const { data: abonos, error: abonosError } = await supabase
        .from('abonos')
        .select('monto, fecha_abono, venta_id');

      if (abonosError) {
        return { data: null, error: abonosError.message };
      }

      // Obtener todas las ventas pendientes para calcular el total de adeudos
      const { data: ventasPendientes, error: ventasError } = await supabase
        .from('ventas')
        .select('id, total')
        .eq('estado', 'pendiente');

      if (ventasError) {
        return { data: null, error: ventasError.message };
      }

      // Calcular estadísticas
      const totalPagos = abonos.reduce((sum, abono) => sum + parseFloat(abono.monto || 0), 0);
      const cantidadPagos = abonos.length;
      const totalAdeudos = ventasPendientes.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);
      const cantidadAdeudos = ventasPendientes.length;

      // Calcular pagos por período (último mes)
      const unMesAtras = new Date();
      unMesAtras.setMonth(unMesAtras.getMonth() - 1);
      
      const pagosUltimoMes = abonos.filter(abono => 
        new Date(abono.fecha_abono) >= unMesAtras
      );
      const totalPagosUltimoMes = pagosUltimoMes.reduce((sum, abono) => sum + parseFloat(abono.monto || 0), 0);

      return {
        data: {
          totalPagos,
          cantidadPagos,
          totalAdeudos,
          cantidadAdeudos,
          totalPagosUltimoMes,
          cantidadPagosUltimoMes: pagosUltimoMes.length,
          porcentajeRecuperado: totalAdeudos > 0 ? (totalPagos / (totalPagos + totalAdeudos)) * 100 : 0
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  }
};
