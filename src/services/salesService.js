import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { authSyncService } from './authSyncService';

export const salesService = {
  // OPTIMIZED: Get sales summary (lightweight version for tables)
  async getSalesSummary(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          id,
          folio,
          total,
          subtotal,
          monto_iva,
          requiere_factura,
          rfc,
          razon_social,
          estado,
          created_at,
          venta_clientes!inner(
            clientes(id, nombre, telefono)
          ),
          venta_vendedores(
            usuarios(id, nombre, apellido)
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      // Transform data for frontend
      const transformedData = data.map(item => ({
        ...item,
        clientes: item.venta_clientes?.map(vc => vc.clientes) || [],
        vendedores: item.venta_vendedores?.map(vv => vv.usuarios) || []
      }));
      
      return { data: transformedData, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // OPTIMIZED: Get sales count for pagination
  async getSalesCount() {
    try {
      const { count, error } = await supabase
        .from('ventas')
        .select('id', { count: 'exact' })
        .limit(1);
      
      if (error) throw error;
      return { count, error: null };
    } catch (error) {
      return { count: 0, error: error?.message };
    }
  },

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

  async getSalesNotes(limit = null, offset = null) {
    try {
      const selectColumns = `
          id,
          folio,
          total,
          subtotal,
          descuento_armazon_monto,
          descuento_micas_monto,
          descuento_monto,
          estado,
          fecha_venta,
          observaciones,
          created_at,
          updated_at,
          requiere_factura,
          monto_iva,
          rfc,
          razon_social,
          venta_clientes (
            cliente_id,
            clientes:cliente_id (id, nombre, telefono, correo, empresa_id, empresas:empresa_id(id, nombre))
          ),
          venta_vendedores (
            vendedor_id,
            usuarios:vendedor_id (id, nombre, apellido)
          ),
          venta_productos (
            id,
            tipo_producto,
            armazon_id,
            descripcion_mica,
            cantidad,
            precio_unitario,
            descuento_monto,
            subtotal,
            armazones (id, sku, color, precio, marcas(nombre), descripciones(nombre))
          ),
          abonos (id, monto, fecha_abono, forma_pago, observaciones)
        `;

      let query = supabase
        .from('ventas')
        .select(selectColumns)
        .order('created_at', { ascending: false });

      // Add pagination if parameters are provided
      if (limit !== null && offset !== null) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error: error.message };
      }

      // Transformar los datos para el frontend
      const transformedData = data.map(item => {
        // Extraer clientes
        const clientes = item.venta_clientes?.map(vc => ({
          id: vc.clientes?.id,
          nombre: vc.clientes?.nombre,
          telefono: vc.clientes?.telefono,
          correo: vc.clientes?.correo,
          empresa: vc.clientes?.empresas?.nombre || null
        })) || [];

        // Extraer vendedores
        const vendedores = item.venta_vendedores?.map(vv => ({
          id: vv.usuarios?.id,
          nombre: vv.usuarios?.nombre,
          apellido: vv.usuarios?.apellido
        })) || [];

        // Extraer productos
        const productos = item.venta_productos?.map(vp => {
          const cantidad = parseFloat(vp.cantidad) || 0;
          const precioUnitario = parseFloat(vp.precio_unitario) || 0;
          const tieneSubtotal = !(vp.subtotal === null || vp.subtotal === undefined || `${vp.subtotal}` === '' || Number.isNaN(parseFloat(vp.subtotal)));
          const subtotal = tieneSubtotal ? (parseFloat(vp.subtotal) || 0) : 0;
          const descuentoCalculado = tieneSubtotal ? Math.max(0, (cantidad * precioUnitario) - subtotal) : 0;
          const rawDescuento = vp.descuento_monto;
          const tieneValorDescuento = !(
            rawDescuento === null ||
            rawDescuento === undefined ||
            rawDescuento === '' ||
            Number.isNaN(parseFloat(rawDescuento))
          );
          const descuentoExpl = tieneValorDescuento ? parseFloat(rawDescuento) || 0 : 0;
          const descuentoReal = descuentoCalculado > 0 ? descuentoCalculado : descuentoExpl;
          return {
            id: vp.id,
            tipo: vp.tipo_producto,
            armazon_id: vp.armazon_id,
            descripcion_mica: vp.descripcion_mica,
            cantidad: cantidad,
            precio_unitario: precioUnitario,
            descuento_monto: descuentoReal,
            subtotal: subtotal,
            armazon: vp.armazones ? {
              id: vp.armazones.id,
              sku: vp.armazones.sku,
              color: vp.armazones.color,
              precio: vp.armazones.precio,
              marca: vp.armazones.marcas?.nombre,
              descripcion: vp.armazones.descripciones?.nombre
            } : null
          };
        }) || [];

        // Calcular totales de abonos
        const totalAbonos = item.abonos?.reduce((sum, abono) => sum + parseFloat(abono.monto || 0), 0) || 0;
        const saldoPendiente = Math.max(0, parseFloat(item.total || 0) - totalAbonos);
        const porcentajePagado = item.total > 0 ? (totalAbonos / parseFloat(item.total)) * 100 : 0;

        // Para mantener compatibilidad, buscar el primer armazón
        const primerArmazon = productos.find(p => p.armazon)?.armazon;
        const productosArmazon = productos.filter(p => p.tipo === 'armazon');
        const productosMica = productos.filter(p => p.tipo === 'mica');

        // Calcular descuentos reales de los productos
        let descuentoArmazonTotal = productosArmazon.reduce((total, producto) => {
          return total + (parseFloat(producto.descuento_monto || 0));
        }, 0);

        let descuentoMicasTotal = productosMica.reduce((total, producto) => {
          return total + (parseFloat(producto.descuento_monto || 0));
        }, 0);

        // Fallback a campos de la venta si los descuentos por producto vienen en 0
        if (!descuentoArmazonTotal && item.descuento_armazon_monto) {
          descuentoArmazonTotal = parseFloat(item.descuento_armazon_monto) || 0;
        }
        if (!descuentoMicasTotal && item.descuento_micas_monto) {
          descuentoMicasTotal = parseFloat(item.descuento_micas_monto) || 0;
        }

        return {
          id: item.id,
          folio: item.folio,
          clientes: clientes, // Array de clientes
          cliente: clientes[0] || null, // Mantener compatibilidad (primer cliente)
          productos: productos, // Todos los productos
          productosArmazon: productosArmazon, // Solo armazones
          productosMica: productosMica, // Solo micas
          armazon: primerArmazon ? {
            ...primerArmazon,
            modelo: `${primerArmazon?.marca || 'N/A'} - ${primerArmazon?.sku || 'Sin SKU'}`,
            precio: productosArmazon[0]?.precio_unitario || 0,
          } : null,
          tipo_mica: {
            nombre: productosMica.length > 0 ? productosMica[0].descripcion_mica || 'Mica' : 'N/A',
            precio: productosMica[0]?.precio_unitario || 0,
          },
          productos: productos, // Nuevos datos de productos
          vendedores: vendedores,
          // Mantener compatibilidad con datos originales
          precio_armazon: productosArmazon[0]?.precio_unitario || 0,
          precio_micas: productosMica[0]?.precio_unitario || 0,
          descripcion_micas: productosMica.length > 0 ? productosMica[0].descripcion_mica || 'N/A' : 'N/A',
          descuento_armazon_monto: descuentoArmazonTotal,
          descuento_micas_monto: descuentoMicasTotal,
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
          totalAbonos,
          saldoPendiente,
          porcentajePagado: Math.round(porcentajePagado)
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
      const selectColumns = `
          id,
          folio,
          total,
          subtotal,
          descuento_monto,
          estado,
          fecha_venta,
          observaciones,
          created_at,
          updated_at,
          requiere_factura,
          monto_iva,
          rfc,
          razon_social,
          venta_clientes ( 
            cliente_id,
            clientes:cliente_id (id, nombre, telefono, correo, empresa_id, empresas:empresa_id(id, nombre))
          ),
          venta_vendedores ( 
            vendedor_id,
            usuarios:vendedor_id (id, nombre, apellido) 
          ),
          venta_productos (
            id,
            tipo_producto,
            armazon_id,
            descripcion_mica,
            cantidad,
            precio_unitario,
            descuento_monto,
            subtotal,
            armazones (id, sku, color, precio, marcas(nombre), descripciones(nombre))
          ),
          abonos (id, monto, fecha_abono, forma_pago, observaciones)
        `;

      const { data, error } = await supabase
        .from('ventas')
        .select(selectColumns)
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
      const { productos, vendedor_ids, cliente_ids, folio_manual, creado_por_id, monto_compra, abonoInicial, registrar_abono, monto_abono, forma_pago_abono, observaciones_abono, ...ventaDetails } = salesData;

      // Validar que vendedor_ids sea un array
      const vendedorIdsArray = Array.isArray(vendedor_ids) ? vendedor_ids : (vendedor_ids ? [vendedor_ids] : []);
      const clienteIdsArray = Array.isArray(cliente_ids) ? cliente_ids : (cliente_ids ? [cliente_ids] : []);

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
          const todayString = mexicoToday.toISOString().split('T')[0];
          
          const { data: existingAutoFolio } = await supabase
            .from('ventas')
            .select('id')
            .eq('folio', manualNumber.toString())
            .gte('created_at', `${todayString}T00:00:00.000Z`)
            .lt('created_at', `${todayString}T23:59:59.999Z`)
            .single();
            
          if (existingAutoFolio) {
            return { data: null, error: `El folio "${folio}" ya está en uso por una venta automática del día de hoy. Por favor, usa otro folio.` };
          }
        }
      } else {
        // Caso A: Folio Automático - generar folio único
        folio = await this.generateUniqueFolio();
      }

      // 2. Preparar datos para insertar en la tabla ventas
      const dataToInsert = {
        folio,
        subtotal: parseFloat(ventaDetails.subtotal || 0),
        total: parseFloat(ventaDetails.total || 0),
        descuento_monto: parseFloat(ventaDetails.descuento_monto || 0),
        requiere_factura: ventaDetails.requiere_factura || false,
        monto_iva: parseFloat(ventaDetails.monto_iva || 0),
        rfc: ventaDetails.rfc || '',
        razon_social: ventaDetails.razon_social || '',
        estado: ventaDetails.estado || 'pendiente',
        observaciones: ventaDetails.observaciones || '',
        fecha_venta: ventaDetails.fecha_venta || new Date().toISOString()
      };

      // 3. Insertar la venta principal
      const { data, error } = await supabase
        .from('ventas')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      // 4. Insertar productos en la tabla venta_productos
      if (productos && productos.length > 0) {
        console.log('Productos recibidos para insertar:', productos);
        const productosToInsert = productos.map(producto => {
          console.log('Procesando producto para inserción:', producto);
          const baseProduct = {
            venta_id: data.id,
            cantidad: producto.cantidad || 1,
            precio_unitario: parseFloat(producto.precio_unitario || 0),
            descuento_monto: parseFloat(producto.descuento_monto || 0),
            subtotal: parseFloat(producto.subtotal || 0)
          };

          // Usar tipo_producto que viene del frontend
          if (producto.tipo_producto === 'armazon' && producto.armazon_id) {
            const armazonProduct = {
              ...baseProduct,
              tipo_producto: 'armazon',
              armazon_id: producto.armazon_id
            };
            console.log('Producto armazón preparado:', armazonProduct);
            return armazonProduct;
          } else if (producto.tipo_producto === 'mica' && producto.descripcion_mica) {
            const micaProduct = {
              ...baseProduct,
              tipo_producto: 'mica',
              descripcion_mica: producto.descripcion_mica
            };
            console.log('Producto mica preparado:', micaProduct);
            return micaProduct;
          }
          console.log('Producto no válido, se descarta:', producto);
          return null;
        }).filter(Boolean);

        console.log('Productos finales a insertar:', productosToInsert);

        if (productosToInsert.length > 0) {
          const { error: productosError } = await supabase
            .from('venta_productos')
            .insert(productosToInsert);

          if (productosError) {
            // Si falla la inserción de productos, eliminar la venta creada
            await supabase.from('ventas').delete().eq('id', data.id);
            return { data: null, error: `Error al insertar productos: ${productosError.message}` };
          }

          // Descontar inventario automáticamente para armazones
          console.log('=== INICIO DESCUENTO DE INVENTARIO ===');
          console.log('Productos insertados:', productosToInsert);
          console.log('Cantidad de productos:', productosToInsert.length);
          
          for (const producto of productosToInsert) {
            console.log('--- Procesando producto ---');
            console.log('Producto completo:', producto);
            console.log('tipo_producto:', producto.tipo_producto);
            console.log('armazon_id:', producto.armazon_id);
            console.log('cantidad:', producto.cantidad);
            
            if (producto.tipo_producto === 'armazon' && producto.armazon_id) {
              console.log(`✅ INICIANDO descuento para armazón ID: ${producto.armazon_id}, cantidad: ${producto.cantidad}`);
              try {
                // Obtener el stock actual del armazón
                const { data: armazon, error: armazonError } = await supabase
                  .from('armazones')
                  .select('stock')
                  .eq('id', producto.armazon_id)
                  .single();

                if (armazonError) {
                  console.error(`Error al obtener stock del armazón ${producto.armazon_id}:`, armazonError.message);
                  continue;
                }

                console.log(`Stock actual del armazón ${producto.armazon_id}: ${armazon.stock}`);

                // Calcular nuevo stock
                const nuevoStock = Math.max(0, armazon.stock - (producto.cantidad || 1));
                console.log(`Nuevo stock calculado: ${nuevoStock}`);

                // Actualizar el stock
                const { error: updateError } = await supabase
                  .from('armazones')
                  .update({ stock: nuevoStock })
                  .eq('id', producto.armazon_id);

                if (updateError) {
                  console.error(`Error al actualizar stock del armazón ${producto.armazon_id}:`, updateError.message);
                } else {
                  console.log(`Stock actualizado exitosamente para armazón ${producto.armazon_id}: ${armazon.stock} -> ${nuevoStock}`);
                }
              } catch (error) {
                console.error(`Error al procesar descuento de inventario para armazón ${producto.armazon_id}:`, error.message);
              }
            } else {
              console.log('❌ Producto NO válido para descuento:', {
                tipo_producto: producto.tipo_producto,
                armazon_id: producto.armazon_id,
                tiene_armazon_id: !!producto.armazon_id
              });
            }
          }
          console.log('=== FIN DESCUENTO DE INVENTARIO ===');
        }
      }

      // 5. Insertar vendedores en la tabla venta_vendedores
      if (vendedorIdsArray && vendedorIdsArray.length > 0) {
        const vendedoresToInsert = vendedorIdsArray.map(vendedor_id => ({
          venta_id: data.id,
          vendedor_id: vendedor_id
        }));

        const { error: vendedoresError } = await supabase
          .from('venta_vendedores')
          .insert(vendedoresToInsert);

        if (vendedoresError) {
          // Si falla la inserción de vendedores, eliminar la venta creada
          await supabase.from('ventas').delete().eq('id', data.id);
          return { data: null, error: `Error al insertar vendedores: ${vendedoresError.message}` };
        }
      }

      // 6. Insertar clientes en la tabla venta_clientes
      if (clienteIdsArray && clienteIdsArray.length > 0) {
        const clientesToInsert = clienteIdsArray.map(cliente_id => ({
          venta_id: data.id,
          cliente_id: cliente_id
        }));

        const { error: clientesError } = await supabase
          .from('venta_clientes')
          .insert(clientesToInsert);

        if (clientesError) {
          // Si falla la inserción de clientes, eliminar la venta creada
          await supabase.from('ventas').delete().eq('id', data.id);
          return { data: null, error: `Error al insertar clientes: ${clientesError.message}` };
        }
      }

      // 7. Registrar abono inicial si se especifica
      if (registrar_abono && monto_abono && parseFloat(monto_abono) > 0) {
        const abonoData = {
          venta_id: data.id,
          monto: parseFloat(monto_abono),
          forma_pago: forma_pago_abono || 'efectivo',
          observaciones: observaciones_abono || '',
          fecha_abono: new Date().toISOString(),
          creado_por_id: creado_por_id
        };

        const { error: abonoError } = await supabase
          .from('abonos')
          .insert([abonoData]);

        if (abonoError) {
          console.warn('Error al registrar abono inicial:', abonoError.message);
          // No eliminamos la venta por un error en el abono, solo advertimos
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating sales note:', error);
      return { data: null, error: error.message };
    }
  },

  // Resto de funciones del servicio...
  async updateSalesNote(id, updates) {
    try {
      const { error } = await supabase
        .from('ventas')
        .update(updates, { returning: 'minimal' })
        .eq('id', id);
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      return { error: error?.message };
    }
  },

  async deleteSalesNote(id) {
    try {
      // Eliminar en orden correcto para respetar las relaciones de foreign key
      
      // 1. Eliminar productos de la venta
      const { error: productosError } = await supabase
        .from('venta_productos')
        .delete()
        .eq('venta_id', id);
      
      if (productosError) {
        console.error('Error al eliminar productos de la venta:', productosError);
        throw productosError;
      }

      // 2. Eliminar vendedores de la venta
      const { error: vendedoresError } = await supabase
        .from('venta_vendedores')
        .delete()
        .eq('venta_id', id);
      
      if (vendedoresError) {
        console.error('Error al eliminar vendedores de la venta:', vendedoresError);
        throw vendedoresError;
      }

      // 3. Eliminar abonos relacionados (si existen)
      const { error: abonosError } = await supabase
        .from('abonos')
        .delete()
        .eq('venta_id', id);
      
      if (abonosError) {
        console.error('Error al eliminar abonos de la venta:', abonosError);
        throw abonosError;
      }

      // 4. Finalmente eliminar la venta
      const { error: ventaError } = await supabase
        .from('ventas')
        .delete()
        .eq('id', id);
      
      if (ventaError) {
        console.error('Error al eliminar la venta:', ventaError);
        throw ventaError;
      }

      console.log(`Venta ${id} eliminada exitosamente con todas sus relaciones`);
      return { error: null };
    } catch (error) {
      console.error('Error en deleteSalesNote:', error);
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

  // Función para actualizar la configuración de folios (solo para administradores)
  async updateFolioConfiguration(config) {
    try {
      const { nuevo_prefijo, nuevo_numero, forzar_reinicio } = config;
      
      // Primero, asegurar que existe un registro de configuración
      await this.ensureFolioConfigExists();
      
      // Construir objeto de actualización
      const updateData = {};
      if (nuevo_prefijo && nuevo_prefijo.trim() !== '') {
        updateData.prefijo = nuevo_prefijo.trim();
      }
      if (nuevo_numero !== undefined && nuevo_numero !== null) {
        updateData.numero_inicio = parseInt(nuevo_numero);
      }
      
      updateData.updated_at = new Date().toISOString();

      // Si hay algo que cambiar, actualizar directamente
      if (Object.keys(updateData).length > 1) { // > 1 porque siempre tenemos updated_at
        const { data, error } = await supabase
          .from('configuracion_folios')
          .update(updateData)
          .eq('id', 1)
          .select();

        if (error) {
          logger.error('Error al actualizar configuración de folio:', error);
          return { data: null, error: error.message };
        }

        logger.log('Configuración de folio actualizada exitosamente');
        return { data: data[0], error: null };
      } else {
        return { data: null, error: 'No se proporcionaron parámetros para actualizar' };
      }
    } catch (error) {
      logger.error('Error en updateFolioConfiguration:', error);
      return { data: null, error: error.message };
    }
  },

  // Función para asegurar que existe la configuración de folios
  async ensureFolioConfigExists() {
    try {
      // Verificar si ya existe un registro
      const { data: existing, error: checkError } = await supabase
        .from('configuracion_folios')
        .select('id')
        .eq('id', 1)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // No existe, crear el registro inicial
        const { data, error } = await supabase
          .from('configuracion_folios')
          .insert({
            id: 1,
            prefijo: 'V',
            numero_inicio: 1
          })
          .select();

        if (error) {
          logger.error('Error al crear configuración inicial de folio:', error);
          throw error;
        }
        
        logger.log('Configuración inicial de folio creada');
        return data[0];
      } else if (checkError) {
        throw checkError;
      }
      
      return existing;
    } catch (error) {
      logger.error('Error en ensureFolioConfigExists:', error);
      throw error;
    }
  },

  // Función para obtener la configuración actual de folios
  async getFolioConfiguration() {
    try {
      // Asegurar que existe la configuración
      await this.ensureFolioConfigExists();
      
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

  // OPTIMIZED: Get sales metrics without heavy joins
  async getSalesMetrics(startDate = null, endDate = null) {
    try {
      let query = supabase
        .from('ventas')
        .select(`
          id,
          total,
          estado,
          created_at,
          venta_vendedores(vendedor_id)
        `);

      if (startDate) {
        const startISO = typeof startDate === 'string' ? startDate : new Date(startDate).toISOString();
        query = query.gte('created_at', startISO);
      }
      if (endDate) {
        const endISO = typeof endDate === 'string' ? endDate : new Date(endDate).toISOString();
        query = query.lte('created_at', endISO);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // OPTIMIZED: Get top brands without heavy product joins
  async getTopBrands(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('venta_productos')
        .select(`
          armazones(marcas(id, nombre)),
          cantidad,
          precio_unitario
        `)
        .not('armazon_id', 'is', null);
      
      if (error) throw error;
      
      // Process data to get top brands
      const brandStats = {};
      data.forEach(item => {
        if (item.armazones?.marcas) {
          const brand = item.armazones.marcas;
          if (!brandStats[brand.id]) {
            brandStats[brand.id] = {
              id: brand.id,
              nombre: brand.nombre,
              cantidad: 0,
              ingresos: 0
            };
          }
          brandStats[brand.id].cantidad += item.cantidad || 0;
          brandStats[brand.id].ingresos += (item.cantidad || 0) * (item.precio_unitario || 0);
        }
      });
      
      const sortedBrands = Object.values(brandStats)
        .sort((a, b) => b.ingresos - a.ingresos)
        .slice(0, limit);
      
      return { data: sortedBrands, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // OPTIMIZED: Get vendor performance without heavy joins
  async getVendorPerformance(startDate = null, endDate = null, page = 1, pageSize = 100) {
    try {
      let query = supabase
        .from('ventas')
        .select(`
          id,
          total,
          estado,
          created_at,
          venta_vendedores(
            vendedor_id,
            usuarios(id, nombre, apellido)
          ),
          venta_clientes(
            clientes(nombre)
          )
        `);

      if (startDate) {
        const startISO = typeof startDate === 'string' 
          ? startDate 
          : new Date(startDate).toISOString();
        query = query.gte('created_at', startISO);
      }
      if (endDate) {
        const endISO = typeof endDate === 'string' 
          ? endDate 
          : new Date(endDate).toISOString();
        query = query.lte('created_at', endISO);
      }

      // Paginación por ventas para grandes volúmenes
      const offset = Math.max(0, (parseInt(page, 10) - 1) * parseInt(pageSize, 10));
      query = query.order('created_at', { ascending: false }).range(offset, offset + parseInt(pageSize, 10) - 1);

      const { data: salesData, error } = await query;
      
      if (error) throw error;
      
      // Process data into vendor performance structure
      const vendorMap = new Map();
      
      salesData.forEach(sale => {
        const vendors = sale.venta_vendedores || [];
        const saleTotal = parseFloat(sale.total) || 0;
        const isShared = vendors.length > 1;
        const clientName = sale.venta_clientes?.[0]?.clientes?.nombre || 'Cliente';
        
        vendors.forEach(vendorRel => {
          const vendor = vendorRel.usuarios;
          if (!vendor) return;
          
          const vendorId = vendor.id;
          const vendorName = `${vendor.nombre || ''} ${vendor.apellido || ''}`.trim();
          
          if (!vendorMap.has(vendorId)) {
            vendorMap.set(vendorId, {
              id: vendorId,
              name: vendorName,
              totalSales: { count: 0, revenue: 0 },
              individualSales: { count: 0, revenue: 0, completed: 0, pending: 0, completedRevenue: 0, pendingRevenue: 0 },
              sharedSales: { count: 0, revenue: 0, completed: 0, pending: 0, completedRevenue: 0, pendingRevenue: 0 },
              recentSales: []
            });
          }
          
          const vendorData = vendorMap.get(vendorId);
          const shareAmount = isShared ? saleTotal / vendors.length : saleTotal;
          const isCompleted = sale.estado === 'completada';
          
          // Update totals
          vendorData.totalSales.count++;
          vendorData.totalSales.revenue += shareAmount;
          
          // Update individual or shared sales
          if (isShared) {
            vendorData.sharedSales.count++;
            vendorData.sharedSales.revenue += shareAmount;
            if (isCompleted) {
              vendorData.sharedSales.completed++;
              vendorData.sharedSales.completedRevenue += shareAmount;
            } else {
              vendorData.sharedSales.pending++;
              vendorData.sharedSales.pendingRevenue += shareAmount;
            }
          } else {
            vendorData.individualSales.count++;
            vendorData.individualSales.revenue += shareAmount;
            if (isCompleted) {
              vendorData.individualSales.completed++;
              vendorData.individualSales.completedRevenue += shareAmount;
            } else {
              vendorData.individualSales.pending++;
              vendorData.individualSales.pendingRevenue += shareAmount;
            }
          }
          
          // Add to recent sales (limit to 5 most recent)
          if (vendorData.recentSales.length < 5) {
            vendorData.recentSales.push({
              id: sale.id,
              fecha: sale.created_at,
              cliente: clientName,
              total: saleTotal,
              shareAmount: shareAmount,
              estado: sale.estado,
              isShared: isShared,
              otherVendors: isShared ? vendors
                .filter(v => v.usuarios?.id !== vendorId)
                .map(v => `${v.usuarios?.nombre || ''} ${v.usuarios?.apellido || ''}`.trim())
                .filter(name => name) : []
            });
          }
        });
      });
      
      const processedData = Array.from(vendorMap.values()).sort((a, b) => b.totalSales.revenue - a.totalSales.revenue);
      
      return { data: processedData, error: null };
    } catch (error) {
      logger.error('Error in getVendorPerformance:', error);
      return { data: null, error: error?.message };
    }
  },

  // OPTIMIZED: Get top companies by revenue
  async getTopCompanies(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          id,
          total,
          estado,
          created_at,
          venta_clientes(
            cliente_id,
            clientes(id, nombre, empresa_id, empresas(id, nombre))
          )
        `)
        .in('estado', ['completada', 'pendiente']);
      
      if (error) throw error;
      
      // Process data to get top companies
      const companyStats = {};
      data.forEach(sale => {
        if (sale.venta_clientes && sale.venta_clientes.length > 0) {
          sale.venta_clientes.forEach(ventaCliente => {
            const cliente = ventaCliente.clientes;
            if (cliente) {
              const empresa = cliente.empresas;
              const companyId = empresa ? empresa.id : 'individual';
              const companyName = empresa ? empresa.nombre : 'Clientes Individuales';
              
              if (!companyStats[companyId]) {
                companyStats[companyId] = {
                  id: companyId,
                  nombre: companyName,
                  totalVentas: 0,
                  ingresos: 0,
                  clientes: new Set()
                };
              }
              
              companyStats[companyId].totalVentas += 1;
              companyStats[companyId].ingresos += parseFloat(sale.total || 0);
              companyStats[companyId].clientes.add(cliente.id);
            }
          });
        }
      });
      
      const sortedCompanies = Object.values(companyStats)
        .map(company => ({
          ...company,
          cantidadClientes: company.clientes.size,
          ticketPromedio: company.totalVentas > 0 ? company.ingresos / company.totalVentas : 0
        }))
        .sort((a, b) => b.ingresos - a.ingresos)
        .slice(0, limit);
      
      return { data: sortedCompanies, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Obtener productos más vendidos
  async getTopProducts(limit = 10, month = null) {
    try {
      logger.log('🔍 Cargando productos más vendidos...');
      
      const { data, error } = await supabase
        .from('venta_productos')
        .select(`
          cantidad,
          precio_unitario,
          ventas!inner(
            id,
            fecha_venta,
            created_at,
            estado
          ),
          armazones(
            id,
            sku,
            color,
            precio,
            marcas(id, nombre)
          )
        `)
        .eq('tipo_producto', 'armazon')
        .in('ventas.estado', ['completada', 'pendiente']);
      
      if (error) {
        logger.error('❌ Error en getTopProducts:', error);
        throw error;
      }
      
      logger.debug('📊 Datos de productos más vendidos:', data?.length || 0, 'registros');
      
      // Filter by month if specified
      let filteredProducts = data;
      if (month) {
        filteredProducts = data.filter(product => {
          const saleDate = new Date(product.ventas.fecha_venta || product.ventas.created_at);
          const saleYearMonth = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
          return saleYearMonth === month;
        });
      }
      
      // Process products
      const productStats = {};
      filteredProducts.forEach(product => {
        if (!product.armazones) return;
        
        const armazon = product.armazones;
        const productId = armazon.id;
        
        if (!productStats[productId]) {
          productStats[productId] = {
            id: productId,
            sku: armazon.sku || 'N/A',
            brand: armazon.marcas?.nombre || 'Sin marca',
            marca: armazon.marcas?.nombre || 'Sin marca',
            color: armazon.color || 'N/A',
            price: product.precio_unitario || armazon.precio || 0,
            precio: product.precio_unitario || armazon.precio || 0,
            totalSold: 0,
            quantity: 0
          };
        }
        
        const cantidad = parseInt(product.cantidad) || 1;
        productStats[productId].totalSold += cantidad;
        productStats[productId].quantity += cantidad;
      });
      
      const sortedProducts = Object.values(productStats)
        .filter(product => product.totalSold > 0)
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, limit);
      
      logger.debug('🏆 Productos más vendidos calculados:', sortedProducts.length, 'productos');
      
      return { data: sortedProducts, error: null };
    } catch (error) {
      logger.error('❌ Error en getTopProducts:', error);
      return { data: null, error: error?.message };
    }
  },

  // Obtener datos mensuales optimizados
  async getMonthlyData(year, month) {
    try {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          id,
          total,
          estado,
          created_at
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('estado', ['completada', 'pendiente']);
      
      if (error) throw error;
      
      // Process monthly totals
      let totalRevenue = 0;
      let completedRevenue = 0;
      let pendingRevenue = 0;
      
      // Process daily data
      const dailySales = {};
      const daysInMonth = endDate.getDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Initialize all days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dayDate = new Date(parseInt(year), parseInt(month) - 1, day);
        dayDate.setHours(0, 0, 0, 0);
        const dayKey = `${year}-${String(parseInt(month)).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const isToday = dayDate.getTime() === today.getTime();
        
        dailySales[dayKey] = {
          date: dayDate,
          day: day,
          totalSales: 0,
          completedSales: 0,
          pendingSales: 0,
          salesCount: 0,
          isFuture: dayDate.getTime() > today.getTime(),
          isToday: isToday
        };
      }
      
      // Process sales data
      data.forEach(sale => {
        const saleAmount = parseFloat(sale.total || 0);
        totalRevenue += saleAmount;
        
        if (sale.estado === 'completada') {
          completedRevenue += saleAmount;
        } else {
          pendingRevenue += saleAmount;
        }
        
        // Group by day
        const saleDate = new Date(sale.created_at);
        const dayKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}-${String(saleDate.getDate()).padStart(2, '0')}`;
        
        if (dailySales[dayKey]) {
          dailySales[dayKey].salesCount++;
          dailySales[dayKey].totalSales += saleAmount;
          
          if (sale.estado === 'completada') {
            dailySales[dayKey].completedSales += saleAmount;
          } else {
            dailySales[dayKey].pendingSales += saleAmount;
          }
        }
      });
      
      const MONTHLY_GOAL = 100000;
      const progressPercentage = Math.min((totalRevenue / MONTHLY_GOAL) * 100, 100);
      
      return {
        data: {
          totalSales: totalRevenue,
          completedSales: completedRevenue,
          pendingSales: pendingRevenue,
          goal: MONTHLY_GOAL,
          goalAchieved: totalRevenue >= MONTHLY_GOAL,
          progressPercentage: progressPercentage,
          dailyData: Object.values(dailySales).sort((a, b) => a.day - b.day)
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
        .from('venta_productos')
        .select(`
          cantidad,
          precio_unitario,
          ventas!inner(
            id,
            fecha_venta,
            created_at,
            estado
          ),
          armazones(
            id,
            sku,
            color,
            precio,
            marcas(id, nombre)
          )
        `)
        .eq('tipo_producto', 'armazon')
        .in('ventas.estado', ['completada']);

      if (error) {
        logger.error('❌ Error en getBestSellingProducts:', error);
        throw error;
      }

      logger.debug('📊 Datos de productos más vendidos:', data?.length || 0, 'registros');

      // Agrupar por producto
      const productStats = {};
      data.forEach((product, index) => {
        if (!product.armazones) return;
        
        const armazon = product.armazones;
        const productId = armazon.id;
        
        if (!productStats[productId]) {
          productStats[productId] = {
            id: productId,
            sku: armazon.sku || 'N/A',
            color: armazon.color || 'N/A',
            brand: armazon.marcas?.nombre || 'Sin marca',
            description: armazon.sku || 'N/A',
            price: product.precio_unitario || armazon.precio || 0,
            totalSold: 0
          };
        }
        
        const cantidad = parseInt(product.cantidad) || 1;
        productStats[productId].totalSold += cantidad;
      });

      // Convertir a array y ordenar por cantidad vendida
      const productArray = Object.values(productStats)
        .filter(product => product.totalSold > 0) // Solo productos con ventas
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 10); // Top 10 productos

      logger.debug('🏆 Productos más vendidos calculados:', productArray.length, 'productos');

      return { data: productArray, error: null };
    } catch (error) {
      logger.error('❌ Error en getBestSellingProducts:', error);
      return { data: [], error: error?.message };
    }
  }
};

export default salesService;