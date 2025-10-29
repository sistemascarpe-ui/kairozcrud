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
          venta_productos (
            id,
            tipo_producto,
            armazon_id,
            descripcion_mica,
            cantidad,
            precio_unitario,
            subtotal,
            armazones (id, sku, color, precio, marcas(nombre), descripciones(nombre))
          ),
          abonos (id, monto, fecha_abono)
        `)
        .order('created_at', { ascending: false });

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
        const productos = item.venta_productos?.map(vp => ({
          id: vp.id,
          tipo: vp.tipo_producto,
          armazon_id: vp.armazon_id,
          descripcion_mica: vp.descripcion_mica,
          cantidad: vp.cantidad,
          precio_unitario: vp.precio_unitario,
          subtotal: vp.subtotal,
          armazon: vp.armazones ? {
            id: vp.armazones.id,
            sku: vp.armazones.sku,
            color: vp.armazones.color,
            precio: vp.armazones.precio,
            marca: vp.armazones.marcas?.nombre,
            descripcion: vp.armazones.descripciones?.nombre
          } : null
        })) || [];

        // Calcular totales de abonos
        const totalAbonos = item.abonos?.reduce((sum, abono) => sum + parseFloat(abono.monto || 0), 0) || 0;
        const saldoPendiente = Math.max(0, parseFloat(item.total || 0) - totalAbonos);
        const porcentajePagado = item.total > 0 ? (totalAbonos / parseFloat(item.total)) * 100 : 0;

        // Para mantener compatibilidad, buscar el primer armazón
        const primerArmazon = productos.find(p => p.armazon)?.armazon;
        const productosArmazon = productos.filter(p => p.tipo === 'armazon');
        const productosMica = productos.filter(p => p.tipo === 'mica');

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
          descuento_armazon_monto: 0,
          descuento_micas_monto: 0,
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
          venta_productos (
            id,
            tipo_producto,
            armazon_id,
            descripcion_mica,
            cantidad,
            precio_unitario,
            subtotal,
            armazones (id, sku, color, precio, marcas(nombre), descripciones(nombre))
          ),
          abonos (id, monto, fecha_abono)
        `)
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
        .update(updates)
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
      // Obtener la fecha actual en zona horaria de México
      const today = new Date();
      const mexicoToday = new Date(today.toLocaleString("en-US", {timeZone: "America/Mexico_City"}));
      const todayString = mexicoToday.toISOString().split('T')[0];

      // Buscar el último folio del día actual
      const { data: lastSale } = await supabase
        .from('ventas')
        .select('folio')
        .gte('created_at', `${todayString}T00:00:00.000Z`)
        .lt('created_at', `${todayString}T23:59:59.999Z`)
        .order('folio', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;

      if (lastSale && lastSale.folio) {
        // Extraer el número del último folio
        const numberMatch = lastSale.folio.match(/(\d+)$/);
        if (numberMatch) {
          nextNumber = parseInt(numberMatch[1]) + 1;
        }
      }

      // Formatear el número con 4 dígitos
      const formattedNumber = nextNumber.toString().padStart(4, '0');
      
      return formattedNumber;
    } catch (error) {
      console.error('Error generating folio:', error);
      // Fallback: usar timestamp simplificado
      const timestamp = Date.now().toString();
      return timestamp.slice(-4);
    }
  }
};