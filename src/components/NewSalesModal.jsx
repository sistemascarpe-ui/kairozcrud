import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator, User, Package } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/SelectSimple';
import { Checkbox } from './ui/Checkbox';
import { customerService } from '../services/customerService';
import { inventoryService } from '../services/inventoryService';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

const NewSalesModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  sale = null, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    cliente_ids: [],
    vendedor_ids: [],
    estado: 'pendiente',
    observaciones: '',
    requiere_factura: false,
    rfc: '',
    razon_social: '',
    folio_manual: '',
    registrar_abono: false,
    monto_abono: '',
    forma_pago_abono: 'efectivo',
    observaciones_abono: '',
    // Campos adicionales para descuentos y monto total
    monto_total_compra: '',
    descuento_general_porcentaje: 0,
    descuento_general_monto: 0
  });

  const [productos, setProductos] = useState([
    {
      id: Date.now(),
      tipo_producto: 'armazon',
      armazon_id: '',
      descripcion_mica: '',
      cantidad: 1,
      precio_unitario: 0,
      // Descuentos específicos por producto
      descuento_armazon_porcentaje: 0,
      descuento_armazon_monto: 0,
      descuento_micas_porcentaje: 0,
      descuento_micas_monto: 0,
      subtotal: 0
    }
  ]);

  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [errors, setErrors] = useState({});
  const [totals, setTotals] = useState({ 
    subtotal: 0, 
    descuentoTotal: 0, 
    total: 0, 
    iva: 0, 
    totalConIva: 0 
  });

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      
      if (sale) {
        // Modo edición - cargar datos de la venta existente
        // Determinar si la venta usa productos o monto manual
        const usaProductos = Array.isArray(sale.productos) && sale.productos.length > 0;
        const baseMonto = !usaProductos ? (parseFloat(sale.subtotal) || parseFloat(sale.total) || 0) : '';

        // Calcular descuento general de forma robusta:
        // 1) Usar el valor guardado en la venta si existe
        // 2) Si es 0/ausente, calcularlo como (subtotal - total) menos la suma de descuentos por producto
        const sumaDescuentosProductos = (Array.isArray(sale.productos) ? sale.productos.reduce((sum, p) => {
          return sum + (parseFloat(p.descuento_monto) || 0);
        }, 0) : 0);

        const descuentoCalculado = Math.max(0, (parseFloat(sale.subtotal) || 0) - (parseFloat(sale.total) || 0));
        const descuentoGeneralMonto = (() => {
          const dg = parseFloat(sale.descuento_monto) || 0;
          if (dg > 0) return dg;
          const restante = Math.max(0, descuentoCalculado - sumaDescuentosProductos);
          return restante;
        })();

        const descuentoGeneralPorcentaje = (baseMonto && descuentoGeneralMonto > 0)
          ? Math.round(((descuentoGeneralMonto / baseMonto) * 100) * 100) / 100
          : 0;

        // Tomar el primer abono como "abono inicial" si existe
        const primerAbono = Array.isArray(sale.abonos) && sale.abonos.length > 0 ? sale.abonos[0] : null;

        setFormData({
          cliente_ids: sale.clientes ? sale.clientes.map(c => c.id) : [],
          vendedor_ids: sale.vendedores ? sale.vendedores.map(v => v.id) : [],
          estado: sale.estado || 'pendiente',
          observaciones: sale.observaciones || '',
          requiere_factura: sale.requiere_factura || false,
          rfc: sale.rfc || '',
          razon_social: sale.razon_social || '',
          folio_manual: String(sale.folio || '').replace(/\D/g, '').slice(-4) || '',
          // Registro de abono inicial
          registrar_abono: !!primerAbono,
          monto_abono: primerAbono ? (primerAbono.monto ?? '') : '',
          forma_pago_abono: primerAbono?.forma_pago || 'efectivo',
          observaciones_abono: primerAbono?.observaciones || '',
          // Configuración de precios (monto manual y descuentos generales)
          monto_total_compra: baseMonto || '',
          descuento_general_porcentaje: descuentoGeneralPorcentaje || 0,
          descuento_general_monto: descuentoGeneralMonto || 0
        });
        
        // Cargar productos de la venta:
        // Preferir la nueva estructura `sale.productos`; si no existe, usar los campos legacy.
        let productosVenta = [];
        if (Array.isArray(sale.productos) && sale.productos.length > 0) {
          productosVenta = sale.productos.map((p, idx) => {
            const cantidad = parseFloat(p.cantidad) || 1;
            const precioUnitario = parseFloat(p.precio_unitario) || 0;
            const descuentoMonto = parseFloat(p.descuento_monto) || 0;
            const tipo = p.tipo_producto || (p.armazon_id ? 'armazon' : 'mica');
            return {
              id: Date.now() + idx,
              tipo_producto: tipo,
              // Aceptar tanto id directo como objeto armazón
              armazon_id: p.armazon_id || p.armazon?.id || '',
              descripcion_mica: p.descripcion_mica || '',
              cantidad,
              precio_unitario: precioUnitario,
              // Evitar doble conteo: usar el descuento específico y poner descuento_monto en 0
              descuento_monto: 0,
              descuento_armazon_porcentaje: 0,
              descuento_armazon_monto: tipo === 'armazon' ? descuentoMonto : 0,
              descuento_micas_porcentaje: 0,
              descuento_micas_monto: tipo === 'mica' ? descuentoMonto : 0,
              subtotal: parseFloat(p.subtotal) || (cantidad * precioUnitario - descuentoMonto)
            };
          });
        } else {
          // Fallback a los campos legacy si no hay array de productos
          if (sale.armazon_id) {
            productosVenta.push({
              id: Date.now(),
              tipo_producto: 'armazon',
              armazon_id: sale.armazon_id,
              descripcion_mica: '',
              cantidad: 1,
              precio_unitario: sale.precio_armazon || 0,
              // Evitar doble conteo en legacy: usar descuento específico y dejar descuento_monto en 0
              descuento_monto: 0,
              descuento_armazon_porcentaje: 0,
              descuento_armazon_monto: sale.descuento_armazon_monto || 0,
              descuento_micas_porcentaje: 0,
              descuento_micas_monto: 0,
              subtotal: (parseFloat(sale.precio_armazon) || 0) - (parseFloat(sale.descuento_armazon_monto) || 0)
            });
          }
          if (sale.descripcion_micas) {
            productosVenta.push({
              id: Date.now() + 1,
              tipo_producto: 'mica',
              armazon_id: '',
              descripcion_mica: sale.descripcion_micas,
              cantidad: 1,
              precio_unitario: sale.precio_micas || 0,
              // Evitar doble conteo en legacy: usar descuento específico y dejar descuento_monto en 0
              descuento_monto: 0,
              descuento_armazon_porcentaje: 0,
              descuento_armazon_monto: 0,
              descuento_micas_porcentaje: 0,
              descuento_micas_monto: sale.descuento_micas_monto || 0,
              subtotal: (parseFloat(sale.precio_micas) || 0) - (parseFloat(sale.descuento_micas_monto) || 0)
            });
          }
        }
        if (productosVenta.length > 0) { setProductos(productosVenta); }
      } else {
        // Modo creación
        resetForm();
      }
    }
  }, [isOpen, sale]);

  useEffect(() => {
    calculateTotals();
  }, [
    productos, 
    formData.requiere_factura, 
    formData.monto_total_compra,
    formData.descuento_general_porcentaje,
    formData.descuento_general_monto
  ]);

  const loadInitialData = async () => {
    await Promise.all([
      loadCustomers(),
      loadInventory(),
      loadVendedores()
    ]);
  };

  const loadCustomers = async () => {
    try {
      const { data } = await customerService.getCustomers();
      if (data) {
        setCustomers(data.map(customer => ({
          value: customer.id,
          label: `${customer.nombre} - ${customer.telefono || 'Sin teléfono'}`
        })));
      }
    } catch (error) {
      toast.error('Error al cargar clientes');
    }
  };

  const loadVendedores = async () => {
    try {
      const { data } = await userService.getUsers();
      if (data) {
        setVendedores(data
          .filter(u => u.nombre?.toLowerCase() !== 'sistemas')
          .map(v => ({
            value: v.id,
            label: `${v.nombre} ${v.apellido || ''}`.trim()
          })));
      }
    } catch (error) {
      toast.error('Error al cargar vendedores');
    }
  };

  const loadInventory = async () => {
    try {
      const { data } = await inventoryService.getProducts();
      if (data) {
        // En creación ocultamos stock 0; en edición mostramos todo
        setInventory(sale ? data : data.filter(p => (p.stock || 0) > 0));
      }
    } catch (error) {
      toast.error('Error al cargar inventario');
    }
  };

  const resetForm = () => {
    setFormData({
      cliente_ids: [],
      vendedor_ids: [],
      estado: 'pendiente',
      observaciones: '',
      requiere_factura: false,
      rfc: '',
      razon_social: '',
      folio_manual: '',
      registrar_abono: false,
      monto_abono: '',
      forma_pago_abono: 'efectivo',
      observaciones_abono: '',
      // Campos adicionales para descuentos y monto total
      monto_total_compra: '',
      descuento_general_porcentaje: 0,
      descuento_general_monto: 0
    });
    setProductos([
      {
        id: Date.now(),
        tipo_producto: 'armazon',
        armazon_id: '',
        descripcion_mica: '',
        cantidad: 1,
        precio_unitario: 0,
        // Descuentos específicos por producto
        descuento_armazon_porcentaje: 0,
        descuento_armazon_monto: 0,
        descuento_micas_porcentaje: 0,
        descuento_micas_monto: 0,
        subtotal: 0
      }
    ]);
    setErrors({});
    setTotals({ subtotal: 0, descuentoTotal: 0, total: 0, iva: 0, totalConIva: 0 });
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const addProducto = () => {
    const newProducto = {
      id: Date.now(),
      tipo_producto: 'armazon',
      armazon_id: '',
      descripcion_mica: '',
      cantidad: 1,
      precio_unitario: 0,
      // Descuentos específicos por producto
      descuento_armazon_porcentaje: 0,
      descuento_armazon_monto: 0,
      descuento_micas_porcentaje: 0,
      descuento_micas_monto: 0,
      subtotal: 0
    };
    setProductos(prev => [...prev, newProducto]);
  };

  const removeProducto = (id) => {
    if (productos.length > 1) {
      setProductos(prev => prev.filter(p => p.id !== id));
    }
  };

  const updateProducto = (id, field, value) => {
    setProductos(prev => prev.map(producto => {
      if (producto.id === id) {
        const updated = { ...producto, [field]: value };
        
        // Si cambia el tipo de producto, limpiar campos específicos
        if (field === 'tipo_producto') {
          if (value === 'armazon') {
            updated.descripcion_mica = '';
          } else {
            updated.armazon_id = '';
          }
        }
        
        // Si cambia el armazón, actualizar precio
        if (field === 'armazon_id' && value) {
          const selectedProduct = inventory.find(p => p.id === value);
          updated.precio_unitario = selectedProduct ? selectedProduct.precio : 0;
        }
        
        // Calcular subtotal con descuentos específicos por tipo
        const cantidad = parseFloat(updated.cantidad) || 0;
        const precioUnitario = parseFloat(updated.precio_unitario) || 0;
        const descuentoGeneral = parseFloat(updated.descuento_monto) || 0;
        
        // Calcular descuentos específicos por tipo de producto
        let descuentoEspecifico = 0;
        if (updated.tipo_producto === 'armazon') {
          const descuentoPorcentaje = (precioUnitario * cantidad * (parseFloat(updated.descuento_armazon_porcentaje) || 0)) / 100;
          const descuentoMonto = parseFloat(updated.descuento_armazon_monto) || 0;
          descuentoEspecifico = descuentoPorcentaje + descuentoMonto;
        } else if (updated.tipo_producto === 'mica') {
          const descuentoPorcentaje = (precioUnitario * cantidad * (parseFloat(updated.descuento_micas_porcentaje) || 0)) / 100;
          const descuentoMonto = parseFloat(updated.descuento_micas_monto) || 0;
          descuentoEspecifico = descuentoPorcentaje + descuentoMonto;
        } else if (updated.tipo_producto === 'otro') {
          const descuentoPorcentaje = (precioUnitario * cantidad * (parseFloat(updated.descuento_micas_porcentaje) || 0)) / 100;
          const descuentoMonto = parseFloat(updated.descuento_micas_monto) || 0;
          descuentoEspecifico = descuentoPorcentaje + descuentoMonto;
        }
        
        updated.subtotal = (cantidad * precioUnitario) - descuentoGeneral - descuentoEspecifico;
        
        return updated;
      }
      return producto;
    }));
  };

  const calculateTotals = () => {
    // Si hay monto total de compra, usarlo como base
    if (formData.monto_total_compra && parseFloat(formData.monto_total_compra) > 0) {
      const montoBase = parseFloat(formData.monto_total_compra);
      
      // Calcular descuento general
      const descuentoGeneralPorcentaje = (montoBase * (parseFloat(formData.descuento_general_porcentaje) || 0)) / 100;
      const descuentoGeneralMonto = parseFloat(formData.descuento_general_monto) || 0;
      
      const descuentoTotal = descuentoGeneralPorcentaje + descuentoGeneralMonto;
      
      const total = montoBase - descuentoTotal;
      const iva = formData.requiere_factura ? total * 0.16 : 0;
      const totalConIva = total + iva;
      
      setTotals({ 
        subtotal: montoBase, 
        descuentoTotal, 
        total, 
        iva, 
        totalConIva,
        descuentoGeneralPorcentaje,
        descuentoGeneralMonto
      });
    } else {
      // Cálculo tradicional basado en productos
      const subtotal = productos.reduce((sum, p) => {
        const cantidad = parseFloat(p.cantidad) || 0;
        const precioUnitario = parseFloat(p.precio_unitario) || 0;
        return sum + (cantidad * precioUnitario);
      }, 0);
      
      // Calcular descuentos por producto
      const descuentoProductos = productos.reduce((sum, p) => {
        const descuentoGeneral = parseFloat(p.descuento_monto) || 0;
        let descuentoEspecifico = 0;
        
        const cantidad = parseFloat(p.cantidad) || 0;
        const precioUnitario = parseFloat(p.precio_unitario) || 0;
        
        if (p.tipo_producto === 'armazon') {
          const descuentoPorcentaje = (precioUnitario * cantidad * (parseFloat(p.descuento_armazon_porcentaje) || 0)) / 100;
          const descuentoMonto = parseFloat(p.descuento_armazon_monto) || 0;
          descuentoEspecifico = descuentoPorcentaje + descuentoMonto;
        } else if (p.tipo_producto === 'mica') {
          const descuentoPorcentaje = (precioUnitario * cantidad * (parseFloat(p.descuento_micas_porcentaje) || 0)) / 100;
          const descuentoMonto = parseFloat(p.descuento_micas_monto) || 0;
          descuentoEspecifico = descuentoPorcentaje + descuentoMonto;
        } else if (p.tipo_producto === 'otro') {
          const descuentoPorcentaje = (precioUnitario * cantidad * (parseFloat(p.descuento_micas_porcentaje) || 0)) / 100;
          const descuentoMonto = parseFloat(p.descuento_micas_monto) || 0;
          descuentoEspecifico = descuentoPorcentaje + descuentoMonto;
        }
        
        return sum + descuentoGeneral + descuentoEspecifico;
      }, 0);
      
      // Calcular descuento general adicional
      const descuentoGeneralPorcentaje = (subtotal * (parseFloat(formData.descuento_general_porcentaje) || 0)) / 100;
      const descuentoGeneralMonto = parseFloat(formData.descuento_general_monto) || 0;
      const descuentoGeneral = descuentoGeneralPorcentaje + descuentoGeneralMonto;
      
      const descuentoTotal = descuentoProductos + descuentoGeneral;
      const total = subtotal - descuentoTotal;
      const iva = formData.requiere_factura ? total * 0.16 : 0;
      const totalConIva = total + iva;
      
      setTotals({ 
        subtotal, 
        descuentoTotal, 
        total, 
        iva, 
        totalConIva,
        descuentoGeneralPorcentaje,
        descuentoGeneralMonto
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.cliente_ids || formData.cliente_ids.length === 0) {
      newErrors.cliente_ids = 'Debe seleccionar al menos un cliente';
    }
    
    if (!formData.vendedor_ids || formData.vendedor_ids.length === 0) {
      newErrors.vendedor_ids = 'Debe seleccionar al menos un vendedor';
    }
    
    // Filtrar productos que tienen al menos algún campo completado (no están completamente vacíos)
    const productosConDatos = productos.filter(p => {
      return p.armazon_id || p.descripcion_mica || p.precio_unitario > 0;
    });
    
    // Validar que haya al menos un producto válido entre los que tienen datos
    const productosValidos = productosConDatos.filter(p => {
      if (p.tipo_producto === 'armazon') {
        return p.armazon_id && p.cantidad > 0 && p.precio_unitario > 0;
      } else {
        return p.descripcion_mica && p.cantidad > 0 && p.precio_unitario > 0;
      }
    });
    
    if (productosConDatos.length === 0) {
      newErrors.productos = 'Debe agregar al menos un producto';
    } else if (productosValidos.length === 0) {
      newErrors.productos = 'Complete todos los campos requeridos de los productos';
    }
    
    // Validar productos individualmente (solo los que tienen al menos algún dato)
    productos.forEach((producto, index) => {
      const tieneDatos = producto.armazon_id || producto.descripcion_mica || producto.precio_unitario > 0;
      
      // Solo validar productos que tienen al menos algún campo completado
      if (tieneDatos) {
        if (producto.tipo_producto === 'armazon' && !producto.armazon_id) {
          newErrors[`producto_${index}_armazon`] = 'Seleccione un armazón';
        }
        if (producto.tipo_producto === 'mica' && !producto.descripcion_mica) {
          newErrors[`producto_${index}_mica`] = 'Ingrese descripción de la mica';
        }
        if (!producto.cantidad || producto.cantidad <= 0) {
          newErrors[`producto_${index}_cantidad`] = 'Cantidad debe ser mayor a 0';
        }
        if (!producto.precio_unitario || producto.precio_unitario <= 0) {
          newErrors[`producto_${index}_precio`] = 'Precio debe ser mayor a 0';
        }
      }
    });
    
    if (formData.requiere_factura) {
      if (!formData.rfc) {
        newErrors.rfc = 'RFC es requerido para facturación';
      }
      if (!formData.razon_social) {
        newErrors.razon_social = 'Razón social es requerida para facturación';
      }
    }
    
    if (formData.registrar_abono) {
      if (!formData.monto_abono || parseFloat(formData.monto_abono) <= 0) {
        newErrors.monto_abono = 'Monto del abono debe ser mayor a 0';
      }
      if (parseFloat(formData.monto_abono) > (formData.requiere_factura ? totals.totalConIva : totals.total)) {
        newErrors.monto_abono = 'El abono no puede ser mayor al total';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Por favor, corrija los errores en el formulario');
      return;
    }
    
    // Filtrar solo productos válidos y completos
    const productosValidos = productos.filter(p => {
      // Primero verificar que tenga al menos algún dato
      const tieneDatos = p.armazon_id || p.descripcion_mica || p.precio_unitario > 0;
      if (!tieneDatos) return false;
      
      // Luego verificar que esté completo
      if (p.tipo_producto === 'armazon') {
        return p.armazon_id && p.cantidad > 0 && p.precio_unitario > 0;
      } else {
        return p.descripcion_mica && p.cantidad > 0 && p.precio_unitario > 0;
      }
    });

    // Adaptar productos al payload esperado por el servicio
    const productosPayload = productosValidos.map(p => {
      const descuento_monto = p.tipo_producto === 'armazon'
        ? parseFloat(p.descuento_armazon_monto || 0)
        : parseFloat(p.descuento_micas_monto || 0);
      return {
        tipo_producto: p.tipo_producto,
        armazon_id: p.tipo_producto === 'armazon' ? p.armazon_id : null,
        descripcion_mica: (p.tipo_producto === 'mica' || p.tipo_producto === 'otro') ? p.descripcion_mica : null,
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario,
        descuento_monto,
        subtotal: p.subtotal,
      };
    });

    const salesData = {
      ...formData,
      // Mapear a los nombres esperados por el servicio/BD
      descuento_monto: parseFloat(formData.descuento_general_monto || 0),
      monto_compra: formData.monto_total_compra ? parseFloat(formData.monto_total_compra) : undefined,
      productos: productosPayload,
      subtotal: totals.subtotal,
      total: totals.total,
      monto_iva: totals.iva
    };
    
    await onSave(salesData);
  };

  // Opciones para los selects
  const productOptions = inventory.map(p => ({ 
    value: p.id, 
    // Mostrar solo SKU - Color
    label: `${p.sku || 'Sin SKU'} - ${p.color || 'Sin color'}`,
    // Campos extra para mejorar búsqueda
    description: p.marcas?.nombre || '',
    keywords: [p.marcas?.nombre, p.sku, p.descripciones?.nombre, p.color].filter(Boolean),
    meta: { marca: p.marcas?.nombre, sku: p.sku, modelo: p.descripciones?.nombre, color: p.color }
  }));

  const stateOptions = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'completada', label: 'Completada' },
    { value: 'cancelada', label: 'Cancelada' }
  ];

  const paymentOptions = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'transferencia', label: 'Transferencia' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        {/* Header mejorado */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {sale ? 'Editar Nota de Venta' : 'Nueva Nota de Venta'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {sale ? 'Modifica los datos de la venta existente' : 'Completa la información para crear una nueva venta'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Sección 1: Información Principal */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Información Principal</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Clientes *
                  </label>
                  <Select
                    multiple
                    options={customers}
                    value={formData.cliente_ids}
                    onChange={(value) => handleInputChange('cliente_ids', value)}
                    searchable
                    placeholder="Seleccionar clientes..."
                    className="w-full"
                  />
                  {errors.cliente_ids && (
                    <p className="text-xs text-red-600 mt-1 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.cliente_ids}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Vendedores *
                  </label>
                  <Select
                    multiple
                    options={vendedores}
                    value={formData.vendedor_ids}
                    onChange={(value) => handleInputChange('vendedor_ids', value)}
                    placeholder="Seleccionar vendedores..."
                    className="w-full"
                  />
                  {errors.vendedor_ids && (
                    <p className="text-xs text-red-600 mt-1 flex items-center">
                      <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                      {errors.vendedor_ids}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sección 2: Productos */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 font-semibold text-sm">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Productos</h3>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addProducto}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                >
                  <Plus size={16} />
                  Agregar Producto
                </Button>
              </div>
              
              {errors.productos && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700 flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    {errors.productos}
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                {productos.map((producto, index) => (
                  <div key={producto.id} className="border border-gray-200 rounded-lg p-5 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-medium text-xs">{index + 1}</span>
                        </div>
                        <h4 className="font-semibold text-gray-800">Producto {index + 1}</h4>
                      </div>
                      {productos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProducto(producto.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tipo *
                        </label>
                          <Select
                          options={[
                            { value: 'armazon', label: 'Armazón' },
                            { value: 'mica', label: 'Mica' },
                            { value: 'otro', label: 'Otro' }
                          ]}
                          value={producto.tipo_producto}
                          onChange={(value) => updateProducto(producto.id, 'tipo_producto', value)}
                          placeholder="Seleccionar tipo..."
                          />
                      </div>
                      
                      {producto.tipo_producto === 'armazon' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Armazón *
                          </label>
                          <Select
                            options={productOptions}
                            value={producto.armazon_id}
                            onChange={(value) => updateProducto(producto.id, 'armazon_id', value)}
                            searchable
                            placeholder="Seleccionar armazón..."
                          />
                          {errors[`producto_${index}_armazon`] && (
                            <p className="text-xs text-red-600 mt-1">{errors[`producto_${index}_armazon`]}</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {producto.tipo_producto === 'mica' ? 'Descripción Mica *' : 'Descripción *'}
                          </label>
                          <Input
                            type="text"
                            value={producto.descripcion_mica}
                            onChange={(e) => updateProducto(producto.id, 'descripcion_mica', e.target.value)}
                            placeholder={producto.tipo_producto === 'mica' ? 'Descripción de la mica...' : 'Descripción del accesorio...'}
                          />
                          {errors[`producto_${index}_mica`] && (
                            <p className="text-xs text-red-600 mt-1">{errors[`producto_${index}_mica`]}</p>
                          )}
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad *
                        </label>
                        <Input
                          type="number"
                          value={producto.cantidad}
                          onChange={(e) => updateProducto(producto.id, 'cantidad', e.target.value)}
                          min="1"
                          step="1"
                        />
                        {errors[`producto_${index}_cantidad`] && (
                          <p className="text-xs text-red-600 mt-1">{errors[`producto_${index}_cantidad`]}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Precio Unitario *
                        </label>
                        <Input
                          type="number"
                          value={producto.precio_unitario}
                          onChange={(e) => updateProducto(producto.id, 'precio_unitario', e.target.value)}
                          min="0"
                          step="0.01"
                        />
                        {errors[`producto_${index}_precio`] && (
                          <p className="text-xs text-red-600 mt-1">{errors[`producto_${index}_precio`]}</p>
                        )}
                      </div>
                      
                      {/* Descuentos específicos por tipo de producto */}
                      {producto.tipo_producto === 'armazon' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Desc. Armazón (%)
                            </label>
                            <Input
                              type="number"
                              value={producto.descuento_armazon_porcentaje}
                              onChange={(e) => updateProducto(producto.id, 'descuento_armazon_porcentaje', e.target.value)}
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="0"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Desc. Armazón ($)
                            </label>
                            <Input
                              type="number"
                              value={producto.descuento_armazon_monto}
                              onChange={(e) => updateProducto(producto.id, 'descuento_armazon_monto', e.target.value)}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                            />
                          </div>
                        </>
                      )}

                      {producto.tipo_producto === 'mica' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Desc. Micas (%)
                            </label>
                            <Input
                              type="number"
                              value={producto.descuento_micas_porcentaje}
                              onChange={(e) => updateProducto(producto.id, 'descuento_micas_porcentaje', e.target.value)}
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="0"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Desc. Micas ($)
                            </label>
                            <Input
                              type="number"
                              value={producto.descuento_micas_monto}
                              onChange={(e) => updateProducto(producto.id, 'descuento_micas_monto', e.target.value)}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                            />
                          </div>
                        </>
                      )}
                      {producto.tipo_producto === 'otro' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Desc. Otros (%)
                            </label>
                            <Input
                              type="number"
                              value={producto.descuento_micas_porcentaje}
                              onChange={(e) => updateProducto(producto.id, 'descuento_micas_porcentaje', e.target.value)}
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="0"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Desc. Otros ($)
                            </label>
                            <Input
                              type="number"
                              value={producto.descuento_micas_monto}
                              onChange={(e) => updateProducto(producto.id, 'descuento_micas_monto', e.target.value)}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                            />
                          </div>
                        </>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subtotal
                        </label>
                        <div className="px-3 py-2 bg-gray-100 border rounded-md text-sm font-medium">
                          {formatCurrency(producto.subtotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección 3: Configuración de Precios */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-semibold text-sm">3</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Configuración de Precios</h3>
              </div>
              
              <div className="space-y-6">
                {/* Monto Total de la Compra */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-3">Monto Total de la Compra</h4>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Ingrese el monto total
                    </label>
                    <Input
                      type="number"
                      value={formData.monto_total_compra}
                      onChange={(e) => handleInputChange('monto_total_compra', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="bg-white"
                    />
                    <p className="text-xs text-blue-600">
                      Si ingresa este monto, se usará como total de la compra
                    </p>
                  </div>
                </div>

                {/* Descuento General */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-3">Descuento General (Opcional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Desc. General (%)
                      </label>
                      <Input
                        type="number"
                        value={formData.descuento_general_porcentaje}
                        onChange={(e) => handleInputChange('descuento_general_porcentaje', e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0"
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Desc. General ($)
                      </label>
                      <Input
                        type="number"
                        value={formData.descuento_general_monto}
                        onChange={(e) => handleInputChange('descuento_general_monto', e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 4: Información Adicional */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-indigo-600 font-semibold text-sm">4</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Información Adicional</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Estado
                    </label>
                    <Select
                      options={stateOptions}
                      value={formData.estado}
                      onChange={(value) => handleInputChange('estado', value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {sale ? 'Folio (últimos 4 dígitos)' : 'Folio Manual (últimos 4 dígitos)'}
                    </label>
                    <Input
                      type="text"
                      value={formData.folio_manual}
                      onChange={(e) => handleInputChange('folio_manual', e.target.value)}
                      placeholder="Dejar vacío para folio automático"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => handleInputChange('observaciones', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>
            </div>

            {/* Sección 5: Facturación */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-yellow-600 font-semibold text-sm">5</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Facturación</h3>
              </div>

              <div className="mb-4">
                <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Checkbox
                    id="requiere_factura"
                    checked={formData.requiere_factura}
                    onChange={(e) => handleInputChange('requiere_factura', e.target.checked)}
                    className="mr-3"
                  />
                  <label htmlFor="requiere_factura" className="text-sm font-medium text-yellow-800 cursor-pointer">
                    Requiere Factura
                  </label>
                </div>
              </div>

              {formData.requiere_factura && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RFC *
                    </label>
                    <Input
                      type="text"
                      value={formData.rfc}
                      onChange={(e) => handleInputChange('rfc', e.target.value)}
                      placeholder="RFC del cliente"
                      className="border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                    {errors.rfc && (
                      <p className="text-xs text-red-600 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.rfc}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Razón Social *
                    </label>
                    <Input
                      type="text"
                      value={formData.razon_social}
                      onChange={(e) => handleInputChange('razon_social', e.target.value)}
                      placeholder="Razón social del cliente"
                      className="border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                    {errors.razon_social && (
                      <p className="text-xs text-red-600 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.razon_social}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Abono Inicial */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-semibold mr-3">
                  6
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Abono Inicial</h3>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Checkbox
                    id="registrar_abono"
                    checked={formData.registrar_abono}
                    onChange={(e) => handleInputChange('registrar_abono', e.target.checked)}
                    className="mr-3"
                  />
                  <label htmlFor="registrar_abono" className="text-sm font-medium text-green-800 cursor-pointer">
                    Registrar Abono Inicial
                  </label>
                </div>
              </div>
              
              {formData.registrar_abono && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto del Abono *
                    </label>
                    <Input
                      type="number"
                      value={formData.monto_abono}
                      onChange={(e) => handleInputChange('monto_abono', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                    />
                    {errors.monto_abono && (
                      <p className="text-xs text-red-600 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.monto_abono}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Forma de Pago
                    </label>
                    <Select
                      options={paymentOptions}
                      value={formData.forma_pago_abono}
                      onChange={(value) => handleInputChange('forma_pago_abono', value)}
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones del Abono
                    </label>
                    <Input
                      type="text"
                      value={formData.observaciones_abono}
                      onChange={(e) => handleInputChange('observaciones_abono', e.target.value)}
                      placeholder="Observaciones..."
                      className="border-green-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Resumen de Totales */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full mr-3">
                  <Calculator className="h-5 w-5" />
                </div>
                <h4 className="text-xl font-bold text-gray-800">Resumen de la Venta</h4>
              </div>
              
              {/* Información General */}
              <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Información General
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Cliente:</span>
                    <span className="ml-2 font-medium text-gray-800">
                      {formData.cliente_ids && formData.cliente_ids.length > 0 
                        ? formData.cliente_ids.map(id => 
                            customers.find(c => c.value === id)?.label
                          ).filter(Boolean).join(', ') 
                        : 'No seleccionado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Vendedor(es):</span>
                    <span className="ml-2 font-medium text-gray-800">
                      {formData.vendedor_ids && formData.vendedor_ids.length > 0 
                        ? formData.vendedor_ids.map(id => 
                            vendedores.find(v => v.value === id)?.label
                          ).filter(Boolean).join(', ') 
                        : 'No seleccionado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Estado:</span>
                    <span className="ml-2 font-medium text-gray-800">{formData.estado || 'Pendiente'}</span>
                  </div>
                  {formData.folio_manual && (
                    <div>
                      <span className="text-gray-600">Folio Manual:</span>
                      <span className="ml-2 font-medium text-gray-800">{formData.folio_manual}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalle de Productos */}
              {productos && productos.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                  <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Productos ({productos.length})
                  </h5>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {productos.map((producto, index) => (
                      <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            {(() => {
                              if (producto.tipo_producto === 'armazon' && producto.armazon_id) {
                                const armazon = inventory.find(i => i.id === producto.armazon_id);
                                if (armazon) {
                                  const marca = armazon.marcas?.nombre || 'Sin marca';
                                  const descripcion = armazon.descripciones?.nombre || armazon.sku || 'Sin descripción';
                                  const color = armazon.color || 'Sin color';
                                  return `${marca} - ${descripcion} (${color})`;
                                }
                                return 'Armazón - Sin información';
                              } else if (producto.tipo_producto === 'mica') {
                                return `Mica - ${producto.descripcion_mica || 'Sin descripción'}`;
                              } else if (producto.tipo_producto === 'otro') {
                                return `Otro - ${producto.descripcion_mica || 'Sin descripción'}`;
                              }
                              return producto.tipo_producto || 'Producto';
                            })()}
                          </div>
                          <div className="text-gray-600 text-xs">
                            Cant: {producto.cantidad} | 
                            Precio Unit: {formatCurrency(producto.precio_unitario)} |
                            {producto.descuento_armazon_porcentaje > 0 && ` Desc Armazón: ${producto.descuento_armazon_porcentaje}% |`}
                            {producto.descuento_armazon_monto > 0 && ` Desc Armazón: ${formatCurrency(producto.descuento_armazon_monto)} |`}
                            {producto.descuento_micas_porcentaje > 0 && ` Desc Micas: ${producto.descuento_micas_porcentaje}% |`}
                            {producto.descuento_micas_monto > 0 && ` Desc Micas: ${formatCurrency(producto.descuento_micas_monto)} |`}
                          </div>
                        </div>
                        <div className="font-semibold text-gray-800">
                          {formatCurrency(producto.subtotal)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Totales Financieros */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">
                      {formData.monto_total_compra && parseFloat(formData.monto_total_compra) > 0 ? 'Monto Base:' : 'Subtotal:'}
                    </span>
                    <span className="font-semibold text-gray-800">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  
                  {/* Mostrar desglose de descuentos generales cuando se usa monto total de compra */}
                  {formData.monto_total_compra && parseFloat(formData.monto_total_compra) > 0 && totals.descuentoTotal > 0 && (
                    <div className="space-y-2 text-xs bg-red-50 p-3 rounded-lg border border-red-200">
                      <div className="font-medium text-red-700 mb-2">Descuentos Aplicados:</div>
                      {totals.descuentoGeneralPorcentaje > 0 && (
                        <div className="flex justify-between text-red-600 pl-2">
                          <span>• Desc. General ({formData.descuento_general_porcentaje}%):</span>
                          <span className="font-medium">-{formatCurrency(totals.descuentoGeneralPorcentaje)}</span>
                        </div>
                      )}
                      {totals.descuentoGeneralMonto > 0 && (
                        <div className="flex justify-between text-red-600 pl-2">
                          <span>• Desc. General ($):</span>
                          <span className="font-medium">-{formatCurrency(totals.descuentoGeneralMonto)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {totals.descuentoTotal > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-red-600 font-medium">Total Descuentos:</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(totals.descuentoTotal)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 bg-gray-50 px-3 rounded-lg">
                    <span className="font-bold text-gray-800 text-base">Total:</span>
                    <span className="font-bold text-xl text-gray-900">{formatCurrency(totals.total)}</span>
                  </div>
                  
                  {formData.requiere_factura && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-blue-700 font-medium">IVA (16%):</span>
                        <span className="font-semibold text-blue-700">{formatCurrency(totals.iva)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-t border-blue-300 mt-2 pt-2">
                        <span className="font-bold text-blue-800 text-base">Total con IVA:</span>
                        <span className="font-bold text-xl text-blue-900">{formatCurrency(totals.totalConIva)}</span>
                      </div>
                    </div>
                  )}
                  
                  {formData.registrar_abono && formData.monto_abono && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200 mt-3">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-green-700 font-medium">Abono inicial:</span>
                        <span className="font-semibold text-green-700">{formatCurrency(parseFloat(formData.monto_abono))}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-t border-green-300 mt-2 pt-2">
                        <span className="font-bold text-orange-700 text-base">Saldo pendiente:</span>
                        <span className="font-bold text-lg text-orange-800">
                          {formatCurrency((formData.requiere_factura ? totals.totalConIva : totals.total) - parseFloat(formData.monto_abono || 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-6 border-t bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="text-sm text-gray-600">
              {sale ? 'Actualizando venta existente' : 'Creando nueva venta'}
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={onClose}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors duration-200"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </div>
                ) : (
                  sale ? 'Actualizar Venta' : 'Crear Venta'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSalesModal;
