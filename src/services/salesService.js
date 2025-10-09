import { supabase } from '../lib/supabase';

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
          clientes:cliente_id (id, nombre, telefono, correo, empresa_id, empresas:empresa_id(id, nombre)),
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
        
        // Calcular saldo pendiente basado en abonos
        const totalAbonos = (item.abonos || []).reduce((sum, abono) => sum + parseFloat(abono.monto || 0), 0);
        const saldoPendiente = Math.max(0, parseFloat(item.total) - totalAbonos);
        const porcentajePagado = parseFloat(item.total) > 0 ? (totalAbonos / parseFloat(item.total)) * 100 : 0;
        
        return {
        id: item.id,
        folio: item.folio,
        cliente: item.clientes,
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
      const { items, vendedor_ids, ...ventaDetails } = salesData;

      // 1. Generar folio único
      const folio = await this.generateUniqueFolio();

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

     // 3. Preparamos los datos para la tabla 'ventas' original.
const dataToInsert = {
  ...ventaDetails,
  folio: folio, // Agregar el folio generado
  armazon_id: armazonItem ? armazonItem.armazon_id : null,
  precio_armazon: armazonItem ? parseFloat(armazonItem.precio_unitario) || 0 : 0,
  descripcion_micas: micasItem ? micasItem.descripcion : '',
  precio_micas: micasItem ? parseFloat(micasItem.precio_unitario) || 0 : 0,
  
  // --- CAMBIO CLAVE: Asegurar que los valores sean numéricos ---
  descuento_armazon_monto: parseFloat(ventaDetails.descuento_armazon_monto) || 0,
  descuento_micas_monto: parseFloat(ventaDetails.descuento_micas_monto) || 0,
  descuento_monto: parseFloat(ventaDetails.descuento_monto) || 0,
  
  // --- Datos de facturación ---
  requiere_factura: ventaDetails.requiere_factura || false,
  monto_iva: parseFloat(ventaDetails.monto_iva) || 0,
  rfc: ventaDetails.rfc || null,
  razon_social: ventaDetails.razon_social || null,
};
delete dataToInsert.descuento_armazon_porcentaje;
delete dataToInsert.descuento_micas_porcentaje;
delete dataToInsert.descuento_porcentaje;
delete dataToInsert.items;

      // 3. Insertamos en la tabla 'ventas' como siempre lo has hecho.
      const { data, error } = await supabase
        .from('ventas')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

  // 4. (Opcional pero recomendado) Asociamos los vendedores.
  if (data && vendedor_ids && vendedor_ids.length > 0) {
    const ventaVendedores = vendedor_ids.map(vendedor_id => ({
      venta_id: data.id,
      vendedor_id,
    }));
    const { error: vvError } = await supabase.from('venta_vendedores').insert(ventaVendedores);
    if (vvError) {
      console.error('Error al insertar vendedores:', vvError);
      // Si falla, borramos la venta para no dejar datos inconsistentes.
      await supabase.from('ventas').delete().eq('id', data.id);
      return { data: null, error: `Error al asociar vendedores: ${vvError.message}` };
    }
  }

  // 5. Reducir el stock del armazón si la venta no está cancelada
  if (data && armazonItem && armazonItem.armazon_id && ventaDetails.estado !== 'cancelada') {
    const { inventoryService } = await import('./inventoryService');
    const firstVendedorId = vendedor_ids && vendedor_ids.length > 0 ? vendedor_ids[0] : null;
    
    const stockResult = await inventoryService.reduceStockForSale(
      armazonItem.armazon_id,
      1,
      firstVendedorId
    );
    
    if (stockResult.error) {
      console.error('Error al reducir stock:', stockResult.error);
      // Revertir la venta si no se pudo reducir el stock
      await supabase.from('venta_vendedores').delete().eq('venta_id', data.id);
      await supabase.from('ventas').delete().eq('id', data.id);
      return { data: null, error: `Error al reducir stock: ${stockResult.error}` };
    }
  }
  
  // Retornar la venta creada (el componente recargará la lista completa con los datos relacionados)
  return { data, error: null };


    } catch (error) {
      console.error('Error creando la nota de venta:', error);
      return { data: null, error: error.message };
    }
  },

  async updateSalesNote(id, updates) {
    try {
      const { vendedor_ids, items, ...restOfUpdates } = updates;

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
      const armazonPrice = restOfUpdates.precio_armazon || 0;
      const micaPrice = restOfUpdates.precio_micas || 0;

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
            console.log('Stock restored due to sale cancellation');
          }
        }
        
        if (currentSale.estado === 'cancelada' && restOfUpdates.estado !== 'cancelada') {
          const reduceResult = await inventoryService.reduceStockForSale(
            currentSale.armazon_id,
            1,
            firstVendedorId // Use the first seller for history
          );
          
          if (reduceResult.error) {
            console.warn('Warning: Could not reduce stock when reactivating sale:', reduceResult.error);
          } else {
            console.log('Stock reduced due to sale reactivation');
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
      console.log('🔍 Cargando rendimiento por vendedor...');
      
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
        console.error('❌ Error en getSalesByVendor:', error);
        throw error;
      }

      console.log('📊 Datos de ventas para vendedores:', data?.length || 0, 'registros');

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

      console.log('📈 Estadísticas de procesamiento:', {
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

      console.log('🏆 Top 3 vendedores:', vendorArray.slice(0, 3).map(v => 
        `${v.name}: $${v.totalRevenue.toLocaleString()} (${v.totalSales} ventas)`
      ));

      return { data: vendorArray, error: null };
    } catch (error) {
      console.error('❌ Error en getSalesByVendor:', error);
      return { data: [], error: error?.message };
    }
  },

  async getBestSellingProducts() {
    try {
      console.log('🔍 Cargando productos más vendidos...');
      
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
        console.error('❌ Error en getBestSellingProducts:', error);
        throw error;
      }

      console.log('📊 Datos de ventas para productos más vendidos:', data?.length || 0, 'registros');

      // Mostrar algunas ventas de ejemplo para debug
      if (data && data.length > 0) {
        console.log('🔍 Primeras 3 ventas:', data.slice(0, 3).map(sale => ({
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
        console.log('📊 Estados de ventas:', estadoCount);
      }

      // Filtrar solo ventas completadas para productos más vendidos
      const completedSales = data?.filter(sale => sale.estado === 'completada') || [];
      console.log('✅ Ventas completadas para productos:', completedSales.length, 'de', data?.length || 0, 'total');

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
            console.log(`🆕 Nuevo producto encontrado: ${product?.sku} (ID: ${productId})`);
          }
          
          productStats[productId].totalSold += 1;
          
          // Log para los primeros productos
          if (index < 5) {
            console.log(`📦 Venta ${index + 1}: ${product?.sku} - Total actual: ${productStats[productId].totalSold}`);
          }
        } else {
          console.log(`⚠️ Venta sin producto válido:`, { productId, hasProduct: !!product });
        }
      });

      // Convertir a array y ordenar por cantidad vendida
      const productArray = Object.values(productStats)
        .filter(product => product.totalSold > 0) // Solo productos con ventas
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 10); // Top 10 productos

      console.log('🏆 Productos más vendidos calculados:', productArray.length, 'productos');
      console.log('📈 Top 5:', productArray.slice(0, 5).map(p => `${p.sku} (${p.brand}): ${p.totalSold} ventas`));
      console.log('📊 Estadísticas completas:', Object.keys(productStats).length, 'productos únicos encontrados');

      return { data: productArray, error: null };
    } catch (error) {
      console.error('❌ Error en getBestSellingProducts:', error);
      return { data: [], error: error?.message };
    }
  },
  async getSalesByPeriod(period = 'month') {
    try {
      console.log('🔍 getSalesByPeriod llamado con period:', period);
      
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

      console.log('📅 Fechas calculadas:', {
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

      console.log('🔍 Consulta ejecutada desde:', startDate.toISOString().split('T')[0], 'hasta:', endDate.toISOString().split('T')[0]);

      if (error) {
        console.error('❌ Error en consulta Supabase:', error);
        // En lugar de lanzar error, devolver array vacío para usar datos mock
        return { data: [], error: error.message };
      }
      
      console.log('📊 Datos raw de Supabase:', data);
      console.log('📊 Total de registros encontrados:', data?.length || 0);
      
      // Verificar específicamente si hay datos para hoy
      const today = new Date().toISOString().split('T')[0];
      const todayData = data?.filter(sale => {
        const saleDate = sale.fecha_venta.includes('T') 
          ? sale.fecha_venta.split('T')[0] 
          : sale.fecha_venta;
        return saleDate === today;
      });
      console.log('📅 Datos para hoy (' + today + '):', todayData);
      
      // Si no hay datos, devolver array vacío para usar datos mock
      if (!data || data.length === 0) {
        console.log('⚠️ No hay datos de ventas en el período');
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
          console.error('❌ Error procesando fecha:', sale.fecha_venta, dateError);
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
          console.error('❌ Error formateando fecha:', day.date, formatError);
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

      console.log('📈 ChartData final:', chartData);
      
      return { data: chartData, error: null };
    } catch (error) {
      console.error('❌ Error general en getSalesByPeriod:', error);
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

  // Función para generar folio único
  async generateUniqueFolio() {
    try {
      // Obtener el último folio de la base de datos
      const { data, error } = await supabase
        .from('ventas')
        .select('folio')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error al obtener último folio:', error);
        // Si hay error, generar folio basado en fecha
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const time = String(now.getTime()).slice(-6); // Últimos 6 dígitos del timestamp
        return `V${year}${month}${day}${time}`;
      }

      let nextNumber = 1;
      
      if (data && data.length > 0) {
        const lastFolio = data[0].folio;
        // Extraer número del folio (asumiendo formato VYYYYMMDDNNNNNN)
        const match = lastFolio.match(/V(\d{8})(\d+)/);
        if (match) {
          const lastDate = match[1];
          const lastNumber = parseInt(match[2]);
          
          // Verificar si es el mismo día
          const today = new Date();
          const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
          
          if (lastDate === todayStr) {
            nextNumber = lastNumber + 1;
          }
        }
      }

      // Generar nuevo folio
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const number = String(nextNumber).padStart(6, '0');
      
      return `V${year}${month}${day}${number}`;
    } catch (error) {
      console.error('Error generando folio:', error);
      // Fallback: folio basado en timestamp
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const time = String(now.getTime()).slice(-6);
      return `V${year}${month}${day}${time}`;
    }
  },
};