import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Percent } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { customerService } from '../services/customerService';
import { inventoryService } from '../services/inventoryService';
import { salesService } from '../services/salesService';
import { userService } from '../services/userService';

const NewSalesModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  sale = null, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    cliente_id: '',
    cliente_nombre: '',
    descuento_total: 0,
    descuento_porcentaje: 0,
    estado: 'pendiente',
    metodo_pago: 'efectivo',
    observaciones: '',
    vendedor_ids: []
  });

  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [errors, setErrors] = useState({});
  const [totals, setTotals] = useState({ subtotal: 0, total: 0 });

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
        // Modo edición
        setFormData({
          cliente_id: sale.cliente_id || '',
          cliente_nombre: sale.cliente_nombre || '',
          descuento_total: sale.descuento_total || 0,
          descuento_porcentaje: sale.descuento_porcentaje || 0,
          estado: sale.estado || 'pendiente',
          metodo_pago: sale.metodo_pago || 'efectivo',
          observaciones: sale.observaciones || '',
          vendedor_id: sale.vendedor_id || ''
        });
        
        // Mapear items de la venta
        const mappedItems = (sale.items || []).map(item => ({
          id: item.id || Date.now() + Math.random(),
          categoria_id: item.categoria_id || '',
          categoria_nombre: item.categoria || '',
          descripcion: item.descripcion || '',
          cantidad: item.cantidad || 1,
          precio_unitario: item.precio_unitario || 0,
          descuento_monto: item.descuento_monto || 0,
          descuento_porcentaje: item.descuento_porcentaje || 0,
          armazon_id: item.armazon_id || null
        }));
        
        setItems(mappedItems);
      } else {
        // Modo creación
        resetForm();
      }
    }
  }, [isOpen, sale]);

  useEffect(() => {
    calculateTotals();
  }, [items, formData.descuento_total, formData.descuento_porcentaje]);

  const loadInitialData = async () => {
    await Promise.all([
      loadCustomers(),
      loadInventory(),
      loadCategories(),
      loadVendedores()
    ]);
  };

  const loadCustomers = async () => {
    const { data } = await customerService.getCustomers();
    if (data) {
      setCustomers(data.map(customer => ({
        value: customer.id,
        label: `${customer.nombre} - ${customer.telefono || 'Sin teléfono'}`
      })));
    }
  };
  const loadVendedores = async () => {
    const { data } = await userService.getUsers();
    if (data) {
      setVendedores(data.map(v => ({
        value: v.id,
        label: `${v.nombre} ${v.apellido || ''}`.trim()
      })));
    }
  };

  const loadInventory = async () => {
    const { data } = await inventoryService.getProducts();
    console.log('Inventory data loaded:', data); // Debug log
    console.log('First frame data structure:', data?.[0]); // Debug specific frame
    if (data) setInventory(data);
  };

  const loadCategories = async () => {
    // Usando inventoryService para obtener categorías desde la tabla armazones
    const { data } = await inventoryService.getProducts();
    if (data) {
      // Extraer categorías únicas de los productos
      const uniqueCategories = [...new Set(data.map(product => product.categoria))].filter(Boolean);
      setCategories(uniqueCategories.map(cat => ({
        value: cat,
        label: cat.charAt(0).toUpperCase() + cat.slice(1)
      })));
    }
  };

  const resetForm = () => {
    setFormData({
      cliente_id: '',
      cliente_nombre: '',
      descuento_total: 0,
      descuento_porcentaje: 0,
      estado: 'pendiente',
      metodo_pago: 'efectivo',
      observaciones: '',
      vendedor_ids: []
    });
    setItems([]);
    setErrors({});
    setTotals({ subtotal: 0, total: 0 });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      categoria_id: '',
      categoria_nombre: '',
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      descuento_monto: 0,
      descuento_porcentaje: 0,
      armazon_id: null
    };
    
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      
      // Si cambia la categoría, actualizar el nombre
      if (field === 'categoria_id') {
        const category = categories.find(cat => cat.value === value);
        updated[index].categoria_nombre = category?.label || '';
        
        // Resetear campos relacionados
        if (value !== categories.find(cat => cat.label.toLowerCase() === 'armazón')?.value) {
          updated[index].armazon_id = null;
        }
      }
      
      // Si selecciona un armazón específico
        if (field === 'armazon_id' && value) {
          const frame = inventory.find(item => item.id === value);
          if (frame) {
            const marca = frame.marcas?.nombre || 'Sin marca';
            const sku = frame.sku || 'Sin SKU';
            const color = frame.color || 'Sin color';
            updated[index].descripcion = `${marca}(${sku})-${color}`;
            updated[index].precio_unitario = frame.precio || 0;
          }
        }
      
      return updated;
    });
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const calculatedTotals = salesService.calculateSaleTotals(items);
    setTotals(calculatedTotals);
  };

  // REEMPLAZA TODA TU FUNCIÓN validateForm CON ESTA:
  const validateForm = () => {
    const newErrors = {};
    
    // 1. Validar Cliente
    if (!formData.cliente_id) {
      newErrors.cliente_id = 'Debe seleccionar un cliente';
    }

    // 2. Validar Vendedor
    if (!formData.vendedor_ids || formData.vendedor_ids.length === 0) {
      newErrors.vendedor_ids = 'Debe seleccionar quién atendió la venta';
    }
    
    // 3. Validar Items
    if (items.length === 0) {
      newErrors.items = 'Debe agregar al menos un producto';
    } else {
      items.forEach((item, index) => {
        if (!item.categoria_id) {
          newErrors[`item_${index}_categoria`] = 'Seleccione una categoría';
        }
        if (!item.descripcion.trim()) {
          newErrors[`item_${index}_descripcion`] = 'Ingrese una descripción';
        }
        if (item.cantidad <= 0) {
          newErrors[`item_${index}_cantidad`] = 'La cantidad debe ser mayor a 0';
        }
        if (item.precio_unitario <= 0) {
          newErrors[`item_${index}_precio`] = 'El precio debe ser mayor a 0';
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const saleData = {
      ...formData,
      items: items.map(item => ({
        categoria_id: item.categoria_id,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        descuento_monto: item.descuento_monto,
        descuento_porcentaje: item.descuento_porcentaje,
        armazon_id: item.armazon_id
      }))
    };
    
    await onSave(saleData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {sale ? 'Editar' : 'Nueva'} Venta
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Información del cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <Select
                  name="cliente_id"
                  value={formData.cliente_id}
                  onChange={handleInputChange}
                  options={customers}
                  placeholder="Seleccionar cliente"
                  error={errors.cliente_id}
                />
              </div>
              <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Atendido por *
    </label>
    <select
      multiple // Esto permite seleccionar varios vendedores con Ctrl+Click
      name="vendedor_ids"
      value={formData.vendedor_ids}
      onChange={(e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({ ...prev, vendedor_ids: selectedOptions }));
        if (errors.vendedor_ids) setErrors(prev => ({ ...prev, vendedor_ids: '' }));
      }}
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${errors.vendedor_ids ? 'border-red-500 ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
    >
      {vendedores.map(vendedor => (
        <option key={vendedor.value} value={vendedor.value}>
          {vendedor.label}
        </option>
      ))}
    </select>
    {errors.vendedor_ids && (
      <p className="text-red-600 text-sm mt-1">{errors.vendedor_ids}</p>
    )}
    </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <Select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  options={[
                    { value: 'pendiente', label: 'Pendiente' },
                    { value: 'completada', label: 'Completada' }
                  ]}
                />
              </div>
            </div>

            {/* Items de venta */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Productos</h3>
                <Button
                  type="button"
                  onClick={addItem}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar Producto</span>
                </Button>
              </div>

              {errors.items && (
                <p className="text-red-600 text-sm mb-4">{errors.items}</p>
              )}

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Categoría *
                        </label>
                        <Select
                          value={item.categoria_id}
                          onChange={(e) => updateItem(index, 'categoria_id', e.target.value)}
                          options={categories}
                          placeholder="Seleccionar"
                          error={errors[`item_${index}_categoria`]}
                        />
                      </div>

                      {item.categoria_nombre?.toLowerCase() === 'armazón' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Armazón
                          </label>
                          <select
                            value={item.armazon_id || ''}
                            onChange={(e) => updateItem(index, 'armazon_id', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            style={{ minWidth: '300px', maxWidth: 'none', whiteSpace: 'nowrap', overflow: 'visible' }}
                          >
                            <option value="">Seleccionar armazón</option>
                            <option value="test">PRUEBA - TEST123 - ROJO</option>
                            {inventory.map(frame => {
                              console.log('Frame data:', frame); // Debug each frame
                              const marca = frame.marcas?.nombre || 'Sin marca';
                              const sku = frame.sku || 'Sin SKU';
                              const color = frame.color || 'Sin color';
                              
                              // Formato: marca(sku)-color (sin modelo porque no existe en la BD)
                              const displayText = `${marca}(${sku})-${color}`;
                              
                              console.log(`Renderizando opción: "${displayText}" para frame:`, frame);
                              
                              return (
                                <option 
                                  key={frame.id} 
                                  value={frame.id}
                                  style={{ whiteSpace: 'nowrap' }}
                                >
                                  {displayText}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}

                      <div className={item.categoria_nombre?.toLowerCase() === 'armazón' ? 'md:col-span-2' : 'md:col-span-3'}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descripción *
                        </label>
                        <Input
                          value={item.descripcion}
                          onChange={(e) => updateItem(index, 'descripcion', e.target.value)}
                          placeholder="Descripción del producto"
                          error={errors[`item_${index}_descripcion`]}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad *
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => updateItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                          error={errors[`item_${index}_cantidad`]}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Precio Unit. *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precio_unitario}
                            onChange={(e) => updateItem(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                            className="pl-8"
                            error={errors[`item_${index}_precio`]}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Descuentos por item */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descuento $
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.descuento_monto}
                            onChange={(e) => updateItem(index, 'descuento_monto', parseFloat(e.target.value) || 0)}
                            className="pl-8"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descuento %
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={item.descuento_porcentaje}
                            onChange={(e) => updateItem(index, 'descuento_porcentaje', parseFloat(e.target.value) || 0)}
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            <Percent className="h-4 w-4" />
                          </span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(
                              (item.cantidad * item.precio_unitario) - 
                              (item.descuento_porcentaje > 0 
                                ? (item.cantidad * item.precio_unitario) * (item.descuento_porcentaje / 100)
                                : item.descuento_monto)
                            )}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Descuentos generales y totales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descuento General ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <Input
                      type="number"
                      name="descuento_total"
                      min="0"
                      step="0.01"
                      value={formData.descuento_total}
                      onChange={handleInputChange}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descuento General (%)
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      name="descuento_porcentaje"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.descuento_porcentaje}
                      onChange={handleInputChange}
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                      <Percent className="h-4 w-4" />
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Observaciones adicionales..."
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg border">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  
                  {(formData.descuento_total > 0 || formData.descuento_porcentaje > 0) && (
                    <div className="flex justify-between text-red-600">
                      <span>Descuento General:</span>
                      <span>
                        {formData.descuento_porcentaje > 0 
                          ? `-${formData.descuento_porcentaje}%`
                          : formatCurrency(formData.descuento_total)
                        }
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(totals.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (sale ? 'Actualizar' : 'Crear')} Venta
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewSalesModal;