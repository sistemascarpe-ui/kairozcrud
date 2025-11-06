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
    cliente_ids: [],
    armazon_id: '',
    descripcion_micas: '',
    precio_armazon: 0,
    precio_micas: '', 
    monto_compra: '', 
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
    folio_manual: '',
    registrar_abono: false,
    monto_abono: '',
    forma_pago_abono: 'efectivo',
    observaciones_abono: '',
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [calculatedTotals, setCalculatedTotals] = useState({ subtotal: 0, totalDiscount: 0, finalTotal: 0, iva: 0, totalConIva: 0 });
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const montoCompra = parseFloat(formData.monto_compra);
    
    if (!isNaN(montoCompra) && montoCompra > 0) {
      const iva = formData.requiere_factura ? montoCompra * 0.16 : 0;
      const totalConIva = montoCompra + iva;
      
      setCalculatedTotals({
        subtotal: montoCompra,
        totalDiscount: 0,
        finalTotal: montoCompra,
        iva,
        totalConIva
      });
    } else {
      const armazonPrice = parseFloat(formData.precio_armazon) || 0;
      const micaPrice = parseFloat(formData.precio_micas) || 0;
      const armazonDiscountValue = parseFloat(formData.descuento_armazon_porcentaje) > 0 ? armazonPrice * (parseFloat(formData.descuento_armazon_porcentaje) / 100) : parseFloat(formData.descuento_armazon_monto) || 0;
      const micasDiscountValue = parseFloat(formData.descuento_micas_porcentaje) > 0 ? micaPrice * (parseFloat(formData.descuento_micas_porcentaje) / 100) : parseFloat(formData.descuento_micas_monto) || 0;
      const subtotalAfterProductDiscounts = (armazonPrice - armazonDiscountValue) + (micaPrice - micasDiscountValue);
      const generalDiscountValue = parseFloat(formData.descuento_porcentaje) > 0 ? subtotalAfterProductDiscounts * (parseFloat(formData.descuento_porcentaje) / 100) : parseFloat(formData.descuento_monto) || 0;
      const totalDiscount = armazonDiscountValue + micasDiscountValue + generalDiscountValue;
      const finalTotal = subtotalAfterProductDiscounts - generalDiscountValue;
      
      const iva = formData.requiere_factura ? finalTotal * 0.16 : 0;
      const totalConIva = finalTotal + iva;
      
      setCalculatedTotals({ 
        subtotal: armazonPrice + micaPrice, 
        totalDiscount, 
        finalTotal, 
        iva, 
        totalConIva 
      });
    }
  }, [
    formData.precio_armazon, 
    formData.precio_micas, 
    formData.descuento_armazon_porcentaje, 
    formData.descuento_armazon_monto,
    formData.descuento_micas_porcentaje, 
    formData.descuento_micas_monto,
    formData.descuento_porcentaje, 
    formData.descuento_monto,
    formData.requiere_factura,
    formData.monto_compra
  ]);

  useEffect(() => {
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
        setFormData({
          cliente_ids: sale.clientes ? sale.clientes.map(c => c.id) : (sale.cliente ? [sale.cliente.id] : []),
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
          folio_manual: '',
        });
      } else {
        const freshData = getInitialFormData();
        setFormData(freshData);
        setErrors({});
      }
    }
  }, [isOpen, isDataLoaded, sale]);

  const handleChange = (name, value) => {
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
      const armazonPrice = parseFloat(newFormData.precio_armazon) || 0;
      const micaPrice = parseFloat(newFormData.precio_micas) || 0;
      const armazonDiscountValue = parseFloat(newFormData.descuento_armazon_porcentaje) > 0 ? 
        armazonPrice * (parseFloat(newFormData.descuento_armazon_porcentaje) / 100) : 
        parseFloat(newFormData.descuento_armazon_monto) || 0;
      const micasDiscountValue = parseFloat(newFormData.descuento_micas_porcentaje) > 0 ? 
        micaPrice * (parseFloat(newFormData.descuento_micas_porcentaje) / 100) : 
        parseFloat(newFormData.descuento_micas_monto) || 0;
      const subtotalAfterProductDiscounts = (armazonPrice - armazonDiscountValue) + (micaPrice - micasDiscountValue);
      
      newFormData.descuento_monto = (subtotalAfterProductDiscounts * numericValue) / 100;
    } else if (name === 'descuento_monto') {
      newFormData.descuento_porcentaje = '';
    } else if (name === 'armazon_id') {
      const selectedProduct = products.find(p => p.id === value);
      newFormData.precio_armazon = selectedProduct ? selectedProduct.precio : 0;
    }
    
    setFormData(newFormData);
    
    // Limpiar errores específicos cuando se cambian los campos
    if (name === 'cliente_ids' && errors.cliente_ids) {
      setErrors(prev => ({ ...prev, cliente_ids: '' }));
    }
  };


  const validate = () => {
    const newErrors = {};
    if (!formData.cliente_ids || formData.cliente_ids.length === 0) {
      newErrors.cliente_ids = 'Debe seleccionar al menos un cliente.';
    }
    if (!formData.armazon_id && !formData.monto_compra) newErrors.armazon_id = 'Debe seleccionar un armazón o ingresar un monto total de compra.';
    if (!formData.vendedor_ids || formData.vendedor_ids.length === 0) newErrors.vendedor_ids = 'Debe seleccionar al menos un vendedor.';
    
    if (formData.requiere_factura) {
      if (!formData.rfc || formData.rfc.trim() === '') newErrors.rfc = 'El RFC es obligatorio para facturación.';
      if (!formData.razon_social || formData.razon_social.trim() === '') newErrors.razon_social = 'La razón social es obligatoria para facturación.';
    }
    
    if (formData.registrar_abono) {
      if (!formData.monto_abono || parseFloat(formData.monto_abono) <= 0) {
        newErrors.monto_abono = 'Debe ingresar un monto válido para el abono.';
      } else {
        const totalVenta = formData.requiere_factura ? calculatedTotals.totalConIva : calculatedTotals.finalTotal;
        if (parseFloat(formData.monto_abono) > totalVenta) {
          newErrors.monto_abono = 'El monto del abono no puede ser mayor al total de la venta.';
        }
      }
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
      requiere_factura: formData.requiere_factura,
      monto_iva: formData.requiere_factura ? calculatedTotals.iva : 0,
      rfc: formData.requiere_factura ? formData.rfc : null,
      razon_social: formData.requiere_factura ? formData.razon_social : null,
    };
  
    onSave(dataToSave);
  };

  const customerOptions = customers.map(c => ({ value: c.id, label: c.nombre }));
  const productOptions = products
    .filter(p => p.stock > 0)
    .map(p => ({ 
      value: p.id, 
      // Mostrar solo SKU - Color en el buscador de ventas
      label: `${p.sku || 'Sin SKU'} - ${p.color || 'Sin color'}`
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
                <label className="block text-sm font-medium text-gray-700">Clientes *</label>
                <Select
                  multiple
                  options={customerOptions}
                  value={formData.cliente_ids}
                  onChange={(value) => handleChange('cliente_ids', value)}
                  placeholder="Seleccionar clientes..."
                  searchable
                  clearable
                  error={errors.cliente_ids}
                />
                {errors.cliente_ids && <p className="text-xs text-red-600 mt-1">{errors.cliente_ids}</p>}
                
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
                  disabled={!!formData.monto_compra}
                />
                {errors.armazon_id && !formData.monto_compra && <p className="text-xs text-red-600 mt-1">{errors.armazon_id}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descripción Micas</label>
                  <Input 
                    name="descripcion_micas" 
                    value={formData.descripcion_micas} 
                    onChange={(e) => handleChange(e.target.name, e.target.value)} 
                    placeholder="Ej: BlueProtect"
                    disabled={!!formData.monto_compra}
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
                    disabled={!!formData.monto_compra}
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Monto Total de la Compra</label>
                <Input 
                  type="number"
                  name="monto_compra"
                  value={formData.monto_compra}
                  onChange={(e) => handleChange(e.target.name, e.target.value)}
                  placeholder="Ingrese el monto total"
                  min="0"
                  step="0.01"
                  className="mb-4"
                />
                <p className="text-xs text-gray-500 mb-4">Si ingresa este monto, se usará como total de la compra</p>
              </div>
              <h3 className="text-md font-medium text-gray-800">Descuentos (Opcional)</h3>
              {formData.monto_compra && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Al ingresar un monto total de compra, los descuentos se aplicarán sobre este monto.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!formData.monto_compra && (
                  <>
                    <div><label className="block text-sm font-medium text-gray-700">Desc. Armazón (%)</label><Input type="number" name="descuento_armazon_porcentaje" value={formData.descuento_armazon_porcentaje} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="0" disabled={!!formData.monto_compra} /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Desc. Armazón ($)</label><Input type="number" name="descuento_armazon_monto" value={formData.descuento_armazon_monto} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="0.00" disabled={!!formData.monto_compra} /></div>
                  </>
                )}
              </div>
              {!formData.monto_compra && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700">Desc. Micas (%)</label><Input type="number" name="descuento_micas_porcentaje" value={formData.descuento_micas_porcentaje} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="0" disabled={!!formData.monto_compra} /></div>
                  <div><label className="block text-sm font-medium text-gray-700">Desc. Micas ($)</label><Input type="number" name="descuento_micas_monto" value={formData.descuento_micas_monto} onChange={(e) => handleChange(e.target.name, e.target.value)} placeholder="0.00" disabled={!!formData.monto_compra} /></div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Desc. General (%)
                  </label>
                  <Input 
                    type="number" 
                    name="descuento_porcentaje" 
                    value={formData.descuento_porcentaje} 
                    onChange={(e) => handleChange(e.target.name, e.target.value)} 
                    placeholder="0" 
                    disabled={!formData.monto_compra && !formData.precio_armazon && !formData.precio_micas}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {formData.monto_compra ? 'Monto del Descuento ($)' : 'Desc. General ($)'}
                  </label>
                  <Input 
                    type="number" 
                    name="descuento_monto" 
                    value={formData.descuento_monto} 
                    onChange={(e) => handleChange(e.target.name, e.target.value)} 
                    placeholder="0.00" 
                  />
                </div>
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
              <h3 className="text-md font-medium text-gray-800 mb-3">Registro de Abono</h3>
              <div className="mb-4">
                <Checkbox
                  id="registrar_abono"
                  checked={formData.registrar_abono}
                  onChange={(e) => handleChange('registrar_abono', e.target.checked)}
                  label="Registrar abono/adelanto de pago"
                />
              </div>
              
              {formData.registrar_abono && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monto del Abono *</label>
                    <Input
                      type="number"
                      name="monto_abono"
                      value={formData.monto_abono}
                      onChange={(e) => handleChange(e.target.name, e.target.value)}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      max={formData.requiere_factura ? calculatedTotals.totalConIva : calculatedTotals.finalTotal}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo: ${formatCurrency(formData.requiere_factura ? calculatedTotals.totalConIva : calculatedTotals.finalTotal)}
                    </p>
                    {errors.monto_abono && <p className="text-xs text-red-600 mt-1">{errors.monto_abono}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Forma de Pago *</label>
                    <Select
                      options={[
                        { value: 'efectivo', label: 'Efectivo' },
                        { value: 'tarjeta_debito', label: 'Tarjeta de Débito' },
                        { value: 'tarjeta_credito', label: 'Tarjeta de Crédito' },
                        { value: 'transferencia', label: 'Transferencia' }
                      ]}
                      value={formData.forma_pago_abono}
                      onChange={(value) => handleChange('forma_pago_abono', value)}
                    />
                  </div>
                </div>
              )}
              
              {formData.registrar_abono && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Observaciones del Abono</label>
                  <textarea
                    name="observaciones_abono"
                    value={formData.observaciones_abono}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                    rows="2"
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                    placeholder="Observaciones adicionales sobre el abono..."
                  />
                </div>
              )}
              
              {formData.registrar_abono && formData.monto_abono && parseFloat(formData.monto_abono) > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Abono:</span> ${formatCurrency(parseFloat(formData.monto_abono) || 0)}
                      </p>
                      <p className="text-sm text-blue-700">
                        <span className="font-medium">Saldo pendiente:</span> ${formatCurrency((formData.requiere_factura ? calculatedTotals.totalConIva : calculatedTotals.finalTotal) - (parseFloat(formData.monto_abono) || 0))}
                      </p>
                      {parseFloat(formData.monto_abono) >= (formData.requiere_factura ? calculatedTotals.totalConIva : calculatedTotals.finalTotal) && (
                        <p className="text-xs text-green-600 mt-1 font-medium">
                          ✅ La venta quedará completamente pagada
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t pt-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Calculator className="h-5 w-5 text-gray-600 mr-2" />
                  <h4 className="text-lg font-semibold text-gray-800">Resumen Detallado</h4>
                </div>
                <div className="space-y-3 text-sm">
                  {formData.monto_compra ? (
                    <div className="bg-blue-50 p-3 rounded-md mb-3">
                      <div className="flex justify-between font-medium text-blue-800">
                        <span>Monto Total de Compra:</span>
                        <span>{formatCurrency(parseFloat(formData.monto_compra))}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {formData.armazon_id && (
                        <div className="border-b pb-2 mb-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Armazón:</span>
                            <span className="font-medium">{formatCurrency(parseFloat(formData.precio_armazon) || 0)}</span>
                          </div>
                          {(formData.descuento_armazon_porcentaje || formData.descuento_armazon_monto) && (
                            <div className="text-red-600 text-right text-xs mt-1">
                              Descuento: {formData.descuento_armazon_porcentaje ? 
                                `${formData.descuento_armazon_porcentaje}% (${formatCurrency((parseFloat(formData.precio_armazon) * parseFloat(formData.descuento_armazon_porcentaje) / 100) || 0)})` : 
                                `${formatCurrency(parseFloat(formData.descuento_armazon_monto) || 0)}`}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {formData.precio_micas && parseFloat(formData.precio_micas) > 0 && (
                        <div className="border-b pb-2 mb-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Micas ({formData.descripcion_micas || 'Sin descripción'}):</span>
                            <span className="font-medium">{formatCurrency(parseFloat(formData.precio_micas) || 0)}</span>
                          </div>
                          {(formData.descuento_micas_porcentaje || formData.descuento_micas_monto) && (
                            <div className="text-red-600 text-right text-xs mt-1">
                              Descuento: {formData.descuento_micas_porcentaje ? 
                                `${formData.descuento_micas_porcentaje}% (${formatCurrency((parseFloat(formData.precio_micas) * parseFloat(formData.descuento_micas_porcentaje) / 100) || 0)})` : 
                                `${formatCurrency(parseFloat(formData.descuento_micas_monto) || 0)}`}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(calculatedTotals.subtotal)}</span>
                    </div>

                    {(formData.descuento_porcentaje || formData.descuento_monto) && (
                      <div className="flex justify-between text-red-600 mt-1">
                        <span>Descuento General:</span>
                        <span className="font-medium">
                          {formData.descuento_porcentaje ? 
                            `${formData.descuento_porcentaje}% (${formatCurrency((calculatedTotals.finalTotal * parseFloat(formData.descuento_porcentaje) / 100) || 0)})` : 
                            formatCurrency(parseFloat(formData.descuento_monto) || 0)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between mt-2 font-medium">
                      <span>Subtotal con Descuentos:</span>
                      <span>{formatCurrency(calculatedTotals.finalTotal)}</span>
                    </div>

                    {formData.requiere_factura && (
                      <div className="flex justify-between text-blue-600 mt-1">
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