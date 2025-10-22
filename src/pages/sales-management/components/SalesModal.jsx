import React, { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/SelectSimple';
import { Checkbox } from '../../../components/ui/Checkbox';
import { customerService } from '../../../services/customerService';
import { inventoryService } from '../../../services/inventoryService';
import { userService } from '../../../services/userService';

const SalesModal = ({ isOpen, onClose, onSave, sale = null, loading = false }) => {
  const getInitialFormData = () => ({
    cliente_id: '',
    armazon_id: '',
    descripcion_micas: '',
    precio_armazon: 0,
    precio_micas: '', // Cambiado a cadena vacía para que el usuario pueda borrar
    descuento_armazon_porcentaje: '',
    descuento_armazon_monto: '',
    descuento_micas_porcentaje: '',
    descuento_micas_monto: '',
    descuento_porcentaje: '',
    descuento_monto: '',
    estado: 'pendiente',
    observaciones: '',
    vendedor_ids: [],
    requiere_factura: false,
    rfc: '',
    razon_social: '',
    folio_manual: '', // Nuevo campo para folio manual
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [calculatedTotals, setCalculatedTotals] = useState({ subtotal: 0, totalDiscount: 0, finalTotal: 0, iva: 0, totalConIva: 0 });
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    // Calcular totales incluyendo IVA si requiere factura
    const armazonPrice = parseFloat(formData.precio_armazon) || 0;
    const micaPrice = parseFloat(formData.precio_micas) || 0;
    const armazonDiscountValue = parseFloat(formData.descuento_armazon_porcentaje) > 0 ? armazonPrice * (parseFloat(formData.descuento_armazon_porcentaje) / 100) : parseFloat(formData.descuento_armazon_monto) || 0;
    const micasDiscountValue = parseFloat(formData.descuento_micas_porcentaje) > 0 ? micaPrice * (parseFloat(formData.descuento_micas_porcentaje) / 100) : parseFloat(formData.descuento_micas_monto) || 0;
    const subtotalAfterProductDiscounts = (armazonPrice - armazonDiscountValue) + (micaPrice - micasDiscountValue);
    const generalDiscountValue = parseFloat(formData.descuento_porcentaje) > 0 ? subtotalAfterProductDiscounts * (parseFloat(formData.descuento_porcentaje) / 100) : parseFloat(formData.descuento_monto) || 0;
    const totalDiscount = armazonDiscountValue + micasDiscountValue + generalDiscountValue;
    const finalTotal = subtotalAfterProductDiscounts - generalDiscountValue;
    
    // Calcular IVA si requiere factura (16%)
    const iva = formData.requiere_factura ? finalTotal * 0.16 : 0;
    const totalConIva = finalTotal + iva;
    
    setCalculatedTotals({ subtotal: armazonPrice + micaPrice, totalDiscount, finalTotal, iva, totalConIva });
  }, [
    formData.precio_armazon, 
    formData.precio_micas, 
    formData.descuento_armazon_porcentaje, 
    formData.descuento_armazon_monto,
    formData.descuento_micas_porcentaje, 
    formData.descuento_micas_monto,
    formData.descuento_porcentaje, 
    formData.descuento_monto,
    formData.requiere_factura
  ]);

  useEffect(() => {
    // ... tu useEffect para cargar datos está bien ...
    if (isOpen && !isDataLoaded) {
      const loadInitialData = async () => {
        try {
          const [customersResult, productsResult, usersResult] = await Promise.all([
            customerService.getCustomers(), 
            inventoryService.getProducts(),
            userService.getUsers()
          ]);
          if (customersResult.data) setCustomers(customersResult.data);
          if (productsResult.data) setProducts(productsResult.data);
          if (usersResult.data) setUsers(usersResult.data);
          setIsDataLoaded(true);
        } catch (error) { toast.error("Error al cargar datos del modal"); }
      };
      loadInitialData();
    } else if (!isOpen) {
      setIsDataLoaded(false);
    }
  }, [isOpen, isDataLoaded]);

  useEffect(() => {
    if (isOpen && isDataLoaded) {
      if (sale) {
        // Modo edición - cargar todos los datos de la venta
        setFormData({
          cliente_id: sale.cliente?.id || '',
          armazon_id: sale.armazon?.id || '',
          descripcion_micas: sale.descripcion_micas || '',
          precio_armazon: sale.precio_armazon || 0,
          precio_micas: sale.precio_micas || '',
          descuento_armazon_porcentaje: '',
          descuento_armazon_monto: sale.descuento_armazon_monto || 0,
          descuento_micas_porcentaje: '',
          descuento_micas_monto: sale.descuento_micas_monto || 0,
          descuento_porcentaje: '',
          descuento_monto: sale.descuento_monto || 0,
          estado: sale.estado || 'pendiente',
          observaciones: sale.observaciones || '',
          vendedor_ids: sale.vendedores ? sale.vendedores.map(v => v.id) : [],
          requiere_factura: sale.requiere_factura || false,
          rfc: sale.rfc || '',
          razon_social: sale.razon_social || '',
          folio_manual: '', // No mostrar folio en edición, solo en creación
        });
      } else {
        // Modo creación - limpiar COMPLETAMENTE el formulario
        const freshData = getInitialFormData();
        setFormData(freshData);
        setErrors({});
      }
    }
  }, [isOpen, isDataLoaded, sale]);
  
  const handleChange = (name, value) => {
    // No convertir precio_micas a número aquí, permitir cadena vacía
    // Solo convertir precio_armazon porque siempre debe tener un valor
    if (name === 'precio_armazon') {
      value = value === '' ? 0 : parseFloat(value) || 0;
    }
    
    const newFormData = { ...formData, [name]: value };
    const numericValue = parseFloat(value) || 0;

    if (name === 'descuento_armazon_porcentaje') {
      newFormData.descuento_armazon_monto = ( (parseFloat(newFormData.precio_armazon) || 0) * numericValue ) / 100;
    } else if (name === 'descuento_armazon_monto') {
      newFormData.descuento_armazon_porcentaje = '';
    } else if (name === 'descuento_micas_porcentaje') {
      newFormData.descuento_micas_monto = ( (parseFloat(newFormData.precio_micas) || 0) * numericValue ) / 100;
    } else if (name === 'descuento_micas_monto') {
      newFormData.descuento_micas_porcentaje = '';
    } else if (name === 'descuento_porcentaje') {
      // Calcular el subtotal después de descuentos de productos individuales
      const armazonPrice = parseFloat(newFormData.precio_armazon) || 0;
      const micaPrice = parseFloat(newFormData.precio_micas) || 0;
      const armazonDiscountValue = parseFloat(newFormData.descuento_armazon_porcentaje) > 0 ? 
        armazonPrice * (parseFloat(newFormData.descuento_armazon_porcentaje) / 100) : 
        parseFloat(newFormData.descuento_armazon_monto) || 0;
      const micasDiscountValue = parseFloat(newFormData.descuento_micas_porcentaje) > 0 ? 
        micaPrice * (parseFloat(newFormData.descuento_micas_porcentaje) / 100) : 
        parseFloat(newFormData.descuento_micas_monto) || 0;
      const subtotalAfterProductDiscounts = (armazonPrice - armazonDiscountValue) + (micaPrice - micasDiscountValue);
      
      // Calcular el descuento general en pesos
      newFormData.descuento_monto = (subtotalAfterProductDiscounts * numericValue) / 100;
    } else if (name === 'descuento_monto') {
      newFormData.descuento_porcentaje = '';
    } else if (name === 'armazon_id') {
      const selectedProduct = products.find(p => p.id === value);
      newFormData.precio_armazon = selectedProduct ? selectedProduct.precio : 0;
    }
    setFormData(newFormData);
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.cliente_id) newErrors.cliente_id = 'Debe seleccionar un cliente.';
    if (!formData.armazon_id) newErrors.armazon_id = 'Debe seleccionar un armazón.';
    if (!formData.vendedor_ids || formData.vendedor_ids.length === 0) newErrors.vendedor_ids = 'Debe seleccionar al menos un vendedor.';
    
    // Validar campos de factura si requiere factura
    if (formData.requiere_factura) {
      if (!formData.rfc || formData.rfc.trim() === '') newErrors.rfc = 'El RFC es obligatorio para facturación.';
      if (!formData.razon_social || formData.razon_social.trim() === '') newErrors.razon_social = 'La razón social es obligatoria para facturación.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Por favor, completa los campos obligatorios.");
      return;
    }
  
    // --- CAMBIO CLAVE: CONSTRUIR EL ARRAY 'items' --- 
    const items = [];
    if (formData.armazon_id) {
      const selectedProduct = products.find(p => p.id === formData.armazon_id);
      items.push({
        armazon_id: formData.armazon_id,
        descripcion: `${selectedProduct?.marcas?.nombre || 'N/A'} - ${selectedProduct?.sku || 'Sin SKU'}`,
        cantidad: 1,
        precio_unitario: formData.precio_armazon,
      });
    }
  
    // Agregar micas si hay precio (con o sin descripción)
    if (parseFloat(formData.precio_micas) > 0) {
      items.push({
        descripcion: formData.descripcion_micas || 'Micas',
        cantidad: 1,
        precio_unitario: parseFloat(formData.precio_micas),
      });
    }
  
    const dataToSave = {
      ...formData,
      items: items,
      // Calcular y enviar el IVA
      requiere_factura: formData.requiere_factura,
      monto_iva: formData.requiere_factura ? calculatedTotals.iva : 0,
      rfc: formData.requiere_factura ? formData.rfc : null,
      razon_social: formData.requiere_factura ? formData.razon_social : null,
    };
  
    onSave(dataToSave);
  };

  const customerOptions = customers.map(c => ({ value: c.id, label: c.nombre }));
  // Filtrar productos con stock > 0 y agregar indicador de stock
  const productOptions = products
    .filter(p => p.stock > 0)
    .map(p => ({ 
      value: p.id, 
      label: `${p.marcas?.nombre || 'N/A'} - ${p.sku || 'Sin SKU'} - ${p.color || 'Sin color'} (Stock: ${p.stock})`
    }));
  const userOptions = users
    .filter(u => u.nombre?.toLowerCase() !== 'sistemas')
    .map(u => ({ value: u.id, label: `${u.nombre} ${u.apellido || ''}`.trim() }));
  const stateOptions = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'completada', label: 'Completada' }
  ];
  const formatCurrency = (amount) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{sale ? 'Editar Nota de Venta' : 'Nueva Nota de Venta'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente *</label>
                <Select
                  options={customerOptions}
                  value={formData.cliente_id}
                  onChange={(value) => handleChange('cliente_id', value)}
                  placeholder="Buscar cliente..."
                  searchable
                  clearable
                  error={errors.cliente_id}
                />
                {errors.cliente_id && <p className="text-xs text-red-600 mt-1">{errors.cliente_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <Select 
                  options={stateOptions} 
                  value={formData.estado} 
                  onChange={(value) => handleChange('estado', value)} 
                />
              </div>
            </div>
            
            {/* Campo de folio manual - solo mostrar en modo creación */}
            {!sale && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Folio (Opcional)</label>
                  <Input
                    name="folio_manual"
                    value={formData.folio_manual}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                    placeholder="Dejar vacío para folio automático (ej: FACT-2025-001)"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si dejas este campo vacío, se generará un folio automático. Si ingresas un folio manual, asegúrate de que sea único.
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Atendido por *</label>
                <Select
                  multiple
                  options={userOptions}
                  value={formData.vendedor_ids}
                  onChange={(value) => handleChange('vendedor_ids', value)}
                  placeholder="Seleccionar usuarios..."
                  searchable
                  clearable
                  error={errors.vendedor_ids}
                />
                {errors.vendedor_ids && <p className="text-xs text-red-600 mt-1">{errors.vendedor_ids}</p>}
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Armazón *</label>
                <Select
                  options={productOptions}
                  value={formData.armazon_id}
                  onChange={(value) => handleChange('armazon_id', value)}
                  placeholder="Buscar armazón..."
                  searchable
                  clearable
                  error={errors.armazon_id}
                />
                {errors.armazon_id && <p className="text-xs text-red-600 mt-1">{errors.armazon_id}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción Micas</label>
                  <Input 
                    name="descripcion_micas" 
                    value={formData.descripcion_micas} 
                    onChange={(e) => handleChange(e.target.name, e.target.value)} 
                    placeholder="Ej: BlueProtect" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Precio Micas</label>
                  <Input 
                    type="number" 
                    name="precio_micas" 
                    value={formData.precio_micas} 
                    onChange={(e) => handleChange(e.target.name, e.target.value)} 
                    placeholder="Ingresa el precio"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-md font-medium text-gray-800">Descuentos (Opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700">Desc. Armazón (%)</label><Input type="number" name="descuento_armazon_porcentaje" value={formData.descuento_armazon_porcentaje} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Desc. Armazón ($)</label><Input type="number" name="descuento_armazon_monto" value={formData.descuento_armazon_monto} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="0.00" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700">Desc. Micas (%)</label><Input type="number" name="descuento_micas_porcentaje" value={formData.descuento_micas_porcentaje} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Desc. Micas ($)</label><Input type="number" name="descuento_micas_monto" value={formData.descuento_micas_monto} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="0.00" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700">Desc. General (%)</label><Input type="number" name="descuento_porcentaje" value={formData.descuento_porcentaje} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="0" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Desc. General ($)</label><Input type="number" name="descuento_monto" value={formData.descuento_monto} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="0.00" /></div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-md font-medium text-gray-800 mb-3">Facturación</h3>
              <div className="mb-4">
                <Checkbox
                  id="requiere_factura"
                  checked={formData.requiere_factura}
                  onChange={(e) => handleChange('requiere_factura', e.target.checked)}
                  label="Requiere Factura"
                />
              </div>
              
              {formData.requiere_factura && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">RFC *</label>
                    <Input
                      name="rfc"
                      value={formData.rfc}
                      onChange={(e) => handleChange(e.target.name, e.target.value.toUpperCase())}
                      placeholder="XAXX010101000"
                      maxLength={13}
                    />
                    {errors.rfc && <p className="text-xs text-red-600 mt-1">{errors.rfc}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Razón Social *</label>
                    <Input
                      name="razon_social"
                      value={formData.razon_social}
                      onChange={(e) => handleChange(e.target.name, e.target.value)}
                      placeholder="Nombre o Razón Social"
                    />
                    {errors.razon_social && <p className="text-xs text-red-600 mt-1">{errors.razon_social}</p>}
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Calculator className="h-5 w-5 text-gray-600 mr-2" />
                  <h4 className="text-lg font-semibold text-gray-800">Resumen</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(calculatedTotals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Descuento Total:</span>
                    <span className="font-medium">-{formatCurrency(calculatedTotals.totalDiscount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal con Descuentos:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(calculatedTotals.finalTotal)}</span>
                  </div>
                  {formData.requiere_factura && (
                    <div className="flex justify-between text-blue-600">
                      <span>IVA (16%):</span>
                      <span className="font-medium">+{formatCurrency(calculatedTotals.iva)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2 mt-2">
                    <span>Total a Pagar:</span>
                    <span>{formatCurrency(formData.requiere_factura ? calculatedTotals.totalConIva : calculatedTotals.finalTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t pt-4"><label className="block text-sm font-medium text-gray-700">Observaciones</label><textarea name="observaciones" value={formData.observaciones} onChange={(e) => handleChange(e.target.name, e.target.value)} rows="3" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>
          </div>
          <div className="flex items-center justify-end p-4 border-t bg-gray-50">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="ml-2">{loading ? 'Guardando...' : (sale ? 'Actualizar' : 'Crear')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesModal;