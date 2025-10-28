import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { authSyncService } from './authSyncService';

export const salesService = {
  // Get sales with vendor information for performance analysis
  async getSalesWithVendors() {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          *,
          clientes(nombre, telefono),
          venta_vendedores(
            vendedor_id,
            usuarios(nombre, apellido)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },
  async getSalesNotes() {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          *,
          venta_clientes ( 
            cliente_id,
            clientes:cliente_id (id, nombre, telefono, correo, empresa_id, empresas:empresa_id(id, nombre))
          ),
          venta_vendedores ( 
            vendedor_id,
            usuarios:vendedor_id (id, nombre, apellido) 
          ),
          armazones:armazon_id (id, sku, color, marcas(nombre), descripciones(nombre)),
          abonos (id, monto, fecha_abono)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }
      
      const transformedData = data.map(item => {
        // Extraer vendedores de la relación venta_vendedores
        const vendedores = (item.venta_vendedores || [])
          .map(vv => vv.usuarios)
          .filter(Boolean); // Filtrar valores null/undefined
        
        // Extraer clientes de la relación venta_clientes
        const clientes = (item.venta_clientes || [])
          .map(vc => vc.clientes)
          .filter(Boolean); // Filtrar valores null/undefined
        
        // Calcular saldo pendiente basado en abonos
        const totalAbonos = (item.abonos || []).reduce((sum, abono) => sum + parseFloat(abono.monto || 0), 0);
        const saldoPendiente = Math.max(0, parseFloat(item.total) - totalAbonos);
        const porcentajePagado = parseFloat(item.total) > 0 ? (totalAbonos / parseFloat(item.total)) * 100 : 0;
        
        return {
        id: item.id,
        folio: item.folio,
        clientes: clientes, // Ahora es un array de clientes
        cliente: clientes[0] || null, // Mantener compatibilidad con código existente (primer cliente)
        armazon: {
          ...item.armazones,
          modelo: `${item.armazones?.marcas?.nombre || 'N/A'} - ${item.armazones?.sku || 'Sin SKU'}`,
          precio: item.precio_armazon,
        },
        tipo_mica: {
          nombre: item.descripcion_micas || 'N/A',
          precio: item.precio_micas,
        },
        vendedores: vendedores,
        // Mantener los datos originales para edición
        precio_armazon: item.precio_armazon,
        precio_micas: item.precio_micas,
        descripcion_micas: item.descripcion_micas,
        descuento_armazon_monto: item.descuento_armazon_monto || 0,
        descuento_micas_monto: item.descuento_micas_monto || 0,
        descuento_monto: item.descuento_monto || 0,
        subtotal: item.subtotal,
        total: item.total,
        estado: item.estado,
        fecha_venta: item.fecha_venta,
        observaciones: item.observaciones,
        created_at: item.created_at,
        updated_at: item.updated_at,
        // Datos de facturación
        requiere_factura: item.requiere_factura || false,
        monto_iva: item.monto_iva || 0,
        rfc: item.rfc || '',
        razon_social: item.razon_social || '',
        // Datos de abonos
        abonos: item.abonos || [],
        totalAbonos: totalAbonos,
        saldoPendiente: saldoPendiente,
        porcentajePagado: Math.round(porcentajePagado),
      };
      });

      return { data: transformedData, error: null };
    } catch (error) {
      console.error('Error fetching sales notes:', error);
      return { data: null, error: error.message };
    }
  },

  async getSalesData() {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          *,
          clientes (id, nombre, telefono, correo),
          armazones (id, sku, color, precio, marcas:marca_id(nombre), descripciones:descripcion_id(nombre)),
          usuarios (id, nombre, apellido)
        `)
        .order('fecha_venta', { ascending: false });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching sales data:', error);
      throw error;
    }
  },

  async getSalesNote(id) {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`*, clientes(*), usuarios(*), armazones(*, marcas(*), descripciones(*))`)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  async createSalesNote(salesData) {
    try {
      const { items, vendedor_ids, cliente_ids, folio_manual, creado_por_id, monto_compra, abonoInicial, registrar_abono, monto_abono, forma_pago_abono, observaciones_abono, ...ventaDetails } = salesData;

      // 1. Determinar el folio a usar (manual o automático)
      let folio;
      if (folio_manual && folio_manual.trim() !== '') {
        // Caso B: Folio Manual - usar el folio ingresado por el usuario
        folio = folio_manual.trim();
        
        // Verificar que el folio manual no exista ya
        const { data: existingFolio } = await supabase
          .from('ventas')
          .select('id')
          .eq('folio', folio)
          .single();
          
        if (existingFolio) {
          return { data: null, error: `El folio "${folio}" ya existe. Por favor, usa otro folio.` };
        }

        // Si el folio manual es solo un número, verificar que no cause conflicto con folios automáticos
        const numberMatch = folio.match(/^(\d+)$/);
        if (numberMatch) {
          const manualNumber = parseInt(numberMatch[1]);
          
          // Verificar si este número ya está usado en folios automáticos del día actual
          const today = new Date();
          const mexicoToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
          const todayStr = `${mexicoToday.getFullYear()}${String(mexicoToday.getMonth() + 1).padStart(2, '0')}${String(mexicoToday.getDate()).padStart(2, '0')}`;
          
          // Obtener configuración de folios para el prefijo
          const { data: config } = await supabase
            .from('configuracion_folios')
            .select('prefijo')
            .eq('id', 1)
            .single();
            
          const prefijo = config?.prefijo || 'V';
          const autoFolio = `${prefijo}${todayStr}${String(manualNumber).padStart(6, '0')}`;
          
          const { data: conflictingAuto } = await supabase
            .from('ventas')
            .select('id')
            .eq('folio', autoFolio)
            .single();
            
          if (conflictingAuto) {
            return { data: null, error: `El número ${manualNumber} ya está usado en un folio automático (${autoFolio}). Por favor, usa otro número.` };
          }
        }
      } else {
        // Caso A: Folio Automático - generar folio único automáticamente
        folio = await this.generateUniqueFolio();
      }

      // 1.5. Obtener el usuario actual si no se proporcionó
      let usuarioActualId = creado_por_id;
      if (!usuarioActualId) {
        // Intentar obtener el usuario actual de la tabla usuarios
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          // Verificar si el usuario existe en la tabla usuarios
          const { data: usuarioExiste } = await supabase
            .from('usuarios')
            .select('id')
            .eq('id', user.id)
            .single();
          
          if (usuarioExiste) {
            usuarioActualId = user.id;
            logger.log('Usuario encontrado en tabla usuarios:', user.id);
          } else {
            logger.warn('Usuario de auth no existe en tabla usuarios, se creará venta sin creado_por_id');
            usuarioActualId = null;
          }
        } else {
          logger.warn('No hay usuario autenticado');
          usuarioActualId = null;
        }
      }

      // 2. Buscamos el armazón y las micas dentro de la lista de productos.
      const armazonItem = items.find(item => item.armazon_id);
      // Las micas son el item que NO tiene armazon_id
      const micasItem = items.find(item => !item.armazon_id);

      // 2.5. Verificar stock disponible antes de crear la venta
      if (armazonItem && armazonItem.armazon_id) {
        const { data: productData, error: stockError } = await supabase
          .from('armazones')
          .select('stock')
          .eq('id', armazonItem.armazon_id)
          .single();
        
        if (stockError) {
          return { data: null, error: `Error al verificar stock: ${stockError.message}` };
        }
        
        if (!productData || productData.stock <= 0) {
          return { data: null, error: 'No hay stock disponible para este armazón' };
        }
      }

     // 3. Calcular subtotal y total
     const precioArmazon = armazonItem ? parseFloat(armazonItem.precio_unitario) || 0 : 0;
     const precioMicas = micasItem ? parseFloat(micasItem.precio_unitario) || 0 : 0;
     const descuentoArmazonMonto = parseFloat(ventaDetails.descuento_armazon_monto) || 0;
     const descuentoMicasMonto = parseFloat(ventaDetails.descuento_micas_monto) || 0;
     const descuentoGeneralMonto = parseFloat(ventaDetails.descuento_monto) || 0;
     const montoIva = parseFloat(ventaDetails.monto_iva) || 0;
     
     let subtotal, total, precioArmazonFinal, precioMicasFinal;
     
     // Si se proporciona monto_compra, usarlo como total base pero documentar precios individuales
     if (monto_compra && parseFloat(monto_compra) > 0) {
       const montoCompraValue = parseFloat(monto_compra);
       subtotal = montoCompraValue;
       // Aplicar descuento general si existe
       total = montoCompraValue - descuentoGeneralMonto + montoIva;
       
       // Documentar los precios individuales de los productos seleccionados
       // Si hay armazón seleccionado, usar su precio real
       if (armazonItem && precioArmazon > 0) {
         precioArmazonFinal = precioArmazon;
       } else {
         // Si no hay armazón seleccionado, usar el monto total como precio de armazón
         precioArmazonFinal = montoCompraValue;
       }
       
       // Si hay micas seleccionadas, usar su precio real
       if (micasItem && precioMicas > 0) {
         precioMicasFinal = precioMicas;
       } else {
         precioMicasFinal = 0;
       }
     } else {
       // Calcular subtotal (precios - descuentos de productos)
       subtotal = (precioArmazon - descuentoArmazonMonto) + (precioMicas - descuentoMicasMonto);
       // Calcular total (subtotal - descuento general + IVA)
       total = subtotal - descuentoGeneralMonto + montoIva;
       precioArmazonFinal = precioArmazon;
       precioMicasFinal = precioMicas;
     }

     // 4. Preparamos los datos para la tabla 'ventas' original.
const dataToInsert = {
  ...ventaDetails,
  folio: folio, // Agregar el folio (manual o automático)
  armazon_id: armazonItem ? armazonItem.armazon_id : null,
  precio_armazon: precioArmazonFinal,
  descripcion_micas: micasItem ? micasItem.descripcion : '',
  precio_micas: precioMicasFinal,
  
  // --- CAMBIO CLAVE: Asegurar que los valores sean numéricos ---
  descuento_armazon_monto: descuentoArmazonMonto,
  descuento_micas_monto: descuentoMicasMonto,
  descuento_monto: descuentoGeneralMonto,
  
  // --- Cálculos de totales ---
  subtotal: subtotal,
  total: total,
  
  // --- Datos de facturación ---
  requiere_factura: ventaDetails.requiere_factura || false,
  monto_iva: montoIva,
  rfc: ventaDetails.rfc || null,
  razon_social: ventaDetails.razon_social || null,
  
  // --- Fecha en zona horaria de México ---
  fecha_venta: new Date().toLocaleString("sv-SE", {timeZone: "America/Mexico_City"}),
};

// Solo incluir creado_por_id si el usuario existe en la tabla usuarios
if (usuarioActualId) {
  dataToInsert.creado_por_id = usuarioActualId;
}
delete dataToInsert.descuento_armazon_porcentaje;
delete dataToInsert.descuento_micas_porcentaje;
delete dataToInsert.descuento_porcentaje;
delete dataToInsert.items;
delete dataToInsert.folio_manual; // Eliminar el campo folio_manual ya que no existe en la tabla
delete dataToInsert.monto_compra; // Eliminar el campo monto_compra ya que no existe en la tabla

      // 3. Insertamos en la tabla 'ventas' como siempre lo has hecho.
      const { data, error } = await supabase
        .from('ventas')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // 3.5. Registrar abono si se proporcionó (formato antiguo o nuevo)
      let abonoRegistrado = null;
      const debeRegistrarAbono = (
        // Formato antiguo
        (data && registrar_abono && monto_abono && parseFloat(monto_abono) > 0) ||
        // Formato nuevo del modal
        (data && abonoInicial && abonoInicial.monto && parseFloat(abonoInicial.monto) > 0)
      );

      if (debeRegistrarAbono) {
        try {
          const { abonosService } = await import('./abonosService');
          
          // Determinar qué datos usar (priorizar formato nuevo)
          let abonoData;
          if (abonoInicial && abonoInicial.monto && parseFloat(abonoInicial.monto) > 0) {
            // Formato nuevo del modal
            abonoData = {
              venta_id: data.id,
              monto: parseFloat(abonoInicial.monto),
              observaciones: abonoInicial.observaciones || null,
              forma_pago: abonoInicial.forma_pago || 'efectivo'
            };
          } else {
            // Formato antiguo
            abonoData = {
              venta_id: data.id,
              monto: parseFloat(monto_abono),
              observaciones: observaciones_abono || null,
              forma_pago: forma_pago_abono || 'efectivo'
            };
          }
          
          const resultadoAbono = await abonosService.createAbono(abonoData);
          
          if (resultadoAbono.data) {
            abonoRegistrado = {
              monto: abonoData.monto,
              forma_pago: abonoData.forma_pago,
              observaciones: abonoData.observaciones
            };
            logger.log(`Abono registrado: $${abonoData.monto}`);
            
            // Verificar si la venta queda completamente pagada
            const { data: verificacionCompleta } = await abonosService.verificarYCompletarVenta(data.id);
            if (verificacionCompleta && verificacionCompleta.completada) {
              logger.log(`Venta ${data.id} marcada como completada automáticamente`);
              // Actualizar el estado de la venta en la respuesta
              data.estado = 'completada';
            }
          }
        } catch (abonoError) {
          logger.error('Error al registrar abono:', abonoError);
          // No fallar la creación de la venta por errores en abonos
        }
      }

  // 4. Asociamos los clientes a la venta
  if (data && cliente_ids && cliente_ids.length > 0) {
    const ventaClientes = cliente_ids.map(cliente_id => ({
      venta_id: data.id,
      cliente_id,
    }));
    const { error: vcError } = await supabase.from('venta_clientes').insert(ventaClientes);
    if (vcError) {
      logger.error('Error al insertar clientes:', vcError);
      // Si falla, borramos la venta para no dejar datos inconsistentes.
      await supabase.from('ventas').delete().eq('id', data.id);
      return { data: null, error: `Error al asociar clientes: ${vcError.message}` };
    }
  } else if (data && salesData.cliente_id) {
    // Compatibilidad con el formato anterior (un solo cliente)
    const { error: vcError } = await supabase.from('venta_clientes').insert([{
      venta_id: data.id,
      cliente_id: salesData.cliente_id,
    }]);
    if (vcError) {
      logger.error('Error al insertar cliente:', vcError);
      await supabase.from('ventas').delete().eq('id', data.id);
      return { data: null, error: `Error al asociar cliente: ${vcError.message}` };
    }
  }

  // 5. (Opcional pero recomendado) Asociamos los vendedores.
  if (data && vendedor_ids && vendedor_ids.length > 0) {
    const ventaVendedores = vendedor_ids.map(vendedor_id => ({
      venta_id: data.id,
      vendedor_id,
    }));
    const { error: vvError } = await supabase.from('venta_vendedores').insert(ventaVendedores);
    if (vvError) {
      logger.error('Error al insertar vendedores:', vvError);
      // Si falla, borramos la venta para no dejar datos inconsistentes.
      await supabase.from('venta_vendedores').delete().eq('venta_id', data.id);
      await supabase.from('venta_clientes').delete().eq('venta_id', data.id);
      await supabase.from('ventas').delete().eq('id', data.id);
      return { data: null, error: `Error al asociar vendedores: ${vvError.message}` };
    }
  }

  // 6. Reducir el stock del armazón si la venta no está cancelada
  if (data && armazonItem && armazonItem.armazon_id && ventaDetails.estado !== 'cancelada') {
    const { inventoryService } = await import('./inventoryService');
    const firstVendedorId = vendedor_ids && vendedor_ids.length > 0 ? vendedor_ids[0] : null;
    
    const stockResult = await inventoryService.reduceStockForSale(
      armazonItem.armazon_id,
      1,
      firstVendedorId
    );
    
    if (stockResult.error) {
      logger.error('Error al reducir stock:', stockResult.error);
      // Revertir la venta si no se pudo reducir el stock
      await supabase.from('venta_vendedores').delete().eq('venta_id', data.id);
      await supabase.from('ventas').delete().eq('id', data.id);
      return { data: null, error: `Error al reducir stock: ${stockResult.error}` };
    }
  }
  
  // Retornar la venta creada con información de abono registrado
  return { 
    data: { 
      ...data, 
      abonoRegistrado: abonoRegistrado 
    }, 
    error: null 
  };


    } catch (error) {
      logger.error('Error creando la nota de venta:', error);
      return { data: null, error: error.message };
    }
  },

  async updateSalesNote(id, updates) {
    try {
      const { vendedor_ids, cliente_ids, items, folio_manual, monto_compra, ...restOfUpdates } = updates;

      // Eliminar campos que no existen en la tabla ventas
      delete restOfUpdates.vendedores;
      delete restOfUpdates.cliente;
      delete restOfUpdates.armazon;
      delete restOfUpdates.tipo_mica;

      // Get the current sale data to compare changes
      const { data: currentSale, error: fetchError } = await supabase
        .from('ventas')
        .select('armazon_id, estado')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;

       // --- LÓGICA DE CONVERSIÓN (TAMBIÉN PARA ACTUALIZAR) ---
      const armazonPrice = parseFloat(restOfUpdates.precio_armazon) || 0;
      const micaPrice = parseFloat(restOfUpdates.precio_micas) || 0;

      if (restOfUpdates.descuento_armazon_porcentaje > 0) {
        restOfUpdates.descuento_armazon_monto = (armazonPrice * restOfUpdates.descuento_armazon_porcentaje) / 100;
      }
      if (restOfUpdates.descuento_micas_porcentaje > 0) {
        restOfUpdates.descuento_micas_monto = (micaPrice * restOfUpdates.descuento_micas_porcentaje) / 100;
      }
      if (restOfUpdates.descuento_porcentaje > 0) {
        const subtotal = armazonPrice + micaPrice;
        restOfUpdates.descuento_monto = (subtotal * restOfUpdates.descuento_porcentaje) / 100;
      }

      // Eliminar campos de porcentaje para no intentar guardarlos en la BD
      delete restOfUpdates.descuento_armazon_porcentaje;
      delete restOfUpdates.descuento_micas_porcentaje;
      delete restOfUpdates.descuento_porcentaje;
      
      // --- CALCULAR SUBTOTAL Y TOTAL ---
      const descuentoArmazonMonto = parseFloat(restOfUpdates.descuento_armazon_monto) || 0;
      const descuentoMicasMonto = parseFloat(restOfUpdates.descuento_micas_monto) || 0;
      const descuentoGeneralMonto = parseFloat(restOfUpdates.descuento_monto) || 0;
      const montoIva = parseFloat(restOfUpdates.monto_iva) || 0;
      
      let subtotal, total, precioArmazonFinal, precioMicasFinal;
      
      // Detectar si la venta fue creada con monto_compra
      // Si precio_armazon + precio_micas > subtotal, probablemente fue creada con monto_compra
      const sumaProductos = armazonPrice + micaPrice;
      const esVentaConMontoCompra = sumaProductos > 0 && restOfUpdates.subtotal > 0 && sumaProductos > restOfUpdates.subtotal;
      
      // Si se proporciona monto_compra o es una venta con monto_compra, usar el subtotal existente
      if ((monto_compra && parseFloat(monto_compra) > 0) || esVentaConMontoCompra) {
        const montoCompraValue = monto_compra ? parseFloat(monto_compra) : restOfUpdates.subtotal;
        subtotal = montoCompraValue;
        // Aplicar descuento general si existe
        total = montoCompraValue - descuentoGeneralMonto + montoIva;
        
        // Documentar los precios individuales de los productos seleccionados
        // Si hay armazón seleccionado, usar su precio real
        if (armazonPrice > 0) {
          precioArmazonFinal = armazonPrice;
        } else {
          // Si no hay armazón seleccionado, usar el monto total como precio de armazón
          precioArmazonFinal = montoCompraValue;
        }
        
        // Si hay micas seleccionadas, usar su precio real
        if (micaPrice > 0) {
          precioMicasFinal = micaPrice;
        } else {
          precioMicasFinal = 0;
        }
      } else {
        // Calcular subtotal (precios - descuentos de productos)
        subtotal = (armazonPrice - descuentoArmazonMonto) + (micaPrice - descuentoMicasMonto);
        // Calcular total (subtotal - descuento general + IVA)
        total = subtotal - descuentoGeneralMonto + montoIva;
        precioArmazonFinal = armazonPrice;
        precioMicasFinal = micaPrice;
      }
      
      // Asignar los cálculos
      restOfUpdates.subtotal = subtotal;
      restOfUpdates.total = total;
      restOfUpdates.precio_armazon = precioArmazonFinal;
      restOfUpdates.precio_micas = precioMicasFinal;
      
      // Asegurar que los campos de facturación sean del tipo correcto
      if (restOfUpdates.requiere_factura !== undefined) {
        restOfUpdates.requiere_factura = Boolean(restOfUpdates.requiere_factura);
      }
      if (restOfUpdates.monto_iva !== undefined) {
        restOfUpdates.monto_iva = parseFloat(restOfUpdates.monto_iva) || 0;
      }
      if (restOfUpdates.rfc !== undefined && !restOfUpdates.rfc) {
        restOfUpdates.rfc = null;
      }
      if (restOfUpdates.razon_social !== undefined && !restOfUpdates.razon_social) {
        restOfUpdates.razon_social = null;
      }

      const { data, error } = await supabase
        .from('ventas')
        .update(restOfUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      // Update sellers if they have changed
      if (vendedor_ids) {
        await supabase.from('venta_vendedores').delete().eq('venta_id', id);
        if (vendedor_ids.length > 0) {
          const ventaVendedores = vendedor_ids.map(vendedor_id => ({
            venta_id: id,
            vendedor_id,
          }));
          const { error: vvError } = await supabase.from('venta_vendedores').insert(ventaVendedores);
          if (vvError) {
            return { data: null, error: `Error al actualizar vendedores: ${vvError.message}` };
          }
        }
      }

      // Update clients if they have changed
      if (cliente_ids) {
        await supabase.from('venta_clientes').delete().eq('venta_id', id);
        if (cliente_ids.length > 0) {
          const ventaClientes = cliente_ids.map(cliente_id => ({
            venta_id: id,
            cliente_id,
          }));
          const { error: vcError } = await supabase.from('venta_clientes').insert(ventaClientes);
          if (vcError) {
            return { data: null, error: `Error al actualizar clientes: ${vcError.message}` };
          }
        }
      }

      // Handle stock adjustments based on status changes
      if (restOfUpdates.estado && currentSale.estado !== restOfUpdates.estado && currentSale.armazon_id) {
        const { inventoryService } = await import('./inventoryService');
        const firstVendedorId = vendedor_ids && vendedor_ids.length > 0 ? vendedor_ids[0] : null;

        if (restOfUpdates.estado === 'cancelada' && currentSale.estado !== 'cancelada') {
          const { data: currentProduct } = await supabase
            .from('armazones')
            .select('stock')
            .eq('id', currentSale.armazon_id)
            .single();
          
          if (currentProduct) {
            await inventoryService.updateStock(
              currentSale.armazon_id,
              (currentProduct.stock || 0) + 1,
              firstVendedorId, // Use the first seller for history
              'Cancelación de Venta'
            );
            logger.debug('Stock restored due to sale cancellation');
          }
        }
        
        if (currentSale.estado === 'cancelada' && restOfUpdates.estado !== 'cancelada') {
          const reduceResult = await inventoryService.reduceStockForSale(
            currentSale.armazon_id,
            1,
            firstVendedorId // Use the first seller for history
          );
          
          if (reduceResult.error) {
            logger.warn('Warning: Could not reduce stock when reactivating sale:', reduceResult.error);
          } else {
            logger.debug('Stock reduced due to sale reactivation');
          }
        }
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  async deleteSalesNote(id) {
    try {
      const { error } = await supabase.from('ventas').delete().eq('id', id);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error?.message };
    }
  },

  async getSalesStats() {
    try {
      const { data, error } = await supabase.from('ventas').select('total, estado');
      if (error) throw error;
      
      const totalSales = data?.length || 0;
      
      // Separar ventas completadas y pendientes
      const completedSalesData = data?.filter(sale => sale?.estado === 'completada') || [];
      const pendingSalesData = data?.filter(sale => sale?.estado === 'pendiente') || [];
      
      // Calcular ingresos por separado
      const completedRevenue = completedSalesData.reduce((sum, sale) => sum + (parseFloat(sale?.total) || 0), 0);
      const pendingRevenue = pendingSalesData.reduce((sum, sale) => sum + (parseFloat(sale?.total) || 0), 0);
      const totalRevenue = completedRevenue + pendingRevenue;
      
      const completedSales = completedSalesData.length;
      const pendingSales = pendingSalesData.length;
      
      return {
        data: {
          totalSales,
          totalRevenue,
          completedRevenue,
          pendingRevenue,
          completedSales,
          pendingSales,
          averageTicket: totalSales > 0 ? totalRevenue / totalSales : 0
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  async getSalesByVendor() {
    try {
      logger.log('🔍 Cargando rendimiento por vendedor...');
      
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          total,
          estado,
          created_at,
          venta_vendedores ( 
            usuarios (id, nombre, apellido) 
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('❌ Error en getSalesByVendor:', error);
        throw error;
      }

      logger.debug('📊 Datos de ventas para vendedores:', data?.length || 0, 'registros');

      const vendorStats = {};
      let totalVentasConVendedor = 0;
      let ventasSinVendedor = 0;

      data?.forEach(sale => {
        const saleTotal = parseFloat(sale.total) || 0;
        const vendedores = sale.venta_vendedores || [];
        
        if (vendedores.length === 0) {
          ventasSinVendedor++;
          return;
        }

        totalVentasConVendedor++;
        const numVendedores = vendedores.length;
        const dividedTotal = saleTotal / numVendedores;

        vendedores.forEach(vv => {
          const vendor = vv.usuarios;
          if (!vendor) return;

          const vendorId = vendor.id;
          const vendorName = `${vendor.nombre || ''} ${vendor.apellido || ''}`.trim();
          
          if (!vendorStats[vendorId]) {
            vendorStats[vendorId] = {
              id: vendorId,
              name: vendorName || 'Sin nombre',
              totalSales: 0,
              totalRevenue: 0,
              completedSales: 0,
              pendingSales: 0,
              completedRevenue: 0,
              pendingRevenue: 0,
              averageTicket: 0
            };
          }
          
          // Para el conteo de ventas: cada vendedor obtiene 1 venta completa
          // Para los ingresos: se divide entre los vendedores
          vendorStats[vendorId].totalSales += 1; // Venta completa para cada vendedor
          vendorStats[vendorId].totalRevenue += dividedTotal; // Ingreso dividido
          
          if (sale.estado === 'completada') {
            vendorStats[vendorId].completedSales += 1; // Venta completa
            vendorStats[vendorId].completedRevenue += dividedTotal; // Ingreso dividido
          } else if (sale.estado === 'pendiente') {
            vendorStats[vendorId].pendingSales += 1; // Venta completa
            vendorStats[vendorId].pendingRevenue += dividedTotal; // Ingreso dividido
          }
        });
      });

      logger.debug('📈 Estadísticas de procesamiento:', {
        totalVentas: data?.length || 0,
        ventasConVendedor: totalVentasConVendedor,
        ventasSinVendedor: ventasSinVendedor,
        vendedoresEncontrados: Object.keys(vendorStats).length
      });

      const vendorArray = Object.values(vendorStats)
        .map(vendor => ({
          ...vendor,
          // Los valores de ventas ya son enteros, solo calcular el ticket promedio
          averageTicket: vendor.totalSales > 0 ? vendor.totalRevenue / vendor.totalSales : 0
        }))
        .filter(vendor => vendor.totalSales > 0) // Solo vendedores con ventas
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      logger.debug('🏆 Top 3 vendedores:', vendorArray.slice(0, 3).map(v => 
        `${v.name}: $${v.totalRevenue.toLocaleString()} (${v.totalSales} ventas)`
      ));

      return { data: vendorArray, error: null };
    } catch (error) {
      logger.error('❌ Error en getSalesByVendor:', error);
      return { data: [], error: error?.message };
    }
  },

  async getBestSellingProducts() {
    try {
      logger.log('🔍 Cargando productos más vendidos...');
      
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          armazon_id,
          estado,
          created_at,
          armazones:armazon_id (
            id,
            sku,
            color,
            precio,
            marcas (nombre),
            descripciones (nombre)
          )
        `)
        .not('armazon_id', 'is', null) // Asegurar que tenga armazón
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('❌ Error en getBestSellingProducts:', error);
        throw error;
      }

      logger.debug('📊 Datos de ventas para productos más vendidos:', data?.length || 0, 'registros');

      // Mostrar algunas ventas de ejemplo para debug
      if (data && data.length > 0) {
        logger.debug('🔍 Primeras 3 ventas:', data.slice(0, 3).map(sale => ({
          id: sale.armazon_id,
          sku: sale.armazones?.sku,
          estado: sale.estado,
          fecha: sale.created_at
        })));
        
        // Contar estados
        const estadoCount = {};
        data.forEach(sale => {
          estadoCount[sale.estado] = (estadoCount[sale.estado] || 0) + 1;
        });
        logger.debug('📊 Estados de ventas:', estadoCount);
      }

      // Filtrar solo ventas completadas para productos más vendidos
      const completedSales = data?.filter(sale => sale.estado === 'completada') || [];
      logger.debug('✅ Ventas completadas para productos:', completedSales.length, 'de', data?.length || 0, 'total');

      // Agrupar por producto
      const productStats = {};
      completedSales.forEach((sale, index) => {
        const productId = sale.armazon_id;
        const product = sale.armazones;
        
        if (productId && product) {
          if (!productStats[productId]) {
            productStats[productId] = {
              id: productId,
              sku: product?.sku || 'N/A',
              color: product?.color || 'N/A',
              brand: product?.marcas?.nombre || 'N/A',
              description: product?.descripciones?.nombre || 'N/A',
              price: product?.precio || 0,
              totalSold: 0
            };
            logger.debug(`🆕 Nuevo producto encontrado: ${product?.sku} (ID: ${productId})`);
          }
          
          productStats[productId].totalSold += 1;
          
          // Log para los primeros productos
          if (index < 5) {
            logger.debug(`📦 Venta ${index + 1}: ${product?.sku} - Total actual: ${productStats[productId].totalSold}`);
          }
        } else {
          logger.debug(`⚠️ Venta sin producto válido:`, { productId, hasProduct: !!product });
        }
      });

      // Convertir a array y ordenar por cantidad vendida
      const productArray = Object.values(productStats)
        .filter(product => product.totalSold > 0) // Solo productos con ventas
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 10); // Top 10 productos

      logger.debug('🏆 Productos más vendidos calculados:', productArray.length, 'productos');
      logger.debug('📈 Top 5:', productArray.slice(0, 5).map(p => `${p.sku} (${p.brand}): ${p.totalSold} ventas`));
      logger.debug('📊 Estadísticas completas:', Object.keys(productStats).length, 'productos únicos encontrados');

      return { data: productArray, error: null };
    } catch (error) {
      logger.error('❌ Error en getBestSellingProducts:', error);
      return { data: [], error: error?.message };
    }
  },
  async getSalesByPeriod(period = 'month') {
    try {
      logger.debug('🔍 getSalesByPeriod llamado con period:', period);
      
      // Usar fechas más precisas para evitar problemas de zona horaria
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999); // Final del día actual
      
      let startDate = new Date();
      let days;

      // Calcular días según el período
      switch (period) {
        case 'week':
          days = 7;
          break;
        case 'month':
          days = 30;
          break;
        case 'year':
          days = 365;
          break;
        default:
          days = 30;
      }

      // Calcular fecha de inicio correctamente
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days + 1); // +1 para incluir el día actual
      startDate.setHours(0, 0, 0, 0); // Inicio del día

      logger.debug('📅 Fechas calculadas:', {
        period,
        days,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      });

      // Simplificar la consulta para evitar errores 406
      const { data, error } = await supabase
        .from('ventas')
        .select('fecha_venta, total, estado')
        .gte('fecha_venta', startDate.toISOString().split('T')[0])
        .lte('fecha_venta', endDate.toISOString().split('T')[0])
        .order('fecha_venta', { ascending: true });

      logger.debug('🔍 Consulta ejecutada desde:', startDate.toISOString().split('T')[0], 'hasta:', endDate.toISOString().split('T')[0]);

      if (error) {
        logger.error('❌ Error en consulta Supabase:', error);
        // En lugar de lanzar error, devolver array vacío para usar datos mock
        return { data: [], error: error.message };
      }
      
      logger.debug('📊 Datos raw de Supabase:', data);
      logger.debug('📊 Total de registros encontrados:', data?.length || 0);
      
      // Verificar específicamente si hay datos para hoy
      const today = new Date().toISOString().split('T')[0];
      const todayData = data?.filter(sale => {
        const saleDate = sale.fecha_venta.includes('T') 
          ? sale.fecha_venta.split('T')[0] 
          : sale.fecha_venta;
        return saleDate === today;
      });
      logger.debug('📅 Datos para hoy (' + today + '):', todayData);
      
      // Si no hay datos, devolver array vacío para usar datos mock
      if (!data || data.length === 0) {
        logger.debug('⚠️ No hay datos de ventas en el período');
        return { data: [], error: null };
      }

      // Agrupar ventas por fecha
      const salesByDate = {};
      
      // Inicializar todas las fechas del período con 0
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        salesByDate[dateStr] = {
          date: dateStr,
          totalSales: 0,
          completedSales: 0,
          pendingSales: 0,
          totalRevenue: 0,
          completedRevenue: 0,
          pendingRevenue: 0
        };
      }

      // Procesar datos de ventas
      data.forEach(sale => {
        try {
          // Extraer solo la parte de la fecha (YYYY-MM-DD) del timestamp completo
          const dateStr = sale.fecha_venta.includes('T') 
            ? sale.fecha_venta.split('T')[0] 
            : sale.fecha_venta;
          
          if (salesByDate[dateStr]) {
            const amount = parseFloat(sale.total) || 0;
            
            salesByDate[dateStr].totalSales += 1;
            salesByDate[dateStr].totalRevenue += amount;
            
            if (sale.estado === 'completada') {
              salesByDate[dateStr].completedSales += 1;
              salesByDate[dateStr].completedRevenue += amount;
            } else if (sale.estado === 'pendiente') {
              salesByDate[dateStr].pendingSales += 1;
              salesByDate[dateStr].pendingRevenue += amount;
            }
          }
        } catch (dateError) {
          logger.error('❌ Error procesando fecha:', sale.fecha_venta, dateError);
        }
      });

      // Convertir a array y formatear para gráfico
      const chartData = Object.values(salesByDate).map(day => {
        try {
          // Crear fecha de manera más segura
          const dateObj = new Date(day.date + 'T12:00:00'); // Agregar hora para evitar problemas de zona horaria
          
          return {
            date: day.date,
            label: dateObj.toLocaleDateString('es-ES', { 
              month: 'short', 
              day: 'numeric' 
            }),
            totalSales: day.totalSales,
            completedSales: day.completedSales,
            pendingSales: day.pendingSales,
            totalRevenue: day.totalRevenue,
            completedRevenue: day.completedRevenue,
            pendingRevenue: day.pendingRevenue
          };
        } catch (formatError) {
          logger.error('❌ Error formateando fecha:', day.date, formatError);
          return {
            date: day.date,
            label: day.date,
            totalSales: day.totalSales,
            completedSales: day.completedSales,
            pendingSales: day.pendingSales,
            totalRevenue: day.totalRevenue,
            completedRevenue: day.completedRevenue,
            pendingRevenue: day.pendingRevenue
          };
        }
      });

      logger.debug('📈 ChartData final:', chartData);
      
      return { data: chartData, error: null };
    } catch (error) {
      logger.error('❌ Error general en getSalesByPeriod:', error);
      return { data: [], error: error?.message };
    }
  },

  async getOutOfStockProducts() {
    try {
      const { data, error } = await supabase
        .from('armazones')
        .select(`*, marcas(nombre), grupos(nombre)`)
        .eq('stock', 0) // La única diferencia es que buscamos stock exactamente igual a 0
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Función para actualizar la configuración de folios (solo para administradores)
  async updateFolioConfiguration(config) {
    try {
      const { nuevo_prefijo, nuevo_numero, forzar_reinicio } = config;
      
      // Construir parámetros para la función RPC
      const params = {};
      if (nuevo_prefijo && nuevo_prefijo.trim() !== '') {
        params.nuevo_prefijo = nuevo_prefijo.trim();
      }
      if (nuevo_numero !== undefined && nuevo_numero !== null) {
        params.nuevo_numero = parseInt(nuevo_numero);
      }
      if (forzar_reinicio) {
        params.forzar_reinicio = true;
      }

      // Si hay algo que cambiar, llamar a la función RPC
      if (Object.keys(params).length > 0) {
        const { data, error } = await supabase.rpc('actualizar_configuracion_folio', params);

        if (error) {
          logger.error('Error al actualizar configuración de folio:', error);
          return { data: null, error: error.message };
        }

        logger.log('Configuración de folio actualizada exitosamente');
        return { data: data, error: null };
      } else {
        return { data: null, error: 'No se proporcionaron parámetros para actualizar' };
      }
    } catch (error) {
      logger.error('Error en updateFolioConfiguration:', error);
      return { data: null, error: error.message };
    }
  },

  // Función para obtener la configuración actual de folios
  async getFolioConfiguration() {
    try {
      const { data, error } = await supabase
        .from('configuracion_folios')
        .select('prefijo, numero_inicio')
        .eq('id', 1)
        .single();

      if (error) {
        logger.error('Error al obtener configuración de folio:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      logger.error('Error en getFolioConfiguration:', error);
      return { data: null, error: error.message };
    }
  },

  // Función para generar folio único
  async generateUniqueFolio() {
    try {
      // Obtener configuración de folios
      const { data: config, error: configError } = await supabase
        .from('configuracion_folios')
        .select('prefijo, numero_inicio')
        .eq('id', 1)
        .single();

      let prefijo = 'V';
      let numeroInicio = 1;

      if (config && !configError) {
        prefijo = config.prefijo || 'V';
        numeroInicio = config.numero_inicio || 1;
      }

      // Obtener todos los folios del día actual para encontrar el siguiente número disponible
      const today = new Date();
      const mexicoToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
      const todayStr = `${mexicoToday.getFullYear()}${String(mexicoToday.getMonth() + 1).padStart(2, '0')}${String(mexicoToday.getDate()).padStart(2, '0')}`;

      // Obtener todos los folios que contengan números (automáticos y manuales)
      const { data: allFolios, error } = await supabase
        .from('ventas')
        .select('folio')
        .not('folio', 'is', null);

      if (error) {
        logger.error('Error al obtener folios:', error);
        // Si hay error, generar folio basado en configuración con zona horaria de México
        const now = new Date();
        const mexicoDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
        const year = mexicoDate.getFullYear();
        const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
        const day = String(mexicoDate.getDate()).padStart(2, '0');
        const time = String(now.getTime()).slice(-6); // Últimos 6 dígitos del timestamp
        return `${prefijo}${year}${month}${day}${time}`;
      }

      let nextNumber = numeroInicio;
      const usedNumbers = new Set();

      if (allFolios && allFolios.length > 0) {
        // Extraer números de todos los folios (automáticos y manuales)
        allFolios.forEach(folioObj => {
          const folio = folioObj.folio;
          
          // Para folios automáticos del día actual (formato: VYYYYMMDDNNNNNN)
          const autoMatch = folio.match(new RegExp(`^${prefijo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${todayStr}(\\d+)$`));
          if (autoMatch) {
            const number = parseInt(autoMatch[1]);
            usedNumbers.add(number);
          }
          
          // Para folios manuales que sean solo números
          const manualMatch = folio.match(/^(\d+)$/);
          if (manualMatch) {
            const number = parseInt(manualMatch[1]);
            usedNumbers.add(number);
          }
        });

        // Encontrar el siguiente número disponible
        let candidate = numeroInicio;
        while (usedNumbers.has(candidate)) {
          candidate++;
        }
        nextNumber = candidate;
        
        logger.log(`Números usados: [${Array.from(usedNumbers).sort((a,b) => a-b).join(', ')}], siguiente disponible: ${nextNumber}`);
      }

      // Generar nuevo folio usando zona horaria de México
      const now = new Date();
      const mexicoDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
      const year = mexicoDate.getFullYear();
      const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
      const day = String(mexicoDate.getDate()).padStart(2, '0');
      const number = String(nextNumber).padStart(6, '0');
      
      return `${prefijo}${year}${month}${day}${number}`;
    } catch (error) {
      logger.error('Error generando folio:', error);
      // Fallback: folio basado en timestamp con zona horaria de México
      const now = new Date();
      const mexicoDate = new Date(now.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
      const year = mexicoDate.getFullYear();
      const month = String(mexicoDate.getMonth() + 1).padStart(2, '0');
      const day = String(mexicoDate.getDate()).padStart(2, '0');
      const time = String(now.getTime()).slice(-6);
      return `V${year}${month}${day}${time}`;
    }
  },
};