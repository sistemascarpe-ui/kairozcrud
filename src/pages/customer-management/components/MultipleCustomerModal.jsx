import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const MultipleCustomerModal = ({ 
  isOpen, 
  onClose,
  onSave, 
  users = [], 
  empresas = [] 
}) => {
  const [customers, setCustomers] = useState([
    {
      id: 1,
      nombre: '',
      telefono: '',
      correo: '',
      empresa_id: '',
      creado_por_id: ''
    }
  ]);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setCustomers([
        {
          id: 1,
          nombre: '',
          telefono: '',
          correo: '',
          empresa_id: '',
          creado_por_id: ''
        }
      ]);
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (customerId, field, value) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === customerId 
        ? { ...customer, [field]: value }
        : customer
    ));
    
    // Clear error when user starts typing
    const errorKey = `${customerId}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const addCustomer = () => {
    const newId = Math.max(...customers.map(c => c.id)) + 1;
    setCustomers(prev => [...prev, {
      id: newId,
      nombre: '',
      telefono: '',
      correo: '',
      empresa_id: '',
      creado_por_id: ''
    }]);
  };

  const removeCustomer = (customerId) => {
    if (customers.length > 1) {
      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
      // Remove errors for this customer
      const newErrors = { ...errors };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`${customerId}_`)) {
          delete newErrors[key];
        }
      });
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    customers.forEach(customer => {
      if (!customer.nombre?.trim()) {
        newErrors[`${customer.id}_nombre`] = 'El nombre es obligatorio';
      }

      if (!customer.telefono?.trim()) {
        newErrors[`${customer.id}_telefono`] = 'El teléfono es obligatorio';
      }

      if (customer.correo && !/\S+@\S+\.\S+/.test(customer.correo)) {
        newErrors[`${customer.id}_correo`] = 'El formato del email no es válido';
      }

      if (!customer.creado_por_id?.trim()) {
        newErrors[`${customer.id}_creado_por_id`] = 'Debe seleccionar quién atendió al cliente';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const customersData = customers.map(customer => ({
        nombre: customer.nombre,
        telefono: customer.telefono,
        correo: customer.correo,
        empresa_id: customer.empresa_id,
        creado_por_id: customer.creado_por_id
      }));

      await onSave(customersData);
      onClose();
    } catch (error) {
      console.error('Error saving customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-soft w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="Users" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Registro Múltiple de Clientes
              </h2>
              <p className="text-sm text-muted-foreground">
                Registra varios clientes de una vez. Puedes agregar o quitar campos según necesites.
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
            {customers.map((customer, index) => (
              <div key={customer.id} className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-foreground flex items-center">
                    <Icon name="User" size={20} className="mr-2" />
                    Cliente {index + 1}
                  </h3>
                  {customers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconName="Trash2"
                      onClick={() => removeCustomer(customer.id)}
                      className="text-red-600 hover:text-red-700"
                    />
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre Completo"
                    type="text"
                    value={customer.nombre}
                    onChange={(e) => handleInputChange(customer.id, 'nombre', e.target.value)}
                    error={errors[`${customer.id}_nombre`]}
                    required
                    placeholder="Ingrese el nombre completo"
                  />
                  <Input
                    label="Teléfono"
                    type="tel"
                    value={customer.telefono}
                    onChange={(e) => handleInputChange(customer.id, 'telefono', e.target.value)}
                    error={errors[`${customer.id}_telefono`]}
                    required
                    placeholder="Ingrese el teléfono"
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Correo Electrónico"
                      type="email"
                      value={customer.correo}
                      onChange={(e) => handleInputChange(customer.id, 'correo', e.target.value)}
                      error={errors[`${customer.id}_correo`]}
                      placeholder="ejemplo@email.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Select
                      label="Empresa"
                      value={customer.empresa_id}
                      onChange={(value) => handleInputChange(customer.id, 'empresa_id', value)}
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
                      value={customer.creado_por_id}
                      onChange={(value) => handleInputChange(customer.id, 'creado_por_id', value)}
                      options={users
                        ?.filter(user => user?.nombre?.toLowerCase() !== 'sistemas')
                        ?.map(user => ({
                          value: user?.id,
                          label: user?.nombre || user?.name || `Usuario ${user?.id}`
                        }))}
                      placeholder="Seleccione el empleado que atendió al cliente"
                      error={errors[`${customer.id}_creado_por_id`]}
                      searchable
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add Customer Button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={addCustomer}
                iconName="Plus"
                className="border-dashed"
              >
                Agregar Otro Cliente
              </Button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border flex-shrink-0">
          <div className="text-sm text-muted-foreground">
            {customers.length} cliente{customers.length !== 1 ? 's' : ''} para registrar
          </div>
          <div className="flex items-center space-x-3">
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
                ? 'Registrando...' 
                : `Registrar ${customers.length} Cliente${customers.length !== 1 ? 's' : ''}`
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultipleCustomerModal;