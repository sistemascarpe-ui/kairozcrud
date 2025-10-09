import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const EmpresaModal = ({ 
  isOpen, 
  onClose,
  empresa = null, 
  onSave, 
  mode = 'edit' // 'edit' or 'add'
}) => {
  const [formData, setFormData] = useState({
    nombre: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (empresa && mode === 'edit') {
      setFormData({
        nombre: empresa?.nombre || ''
      });
    } else if (mode === 'add') {
      // Reset form for new empresa
      setFormData({
        nombre: ''
      });
    }
    setErrors({});
  }, [empresa, isOpen, mode]);

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
      newErrors.nombre = 'El nombre de la empresa es obligatorio';
    }

    if (formData?.nombre?.trim()?.length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
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
      const empresaData = {
        nombre: formData?.nombre?.trim()
      };

      await onSave(empresaData);
      onClose();
    } catch (error) {
      console.error('Error saving empresa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-soft w-full max-w-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name={mode === 'add' ? "Plus" : "Edit"} size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {mode === 'add' ? 'Agregar Nueva Empresa' : 'Editar Empresa'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === 'add' 
                  ? 'Ingresa los datos de la nueva empresa'
                  : 'Modifica los datos de la empresa'
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
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Información de la Empresa */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
                <Icon name="Building" size={20} className="mr-2" />
                Información de la Empresa
              </h3>
              <div className="space-y-4">
                <Input
                  label="Nombre de la Empresa"
                  type="text"
                  value={formData?.nombre}
                  onChange={(e) => handleInputChange('nombre', e?.target?.value)}
                  error={errors?.nombre}
                  required
                  placeholder="Ingrese el nombre de la empresa"
                  autoFocus
                />
              </div>
            </div>

            {/* Información del Registro */}
            {empresa && mode === 'edit' && (
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
                  <Icon name="Calendar" size={20} className="mr-2" />
                  Información del Registro
                </h3>
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ID de la Empresa:</span>
                    <span className="text-foreground font-medium">{empresa?.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fecha de Creación:</span>
                    <span className="text-foreground font-medium">
                      {empresa?.created_at ? new Date(empresa.created_at).toLocaleDateString('es-ES') : 'N/A'}
                    </span>
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
              : (mode === 'add' ? 'Crear Empresa' : 'Guardar Cambios')
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmpresaModal;
