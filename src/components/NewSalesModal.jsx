import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calculator } from 'lucide-react';
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
        setFormData({
          cliente_ids: sale.clientes ? sale.clientes.map(c => c.id) : [],
          vendedor_ids: sale.vendedores ? sale.vendedores.map(v => v.id) : [],
          estado: sale.estado || 'pendiente',
          observaciones: sale.observaciones || '',
          requiere_factura: sale.requiere_factura || false,
          rfc: sale.rfc || '',
          razon_social: sale.razon_social || '',
          folio_manual: '',
          registrar_abono: false,
          monto_abono: '',
          forma_pago_abono: 'efectivo',
          observaciones_abono: ''
        });
        
        // Cargar productos de la venta (esto se implementará cuando tengamos la nueva estructura)
        // Por ahora, mantener la estructura actual
        const productosVenta = [];
        if (sale.armazon_id) {
          productosVenta.push({
            id: Date.now(),
            tipo_producto: 'armazon',
            armazon_id: sale.armazon_id,
            descripcion_mica: '',
            cantidad: 1,
            precio_unitario: sale.precio_armazon || 0,
            descuento_monto: sale.descuento_armazon_monto || 0,
            subtotal: (sale.precio_armazon || 0) - (sale.descuento_armazon_monto || 0)
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
            descuento_monto: sale.descuento_micas_monto || 0,
            subtotal: (sale.precio_micas || 0) - (sale.descuento_micas_monto || 0)
          });
        }
        
        if (productosVenta.length > 0) {
          setProductos(productosVenta);
        }
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
        setInventory(data.filter(p => p.stock > 0));
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

    const salesData = {
      ...formData,
      productos: productosValidos,
      subtotal: totals.subtotal,
      total: totals.total,
      monto_iva: totals.iva
    };
    
    await onSave(salesData);
  };

  // Opciones para los selects
  const productOptions = inventory.map(p => ({ 
    value: p.id, 
    label: `${p.marcas?.nombre || 'N/A'} - ${p.sku || 'Sin SKU'} - ${p.color || 'Sin color'} (Stock: ${p.stock})`
  }));

  const stateOptions = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'completada', label: 'Completada' }
  ];

  const paymentOptions = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'transferencia', label: 'Transferencia' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {sale ? 'Editar Nota de Venta' : 'Nueva Nota de Venta'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Información del Cliente y Vendedor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clientes *
                </label>
                <Select
                  multiple
                  options={customers}
                  value={formData.cliente_ids}
                  onChange={(value) => handleInputChange('cliente_ids', value)}
                  placeholder="Seleccionar clientes..."
                />
                {errors.cliente_ids && (
                  <p className="text-xs text-red-600 mt-1">{errors.cliente_ids}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendedores *
                </label>
                <Select
                  multiple
                  options={vendedores}
                  value={formData.vendedor_ids}
                  onChange={(value) => handleInputChange('vendedor_ids', value)}
                  placeholder="Seleccionar vendedores..."
                />
                {errors.vendedor_ids && (
                  <p className="text-xs text-red-600 mt-1">{errors.vendedor_ids}</p>
                )}
              </div>
            </div>

            {/* Productos */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium text-gray-800">Productos</h3>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addProducto}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Agregar Producto
                </Button>
              </div>
              
              {errors.productos && (
                <p className="text-xs text-red-600 mb-4">{errors.productos}</p>
              )}
              
              <div className="space-y-4">
                {productos.map((producto, index) => (
                  <div key={producto.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-700">Producto {index + 1}</h4>
                      {productos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProducto(producto.id)}
                          className="text-red-500 hover:text-red-700"
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
                            { value: 'mica', label: 'Mica' }
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
                            placeholder="Seleccionar armazón..."
                          />
                          {errors[`producto_${index}_armazon`] && (
                            <p className="text-xs text-red-600 mt-1">{errors[`producto_${index}_armazon`]}</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción Mica *
                          </label>
                          <Input
                            type="text"
                            value={producto.descripcion_mica}
                            onChange={(e) => updateProducto(producto.id, 'descripcion_mica', e.target.value)}
                            placeholder="Descripción de la mica..."
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

            {/* Monto Total de la Compra */}
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">Monto Total de la Compra</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ingrese el monto total
                </label>
                <Input
                  type="number"
                  value={formData.monto_total_compra}
                  onChange={(e) => handleInputChange('monto_total_compra', e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si ingresa este monto, se usará como total de la compra
                </p>
              </div>
            </div>

            {/* Descuento General (Opcional) */}
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">Descuento General (Opcional)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Desc. General ($)
                  </label>
                  <Input
                    type="number"
                    value={formData.descuento_general_monto}
                    onChange={(e) => handleInputChange('descuento_general_monto', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <Select
                  options={stateOptions}
                  value={formData.estado}
                  onChange={(value) => handleInputChange('estado', value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Folio Manual (Opcional)
                </label>
                <Input
                  type="text"
                  value={formData.folio_manual}
                  onChange={(e) => handleInputChange('folio_manual', e.target.value)}
                  placeholder="Dejar vacío para folio automático"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Observaciones adicionales..."
              />
            </div>

            {/* Facturación */}
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">Facturación</h3>
              <div className="mb-4">
                <Checkbox
                  id="requiere_factura"
                  checked={formData.requiere_factura}
                  onChange={(e) => handleInputChange('requiere_factura', e.target.checked)}
                  label="Requiere Factura"
                />
              </div>
              
              {formData.requiere_factura && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RFC *
                    </label>
                    <Input
                      type="text"
                      value={formData.rfc}
                      onChange={(e) => handleInputChange('rfc', e.target.value)}
                      placeholder="RFC del cliente"
                    />
                    {errors.rfc && (
                      <p className="text-xs text-red-600 mt-1">{errors.rfc}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Razón Social *
                    </label>
                    <Input
                      type="text"
                      value={formData.razon_social}
                      onChange={(e) => handleInputChange('razon_social', e.target.value)}
                      placeholder="Razón social del cliente"
                    />
                    {errors.razon_social && (
                      <p className="text-xs text-red-600 mt-1">{errors.razon_social}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Abono Inicial */}
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">Abono Inicial</h3>
              <div className="mb-4">
                <Checkbox
                  id="registrar_abono"
                  checked={formData.registrar_abono}
                  onChange={(e) => handleInputChange('registrar_abono', e.target.checked)}
                  label="Registrar Abono Inicial"
                />
              </div>
              
              {formData.registrar_abono && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monto del Abono *
                    </label>
                    <Input
                      type="number"
                      value={formData.monto_abono}
                      onChange={(e) => handleInputChange('monto_abono', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    {errors.monto_abono && (
                      <p className="text-xs text-red-600 mt-1">{errors.monto_abono}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Forma de Pago
                    </label>
                    <Select
                      options={paymentOptions}
                      value={formData.forma_pago_abono}
                      onChange={(value) => handleInputChange('forma_pago_abono', value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observaciones del Abono
                    </label>
                    <Input
                      type="text"
                      value={formData.observaciones_abono}
                      onChange={(e) => handleInputChange('observaciones_abono', e.target.value)}
                      placeholder="Observaciones..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Resumen de Totales */}
            <div className="border-t pt-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Calculator className="h-5 w-5 text-gray-600 mr-2" />
                  <h4 className="text-lg font-semibold text-gray-800">Resumen de Totales</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {formData.monto_total_compra && parseFloat(formData.monto_total_compra) > 0 ? 'Monto Base:' : 'Subtotal:'}
                    </span>
                    <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  
                  {/* Mostrar desglose de descuentos generales cuando se usa monto total de compra */}
                  {formData.monto_total_compra && parseFloat(formData.monto_total_compra) > 0 && totals.descuentoTotal > 0 && (
                    <div className="space-y-1 text-xs">
                      {totals.descuentoGeneralPorcentaje > 0 && (
                        <div className="flex justify-between text-red-500 pl-4">
                          <span>• Desc. General ({formData.descuento_general_porcentaje}%):</span>
                          <span>-{formatCurrency(totals.descuentoGeneralPorcentaje)}</span>
                        </div>
                      )}
                      {totals.descuentoGeneralMonto > 0 && (
                        <div className="flex justify-between text-red-500 pl-4">
                          <span>• Desc. General ($):</span>
                          <span>-{formatCurrency(totals.descuentoGeneralMonto)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {totals.descuentoTotal > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Total Descuentos:</span>
                      <span className="font-medium">-{formatCurrency(totals.descuentoTotal)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold text-lg">{formatCurrency(totals.total)}</span>
                  </div>
                  {formData.requiere_factura && (
                    <>
                      <div className="flex justify-between text-blue-600">
                        <span>IVA (16%):</span>
                        <span className="font-medium">{formatCurrency(totals.iva)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 text-blue-800">
                        <span className="font-bold">Total con IVA:</span>
                        <span className="font-bold text-lg">{formatCurrency(totals.totalConIva)}</span>
                      </div>
                    </>
                  )}
                  {formData.registrar_abono && formData.monto_abono && (
                    <div className="border-t pt-2 space-y-1">
                      <div className="flex justify-between text-green-600">
                        <span>Abono inicial:</span>
                        <span className="font-medium">{formatCurrency(parseFloat(formData.monto_abono))}</span>
                      </div>
                      <div className="flex justify-between text-orange-600">
                        <span className="font-medium">Saldo pendiente:</span>
                        <span className="font-bold">
                          {formatCurrency((formData.requiere_factura ? totals.totalConIva : totals.total) - parseFloat(formData.monto_abono || 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end p-4 border-t bg-gray-50">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="ml-2">
              {loading ? 'Guardando...' : (sale ? 'Actualizar' : 'Crear')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSalesModal;