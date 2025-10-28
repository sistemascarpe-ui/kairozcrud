import { supabase } from '../lib/supabase';

export const migrationCheck = {
  async checkAndMigrate() {
    try {
      console.log('🔍 Verificando estado de la base de datos...');
      
      // 1. Verificar si existe la tabla venta_productos
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'venta_productos');
      
      if (tablesError) {
        console.error('Error verificando tablas:', tablesError);
        return { success: false, error: tablesError.message };
      }
      
      const ventaProductosExists = tables && tables.length > 0;
      console.log('📋 Tabla venta_productos existe:', ventaProductosExists);
      
      // 2. Verificar si hay datos en la tabla ventas
      const { data: ventasData, error: ventasError } = await supabase
        .from('ventas')
        .select('id, armazon_id, precio_armazon, descripcion_micas, precio_micas')
        .limit(5);
      
      if (ventasError) {
        console.error('Error verificando ventas:', ventasError);
        return { success: false, error: ventasError.message };
      }
      
      console.log('📊 Notas de venta encontradas:', ventasData?.length || 0);
      console.log('📝 Muestra de datos:', ventasData);
      
      // 3. Si venta_productos no existe, necesitamos ejecutar la migración
      if (!ventaProductosExists) {
        console.log('⚠️ La tabla venta_productos no existe. Ejecutando migración...');
        return await this.executeMigration();
      }
      
      // 4. Verificar si hay datos en venta_productos
      const { data: productosData, error: productosError } = await supabase
        .from('venta_productos')
        .select('*')
        .limit(5);
      
      if (productosError) {
        console.error('Error verificando venta_productos:', productosError);
        return { success: false, error: productosError.message };
      }
      
      console.log('🛍️ Productos en venta_productos:', productosData?.length || 0);
      
      // 5. Si venta_productos existe pero está vacía, migrar datos
      if (ventaProductosExists && (!productosData || productosData.length === 0) && ventasData && ventasData.length > 0) {
        console.log('🔄 Migrando datos existentes...');
        return await this.migrateExistingData();
      }
      
      return { 
        success: true, 
        message: 'Base de datos verificada correctamente',
        stats: {
          ventaProductosExists,
          ventasCount: ventasData?.length || 0,
          productosCount: productosData?.length || 0
        }
      };
      
    } catch (error) {
      console.error('Error en verificación:', error);
      return { success: false, error: error.message };
    }
  },
  
  async executeMigration() {
    try {
      console.log('🚀 Ejecutando migración completa...');
      
      // Aquí ejecutaríamos el SQL de migración
      // Por seguridad, solo reportamos que se necesita ejecutar manualmente
      return {
        success: false,
        needsManualMigration: true,
        message: 'Se necesita ejecutar la migración SQL manualmente en Supabase'
      };
      
    } catch (error) {
      console.error('Error en migración:', error);
      return { success: false, error: error.message };
    }
  },
  
  async migrateExistingData() {
    try {
      console.log('📦 Migrando datos existentes...');
      
      // Obtener todas las ventas con productos
      const { data: ventas, error: ventasError } = await supabase
        .from('ventas')
        .select('*')
        .not('armazon_id', 'is', null);
      
      if (ventasError) throw ventasError;
      
      console.log(`📋 Migrando ${ventas.length} notas de venta...`);
      
      for (const venta of ventas) {
        const productosToInsert = [];
        
        // Migrar armazón si existe
        if (venta.armazon_id && venta.precio_armazon) {
          productosToInsert.push({
            venta_id: venta.id,
            producto_id: venta.armazon_id,
            cantidad: 1,
            precio_unitario: venta.precio_armazon,
            subtotal: venta.precio_armazon,
            descuento_porcentaje: 0,
            descuento_monto: venta.descuento_armazon_monto || 0
          });
        }
        
        // Migrar micas si existe descripción y precio
        if (venta.descripcion_micas && venta.precio_micas) {
          // Para micas, usaremos un producto genérico o crearemos una entrada especial
          productosToInsert.push({
            venta_id: venta.id,
            producto_id: null, // Las micas no tienen producto_id específico
            cantidad: 1,
            precio_unitario: venta.precio_micas,
            subtotal: venta.precio_micas,
            descuento_porcentaje: 0,
            descuento_monto: venta.descuento_micas_monto || 0,
            descripcion: venta.descripcion_micas
          });
        }
        
        if (productosToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('venta_productos')
            .insert(productosToInsert);
          
          if (insertError) {
            console.error(`Error migrando venta ${venta.id}:`, insertError);
          }
        }
      }
      
      console.log('✅ Migración de datos completada');
      return { success: true, message: 'Datos migrados correctamente' };
      
    } catch (error) {
      console.error('Error migrando datos:', error);
      return { success: false, error: error.message };
    }
  }
};