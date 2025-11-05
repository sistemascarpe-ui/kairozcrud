import { supabase } from '../lib/supabase';

export const inventoryService = {
  // OPTIMIZED: Get products summary (lightweight version for tables)
  async getProductsSummary(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('armazones')
        .select(`
          id,
          sku,
          color,
          stock,
          precio,
          created_at,
          marcas(id, nombre),
          grupos(id, nombre)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // OPTIMIZED: Get products count for pagination
  async getProductsCount() {
    try {
      const { count, error } = await supabase
        .from('armazones')
        .select('id', { count: 'exact' })
        .limit(1);
      
      if (error) throw error;
      return { count, error: null };
    } catch (error) {
      return { count: 0, error: error?.message };
    }
  },

  // Get all products with relationships
  async getProducts() {
    try {
      const { data, error } = await supabase
        .from('armazones')
        .select(`
          id,
          sku,
          color,
          stock,
          precio,
          created_at,
          updated_at,
          editado_manualmente,
          marca_id,
          grupo_id,
          descripcion_id,
          sub_marca_id,
          creado_por_id,
          marcas(id, nombre),
          grupos(id, nombre),
          sub_marcas(id, nombre),
          descripciones(id, nombre),
          usuarios(id, nombre, apellido)
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      // Obtener información de campañas para todos los productos de una vez
      const productIds = data?.map(p => p.id) || [];
      let campaignInfo = {};
      
      // TEMPORALMENTE DESACTIVADO PARA EVITAR ERRORES 400
      // TODO: Revisar estructura de tabla campana_productos
      /*
      if (productIds.length > 0) {
        try {
          const { data: campaignData, error: campaignError } = await supabase
            .from('campana_productos')
            .select('armazon_id, cantidad_enviada, cantidad_devuelta')
            .in('armazon_id', productIds)
            .in('estado', ['enviado', 'vendido']);
          
          if (campaignError) {
            console.warn('Error al obtener datos de campañas:', campaignError);
            // Continuar sin datos de campañas
          } else {
            // Agrupar por armazon_id
            campaignData?.forEach(item => {
              const productId = item.armazon_id;
              if (!campaignInfo[productId]) {
                campaignInfo[productId] = 0;
              }
              campaignInfo[productId] += (item.cantidad_enviada - (item.cantidad_devuelta || 0));
            });
          }
        } catch (campaignError) {
          console.warn('Error al consultar campañas:', campaignError);
          // Continuar sin datos de campañas
        }
      }
      */
      
      // Agregar información de campañas a cada producto
      const productsWithCampaigns = (data || []).map(product => ({
        ...product,
        cantidad_en_campanas: campaignInfo[product.id] || 0
      }));
      
      return { data: productsWithCampaigns, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get product by ID
  async getProduct(id) {
    try {
      const { data, error } = await supabase?.from('armazones')?.select(`
          *,
          marcas(nombre),
          grupos(nombre),
          sub_marcas(nombre),
          descripciones(*)
        `)?.eq('id', id)?.single()
      
      if (error) {
        throw error
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Create new product
  async createProduct(productData) {
    try {
      console.log('inventoryService - Datos recibidos para crear producto:', productData);
      console.log('inventoryService - creado_por_id específicamente:', productData.creado_por_id);
      
      const { data, error } = await supabase?.from('armazones')?.insert([productData])?.select()?.single()
      
      if (error) {
        console.error('inventoryService - Error al crear producto:', error);
        throw error
      }
      
      console.log('inventoryService - Producto creado exitosamente:', data);
      return { data, error: null }
    } catch (error) {
      console.error('inventoryService - Error en createProduct:', error);
      return { data: null, error: error?.message };
    }
  },

  // Update product
  async updateProduct(id, updates) {
    try {
      console.log('inventoryService - Datos recibidos para actualizar producto:', updates);
      console.log('inventoryService - ID del producto a actualizar:', id);
      console.log('inventoryService - creado_por_id específicamente:', updates.creado_por_id);
      
      const { data, error } = await supabase?.from('armazones')?.update(updates)?.eq('id', id)?.select()?.single()
      
      if (error) {
        console.error('inventoryService - Error al actualizar producto:', error);
        throw error
      }
      
      // Marcar como editado manualmente después de actualizar
      await this.markProductAsEdited(id);
      
      console.log('inventoryService - Producto actualizado exitosamente:', data);
      return { data, error: null }
    } catch (error) {
      console.error('inventoryService - Error en updateProduct:', error);
      return { data: null, error: error?.message };
    }
  },

  // Mark product as manually edited
  async markProductAsEdited(productId) {
    try {
      const { data, error } = await supabase.rpc('marcar_producto_editado', {
        p_armazon_id: productId
      });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Delete product
  async deleteProduct(id) {
    try {
      const { error } = await supabase?.from('armazones')?.delete()?.eq('id', id)
      
      if (error) {
        throw error
      }
      
      return { error: null }
    } catch (error) {
      return { error: error?.message };
    }
  },

  // Delete product with authentication and logging
  async deleteProductWithAuth(id, userId, adminPin) {
    try {
      // Verificar que el PIN sea correcto desde variables de entorno
      const ADMIN_DELETE_PIN = import.meta.env.VITE_ADMIN_DELETE_PIN || '1234';
      
      if (adminPin !== ADMIN_DELETE_PIN) {
        return { 
          error: 'PIN de administración incorrecto. No tienes permisos para eliminar este armazón' 
        };
      }

      // Obtener información del producto antes de eliminarlo para el log
      const { data: productData, error: fetchError } = await supabase
        .from('armazones')
        .select('sku, color, stock, precio, marcas(nombre)')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Eliminar el producto
      const { error: deleteError } = await supabase
        .from('armazones')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Registrar la eliminación en el historial (opcional)
      const { error: logError } = await supabase
        .from('historial_inventario')
        .insert({
          armazon_id: id,
          usuario_id: userId,
          cantidad_cambio: -productData.stock,
          tipo_movimiento: `Eliminación autorizada - ${productData.sku} (${productData.marcas?.nombre || 'Sin marca'})`
        });

      if (logError) {
        console.warn('No se pudo registrar el log de eliminación:', logError.message);
      }

      console.log(`Armazón eliminado: ${productData.sku} por usuario ${userId}`);
      
      return { error: null };
    } catch (error) {
      console.error('Error eliminando armazón:', error);
      return { error: error?.message };
    }
  },

  // Update stock
  async updateStock(id, newStock, userId, movementType = 'Ajuste Manual') {
    try {
      // Get current stock for history
      const { data: currentProduct, error: fetchError } = await supabase?.from('armazones')?.select('stock')?.eq('id', id)?.single()
      
      if (fetchError) throw fetchError
      
      const stockChange = newStock - currentProduct?.stock
      
      // Update stock
      const { data, error: updateError } = await supabase?.from('armazones')?.update({ stock: newStock })?.eq('id', id)?.select()?.single()
      
      if (updateError) throw updateError
      
      // Create history record
      const { error: historyError } = await supabase?.from('historial_inventario')?.insert({
          armazon_id: id,
          usuario_id: userId,
          cantidad_cambio: stockChange,
          tipo_movimiento: movementType
        })
      
      if (historyError) {
        console.warn('History record creation failed:', historyError?.message)
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get brands
  async getBrands() {
    try {
      const { data, error } = await supabase?.from('marcas')?.select('*')?.order('nombre', { ascending: true })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get groups
  async getGroups() {
    try {
      const { data, error } = await supabase?.from('grupos')?.select('*')?.order('nombre', { ascending: true })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get sub-brands
  async getSubBrands() {
    try {
      const { data, error } = await supabase?.from('sub_marcas')?.select('*')?.order('nombre', { ascending: true })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get descriptions
  async getDescriptions() {
    try {
      const { data, error } = await supabase?.from('descripciones')?.select('*')?.order('nombre', { ascending: true })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get inventory history
  async getInventoryHistory(armazonId = null, limit = 50) {
    try {
      let query = supabase?.from('historial_inventario')?.select(`
          *,
          armazones(sku, color),
          usuarios(nombre, apellido)
        `)?.order('created_at', { ascending: false })?.limit(limit)
      
      if (armazonId) {
        query = query?.eq('armazon_id', armazonId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get products with low stock
  async getLowStockProducts(threshold = 2) {
    try {
      const { data, error } = await supabase?.from('armazones')?.select(`
          *,
          marcas(nombre),
          grupos(nombre)
        `)?.lte('stock', threshold)?.order('stock', { ascending: true })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Get products that are out of stock
  async getOutOfStockProducts() {
    try {
      const { data, error } = await supabase
        .from('armazones')
        .select(`
          *,
          marcas(nombre),
          grupos(nombre)
        `)
        .eq('stock', 0) // La diferencia clave: busca stock igual a 0
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  },

  // Bulk update products
  async bulkUpdateProducts(productIds, updates) {
    try {
      const { data, error } = await supabase?.from('armazones')?.update(updates)?.in('id', productIds)?.select()
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },

  // Reduce stock when a sale is made
  async reduceStockForSale(armazonId, quantity, userId) {
    try {
      // Get current stock
      const { data: currentProduct, error: fetchError } = await supabase
        .from('armazones')
        .select('stock, sku, color')
        .eq('id', armazonId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentStock = currentProduct?.stock || 0;
      
      // Validate sufficient stock
      if (currentStock < quantity) {
        return { 
          data: null, 
          error: `Stock insuficiente. Stock actual: ${currentStock}, cantidad solicitada: ${quantity}` 
        };
      }
      
      const newStock = currentStock - quantity;
      
      // Update stock
      const { data, error: updateError } = await supabase
        .from('armazones')
        .update({ stock: newStock })
        .eq('id', armazonId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      // Create history record
      const { error: historyError } = await supabase
        .from('historial_inventario')
        .insert({
          armazon_id: armazonId,
          usuario_id: userId,
          cantidad_cambio: -quantity, // Negative because it's a reduction
          tipo_movimiento: 'Venta'
        });
      
      if (historyError) {
        console.warn('History record creation failed:', historyError?.message);
      }
      
      console.log(`Stock reducido para armazón ${currentProduct.sku}: ${currentStock} -> ${newStock}`);
      
      return { data, error: null };
    } catch (error) {
      console.error('Error reducing stock for sale:', error);
      return { data: null, error: error?.message };
    }
  },

  // Get inventory status for chart
  async getInventoryStatus() {
    try {
      const { data, error } = await supabase
        .from('armazones')
        .select('stock');
      
      if (error) throw error;
      
      console.log('Raw inventory data:', data);
      
      // Categorizar productos por estado de stock
      let inStock = 0;
      let outOfStock = 0;
      
      data?.forEach(product => {
        const stock = parseInt(product.stock) || 0;
        
        if (stock === 0) {
          outOfStock++;
        } else {
          inStock++;
        }
      });
      
      console.log('Inventory categorization:', { inStock, outOfStock, total: data?.length });
      
      // Formatear datos para el gráfico tipo doughnut
      const chartData = [
        {
          label: 'En Stock',
          value: inStock,
          color: '#3B82F6', // blue-500
          percentage: data?.length > 0 ? ((inStock / data.length) * 100).toFixed(1) : 0
        },
        {
          label: 'Sin Stock',
          value: outOfStock,
          color: '#EF4444', // red-500
          percentage: data?.length > 0 ? ((outOfStock / data.length) * 100).toFixed(1) : 0
        }
      ];
      
      console.log('Chart data formatted:', chartData);
      
      return { 
        data: {
          chartData,
          summary: {
            total: data?.length || 0,
            inStock,
            outOfStock
          }
        }, 
        error: null 
      };
    } catch (error) {
      return { data: null, error: error?.message };
    }
  },
  async getProductById(id) {
    if (!id) return null;
    const { data, error } = await supabase
        .from('armazones')
        .select('*, marcas(nombre), descripciones(nombre)')
        .eq('id', id)
        .single();
    if (error) return null;
    return data;
  },
  // Get inventory metrics for dashboard
  async getInventoryMetrics() {
    try {
      console.log('Cargando métricas de inventario...');
      
      const { data, error } = await supabase
        .from('armazones')
        .select('stock, precio');
      
      if (error) throw error;
      
      console.log('Datos de inventario obtenidos:', data?.length || 0, 'productos');
      
      // Calcular métricas
      const totalProducts = data?.length || 0;
      const totalFrames = data?.reduce((sum, product) => sum + (parseInt(product.stock) || 0), 0) || 0;
      const outOfStock = data?.filter(product => (parseInt(product.stock) || 0) === 0).length || 0;
      const lowStock = data?.filter(product => {
        const stock = parseInt(product.stock) || 0;
        return stock > 0 && stock <= 2;
      }).length || 0;
      
      const totalValue = data?.reduce((sum, product) => {
        const stock = parseInt(product.stock) || 0;
        const price = parseFloat(product.precio) || 0;
        return sum + (stock * price);
      }, 0) || 0;
      
      // Obtener productos con stock bajo para alertas
      const { data: lowStockProducts, error: lowStockError } = await this.getOutOfStockProducts();
      
      const metrics = {
        totalProducts,
        totalFrames,
        lowStock,
        outOfStock,
        totalValue,
        lowStockProducts: lowStockProducts || []
      };
      
      console.log('Métricas calculadas:', metrics);
      
      return { data: metrics, error: null };
    } catch (error) {
      console.error('Error en getInventoryMetrics:', error);
      return { data: null, error: error?.message };
    }
  }
};