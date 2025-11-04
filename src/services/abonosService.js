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

  // Obtener abonos de una venta filtrados por rango de fechas (inclusive)
  async getAbonosByVentaIdEnRango(ventaId, fechaInicio, fechaFin) {
    try {
      // Convertir fechas a ISO string para consultas correctas en Supabase
      const startISO = fechaInicio instanceof Date ? fechaInicio.toISOString() : fechaInicio;
      const endISO = fechaFin instanceof Date ? fechaFin.toISOString() : fechaFin;

      const { data, error } = await supabase
        .from('abonos')
        .select(`
          *,
          usuarios:creado_por_id (id, nombre, apellido)
        `)
        .eq('venta_id', ventaId)
        .gte('fecha_abono', startISO)
        .lte('fecha_abono', endISO)
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
  
  // Actualizar un abono existente
  async updateAbono(abonoId, abonoData) {
    try {
      const { data, error } = await supabase
        .from('abonos')
        .update(abonoData)
        .eq('id', abonoId)
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
  },

  // Obtener abonos sobrantes de un cliente (abonos que exceden el total de sus ventas pendientes)
  async getAbonosSobrantesCliente(clienteId) {
    try {
      // Obtener todas las ventas del cliente
      const { data: ventasCliente, error: ventasError } = await supabase
        .from('ventas')
        .select('id, total, estado')
        .eq('cliente_id', clienteId);

      if (ventasError) {
        return { data: null, error: ventasError.message };
      }

      if (!ventasCliente || ventasCliente.length === 0) {
        return { data: { abonosSobrantes: 0, ventasConAbonos: [] }, error: null };
      }

      // Calcular total de abonos por venta y detectar sobrantes
      let totalAbonosSobrantes = 0;
      const ventasConAbonos = [];

      for (const venta of ventasCliente) {
        const { data: abonosVenta, error: abonosError } = await supabase
          .from('abonos')
          .select('monto')
          .eq('venta_id', venta.id);

        if (abonosError) {
          console.error(`Error getting payments for sale ${venta.id}:`, abonosError);
          continue;
        }

        const totalAbonosVenta = abonosVenta.reduce((sum, abono) => sum + parseFloat(abono.monto || 0), 0);
        const totalVenta = parseFloat(venta.total || 0);
        const sobrante = Math.max(0, totalAbonosVenta - totalVenta);

        if (sobrante > 0) {
          totalAbonosSobrantes += sobrante;
          ventasConAbonos.push({
            venta_id: venta.id,
            total: totalVenta,
            totalAbonos: totalAbonosVenta,
            sobrante: sobrante
          });
        }
      }

      return {
        data: {
          abonosSobrantes: totalAbonosSobrantes,
          ventasConAbonos: ventasConAbonos
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Aplicar abonos sobrantes a una nueva venta
  async aplicarAbonosSobrantes(clienteId, nuevaVentaId, montoMaximoAplicar) {
    try {
      const { data: abonosData, error: abonosError } = await this.getAbonosSobrantesCliente(clienteId);
      
      if (abonosError) {
        return { data: null, error: abonosError };
      }

      const { abonosSobrantes, ventasConAbonos } = abonosData;
      
      if (abonosSobrantes <= 0) {
        return { data: { aplicados: 0, mensaje: 'No hay abonos sobrantes disponibles' }, error: null };
      }

      // Calcular cuánto se puede aplicar (el menor entre sobrantes disponibles y monto máximo)
      const montoAplicar = Math.min(abonosSobrantes, montoMaximoAplicar);
      
      if (montoAplicar <= 0) {
        return { data: { aplicados: 0, mensaje: 'No se puede aplicar ningún abono' }, error: null };
      }

      // Crear el abono para la nueva venta
      const { data: nuevoAbono, error: crearError } = await supabase
        .from('abonos')
        .insert([{
          venta_id: nuevaVentaId,
          monto: montoAplicar,
          observaciones: `Abono automático aplicado desde sobrantes de ventas anteriores (Cliente ID: ${clienteId})`,
          forma_pago: 'transferencia' // Marcamos como transferencia para distinguir abonos automáticos
        }])
        .select()
        .single();

      if (crearError) {
        return { data: null, error: crearError.message };
      }

      return {
        data: {
          aplicados: montoAplicar,
          mensaje: `Se aplicaron $${montoAplicar.toFixed(2)} en abonos sobrantes`,
          abonoCreado: nuevoAbono
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  }
};
