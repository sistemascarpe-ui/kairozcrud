import React, { useState, useEffect, useMemo } from 'react';
import { inventoryService } from '../../../services/inventoryService';
import { userService } from '../../../services/userService';
import { supabase } from '../../../lib/supabase';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Icon from '../../../components/AppIcon';

const ProductModal = ({ isOpen, onClose, product, onSave, mode = 'create', brands = [], groups = [], descriptions = [], subBrands = [], userProfile = {} }) => {
  const [formData, setFormData] = useState({
    sku: '',
    color: '',
    precio: '',
    stock: '',
    marca_id: '',
    grupo_id: '',
    descripcion_id: '',
    sub_marca_id: '',
    creado_por_id: userProfile?.id || ''
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});

  // Convert brands, groups, descriptions, and subBrands to options format using useMemo
  const brandOptions = useMemo(() => brands?.map(brand => ({
    value: String(brand?.id),
    label: brand?.nombre
  })) || [], [brands]);

  const groupOptions = useMemo(() => groups?.map(group => ({
    value: String(group?.id),
    label: group?.nombre
  })) || [], [groups]);

  const descriptionOptions = useMemo(() => descriptions?.map(desc => ({
    value: String(desc?.id),
    label: desc?.nombre
  })) || [], [descriptions]);

  const subBrandOptions = useMemo(() => subBrands?.map(subBrand => ({
    value: String(subBrand?.id),
    label: subBrand?.nombre
  })) || [], [subBrands]);

  const userOptions = useMemo(() => users?.map(user => ({
    value: String(user?.id),
    label: `${user?.nombre} ${user?.apellido || ''}`.trim()
  })) || [], [users]);

  useEffect(() => {
    if (isOpen) {
      // Load users when modal opens
      loadUsers();
      
      if (mode === 'edit' && product) {
        const formDataToSet = {
          sku: product.sku || '',
          color: product.color || '',
          precio: product.precio !== null && product.precio !== undefined ? String(product.precio) : '',
          stock: product.stock !== null && product.stock !== undefined ? String(product.stock) : '',
          marca_id: String(product.marca_id || ''),
          grupo_id: String(product.grupo_id || ''),
          descripcion_id: String(product.descripcion_id || ''),
          sub_marca_id: String(product.sub_marca_id || ''),
          creado_por_id: String(product.creado_por_id || userProfile?.id || '')
        };
        
        setFormData(formDataToSet);
      } else {
        setFormData({
          sku: '',
          color: '',
          precio: '',
          stock: '',
          marca_id: '',
          grupo_id: '',
          descripcion_id: '',
          sub_marca_id: '',
          creado_por_id: userProfile?.id || ''
        });
      }
    }
    setErrors({});
  }, [isOpen, product, mode, userProfile?.id]);

  const loadUsers = async () => {
    try {
      const result = await userService.getUsersForInventory();
      
      if (result.error) {
        console.error('Error loading users:', result.error);
      } else {
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = async () => {
    const newErrors = {};

    if (!formData?.sku?.trim()) {
      newErrors.sku = 'El modelo es obligatorio';
    } else if (mode === 'edit' || mode === 'create') {
      // Verificar si el SKU ya existe (excepto para el producto actual en modo edit)
      try {
        const { data: existingProducts, error } = await supabase
          .from('armazones')
          .select('id, sku')
          .eq('sku', formData.sku?.trim());
        
        if (!error && existingProducts?.length > 0) {
          // En modo edit, permitir si es el mismo producto
          if (mode === 'edit' && existingProducts?.some(p => p.id === product?.id)) {
            // Es el mismo producto, no hay error
          } else {
            // SKU ya existe en otro producto
            newErrors.sku = 'Este modelo ya existe';
          }
        }
      } catch (error) {
        console.error('Error validando SKU:', error);
        // En caso de error de conexión, permitir continuar
      }
    }

    if (!formData?.marca_id) {
      newErrors.marca_id = 'La marca es obligatoria';
    }

    if (!formData?.grupo_id) {
      newErrors.grupo_id = 'El grupo es obligatorio';
    }

    if (!formData?.precio || isNaN(parseFloat(formData?.precio)) || parseFloat(formData?.precio) <= 0) {
      newErrors.precio = 'El precio debe ser un número mayor a 0';
    }

    if (!formData?.stock || isNaN(parseInt(formData?.stock)) || parseInt(formData?.stock) < 0) {
      newErrors.stock = 'La cantidad debe ser un número mayor o igual a 0';
    }

    if (!formData?.creado_por_id) {
      newErrors.creado_por_id = 'Debe seleccionar un usuario';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!(await validateForm())) {
      console.log('Formulario no válido, errores:', errors);
      return;
    }
    
    setLoading(true);

    try {
      const productData = {
        sku: formData.sku,
        color: formData.color,
        precio: parseFloat(formData.precio) || 0,
        stock: parseInt(formData.stock) || 0,
        marca_id: formData.marca_id || null,
        grupo_id: formData.grupo_id || null,
        descripcion_id: formData.descripcion_id || null,
        sub_marca_id: formData.sub_marca_id || null,
        creado_por_id: formData.creado_por_id || null
      };

      console.log('Datos del formulario antes de enviar:', formData);
      console.log('Datos del producto a enviar:', productData);
      console.log('creado_por_id específicamente:', formData.creado_por_id);

      await onSave(productData);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'edit':
        return 'Editar Producto';
      case 'duplicate':
        return 'Duplicar Producto';
      default:
        return 'Agregar Producto';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0">
      <div className="bg-card w-full h-full max-w-none max-h-none overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border bg-white">
          <h2 className="text-2xl font-bold text-foreground">
            {getModalTitle()}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          />
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            {/* Basic Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Input
                  label="Modelo"
                  type="text"
                  value={formData?.sku}
                  onChange={(e) => handleInputChange('sku', e?.target?.value)}
                  error={errors?.sku}
                  required
                  placeholder="Ej: RB-001"
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Input
                  label="Color"
                  type="text"
                  value={formData?.color}
                  onChange={(e) => handleInputChange('color', e?.target?.value)}
                  placeholder="Ej: Negro, Transparente"
                  className="h-12 text-lg"
                />
              </div>
            </div>

            {/* Dropdowns for relationships */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Select
                  label="Marca"
                  options={brandOptions}
                  value={formData?.marca_id}
                  onChange={(value) => handleInputChange('marca_id', value)}
                  error={errors?.marca_id}
                  required
                  placeholder="Seleccionar marca"
                  searchable
                  className="[&>div>button]:h-12 [&>div>button]:text-lg"
                />
              </div>

              <div className="space-y-2">
                <Select
                  label="Grupo"
                  options={groupOptions}
                  value={formData?.grupo_id}
                  onChange={(value) => handleInputChange('grupo_id', value)}
                  error={errors?.grupo_id}
                  required
                  placeholder="Seleccionar grupo"
                  searchable
                  className="[&>div>button]:h-12 [&>div>button]:text-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Select
                  label="Descripción"
                  options={descriptionOptions}
                  value={formData?.descripcion_id}
                  onChange={(value) => handleInputChange('descripcion_id', value)}
                  placeholder="Seleccionar descripción"
                  searchable
                  className="[&>div>button]:h-12 [&>div>button]:text-lg"
                />
              </div>

              <div className="space-y-2">
                <Select
                  label="Sub Marca"
                  options={subBrandOptions}
                  value={formData?.sub_marca_id}
                  onChange={(value) => handleInputChange('sub_marca_id', value)}
                  placeholder="Seleccionar sub marca"
                  searchable
                  className="[&>div>button]:h-12 [&>div>button]:text-lg"
                />
              </div>
            </div>

            {/* Pricing and Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Input
                  label="Precio"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData?.precio}
                  onChange={(e) => handleInputChange('precio', e?.target?.value)}
                  error={errors?.precio}
                  required
                  placeholder="0.00"
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Input
                  label="Cantidad"
                  type="number"
                  min="0"
                  value={formData?.stock}
                  onChange={(e) => handleInputChange('stock', e?.target?.value)}
                  error={errors?.stock}
                  required
                  placeholder="0"
                  className="h-12 text-lg"
                />
              </div>
            </div>

            {/* Creado Por */}
            <div className="space-y-2">
              <Select
                label="Creado Por"
                options={userOptions}
                value={formData.creado_por_id}
                onChange={(value) => {
                  console.log('Usuario seleccionado:', value);
                  handleInputChange('creado_por_id', value);
                }}
                placeholder="-- Selecciona --"
                searchable
                description="Selecciona el usuario que registra este producto"
                error={errors?.creado_por_id}
                className="[&>div>button]:h-12 [&>div>button]:text-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 p-8 border-t border-border bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-12 px-8 text-lg font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-8 text-lg font-semibold"
            >
              {loading ? 'Guardando...' : `${mode === 'edit' ? 'Actualizar' : 'Crear'} Producto`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;