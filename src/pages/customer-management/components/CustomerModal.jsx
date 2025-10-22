import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const CustomerModal = ({ 
  isOpen, 
  onClose,
  customer = null, 
  onSave, 
  mode = 'edit', // 'edit' or 'add'
  users = [], // Lista de usuarios disponibles
  empresas = [] // Lista de empresas disponibles
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    correo: '',
    empresa_id: '',
    creado_por_id: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (customer && mode === 'edit') {
      setFormData({
        nombre: customer?.nombre || '',
        telefono: customer?.telefono || '',
        correo: customer?.correo || '',
        empresa_id: customer?.empresa_id || '',
        creado_por_id: customer?.creado_por_id || ''
      });
    } else if (mode === 'add') {
      // Reset form for new customer
      setFormData({
        nombre: '',
        telefono: '',
        correo: '',
        empresa_id: '',
        creado_por_id: ''
      });
    }
    setErrors({});
  }, [customer, isOpen, mode]);

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.nombre?.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }

    if (!formData?.telefono?.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    }

    if (formData?.correo && !/\S+@\S+\.\S+/?.test(formData?.correo)) {
      newErrors.correo = 'El formato del email no es válido';
    }

    if (!formData?.creado_por_id?.trim()) {
      newErrors.creado_por_id = 'Debe seleccionar quién atendió al cliente';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const customerData = {
        nombre: formData?.nombre,
        telefono: formData?.telefono,
        correo: formData?.correo,
        empresa_id: formData?.empresa_id,
        creado_por_id: formData?.creado_por_id
      };

      await onSave(customerData);
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-soft w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name={mode === 'add' ? "UserPlus" : "Edit"} size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {mode === 'add' ? 'Agregar Nuevo Cliente' : 'Editar Cliente'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === 'add' 
                  ? 'Ingresa los datos del nuevo cliente y su información clínica'
                  : 'Modifica los datos del cliente y su información clínica'
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={onClose}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Información Personal */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
                <Icon name="User" size={20} className="mr-2" />
                Información Personal
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre Completo"
                  type="text"
                  value={formData?.nombre}
                  onChange={(e) => handleInputChange('nombre', e?.target?.value)}
                  error={errors?.nombre}
                  required
                  placeholder="Ingrese el nombre completo"
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  value={formData?.telefono}
                  onChange={(e) => handleInputChange('telefono', e?.target?.value)}
                  error={errors?.telefono}
                  required
                  placeholder="Ingrese el teléfono"
                />
                <div className="md:col-span-2">
                  <Input
                    label="Correo Electrónico"
                    type="email"
                    value={formData?.correo}
                    onChange={(e) => handleInputChange('correo', e?.target?.value)}
                    error={errors?.correo}
                    placeholder="ejemplo@email.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <Select
                    label="Empresa"
                    value={formData?.empresa_id}
                    onChange={(value) => handleInputChange('empresa_id', value)}
                    options={[
                      { value: '', label: 'Sin empresa' },
                      ...empresas?.map(empresa => ({
                        value: empresa?.id,
                        label: empresa?.nombre
                      }))
                    ]}
                    placeholder="Seleccione una empresa (opcional)"
                    searchable
                  />
                </div>
                <div className="md:col-span-2">
                  <Select
                    label="Atendido por"
                    value={formData?.creado_por_id}
                    onChange={(value) => handleInputChange('creado_por_id', value)}
                    options={users
                      ?.filter(user => user?.nombre?.toLowerCase() !== 'sistemas')
                      ?.map(user => ({
                        value: user?.id,
                        label: user?.nombre || user?.name || `Usuario ${user?.id}`
                      }))}
                    placeholder="Seleccione el empleado que atendió al cliente"
                    error={errors?.creado_por_id}
                    searchable
                    required
                  />
                </div>
              </div>
            </div>

            {/* Información del Cliente */}
            {customer && mode === 'edit' && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
                  Información del Registro
                </h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ID del Cliente:</span>
                    <span className="text-foreground font-medium">{customer?.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fecha de Registro:</span>
                    <span className="text-foreground font-medium">
                      {customer?.created_at ? new Date(customer.created_at).toLocaleDateString('es-ES') : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Atendido por:</span>
                    <span className="text-foreground font-medium">{customer?.creado_por_id || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            iconName={isLoading ? "Loader2" : "Save"}
            className={isLoading ? "animate-spin" : ""}
          >
            {isLoading 
              ? (mode === 'add' ? 'Creando...' : 'Guardando...') 
              : (mode === 'add' ? 'Crear Cliente' : 'Guardar Cambios')
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerModal;