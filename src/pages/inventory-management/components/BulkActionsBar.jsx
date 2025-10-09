import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';

const BulkActionsBar = ({ selectedCount, onBulkAction, onClearSelection }) => {
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('');
  const [bulkValue, setBulkValue] = useState('');

  const bulkActionOptions = [
    { value: 'update-category', label: 'Actualizar Categoría' },
    { value: 'update-supplier', label: 'Actualizar Proveedor' },
    { value: 'update-price', label: 'Actualizar Precio' },
    { value: 'adjust-stock', label: 'Ajustar Stock' },
    { value: 'delete', label: 'Eliminar Productos' }
  ];

  const categoryOptions = [
    { value: 'frames', label: 'Monturas' },
    { value: 'lenses', label: 'Lentes' },
    { value: 'accessories', label: 'Accesorios' },
    { value: 'contact-lenses', label: 'Lentes de Contacto' },
    { value: 'sunglasses', label: 'Gafas de Sol' }
  ];

  const supplierOptions = [
    { value: 'luxottica', label: 'Luxottica' },
    { value: 'safilo', label: 'Safilo' },
    { value: 'essilor', label: 'Essilor' },
    { value: 'zeiss', label: 'Carl Zeiss' },
    { value: 'hoya', label: 'Hoya' },
    { value: 'johnson', label: 'Johnson & Johnson' }
  ];

  const handleBulkAction = (actionType) => {
    setBulkActionType(actionType);
    setBulkValue('');
    
    if (actionType === 'delete') {
      // Show confirmation directly for delete
      if (window.confirm(`¿Estás seguro de que deseas eliminar ${selectedCount} productos seleccionados?`)) {
        onBulkAction(actionType, null);
        onClearSelection();
      }
    } else {
      setShowBulkModal(true);
    }
  };

  const handleBulkSubmit = () => {
    if (!bulkValue && bulkActionType !== 'delete') {
      return;
    }

    onBulkAction(bulkActionType, bulkValue);
    setShowBulkModal(false);
    setBulkActionType('');
    setBulkValue('');
    onClearSelection();
  };

  const renderBulkValueInput = () => {
    switch (bulkActionType) {
      case 'update-category':
        return (
          <Select
            label="Nueva Categoría"
            options={categoryOptions}
            value={bulkValue}
            onChange={setBulkValue}
            required
          />
        );
      case 'update-supplier':
        return (
          <Select
            label="Nuevo Proveedor"
            options={supplierOptions}
            value={bulkValue}
            onChange={setBulkValue}
            searchable
            required
          />
        );
      case 'update-price':
        return (
          <div className="space-y-4">
            <Select
              label="Tipo de Actualización"
              options={[
                { value: 'set', label: 'Establecer precio fijo' },
                { value: 'increase', label: 'Aumentar precio (%)' },
                { value: 'decrease', label: 'Disminuir precio (%)' }
              ]}
              value={bulkValue?.split('|')?.[0] || ''}
              onChange={(type) => setBulkValue(`${type}|${bulkValue?.split('|')?.[1] || ''}`)}
              required
            />
            <Input
              label={bulkValue?.startsWith('set') ? 'Nuevo Precio' : 'Porcentaje'}
              type="number"
              step={bulkValue?.startsWith('set') ? '0.01' : '1'}
              min="0"
              value={bulkValue?.split('|')?.[1] || ''}
              onChange={(e) => setBulkValue(`${bulkValue?.split('|')?.[0] || 'set'}|${e?.target?.value}`)}
              required
            />
          </div>
        );
      case 'adjust-stock':
        return (
          <div className="space-y-4">
            <Select
              label="Tipo de Ajuste"
              options={[
                { value: 'set', label: 'Establecer cantidad fija' },
                { value: 'add', label: 'Agregar al stock actual' },
                { value: 'subtract', label: 'Restar del stock actual' }
              ]}
              value={bulkValue?.split('|')?.[0] || ''}
              onChange={(type) => setBulkValue(`${type}|${bulkValue?.split('|')?.[1] || ''}`)}
              required
            />
            <Input
              label="Cantidad"
              type="number"
              min="0"
              value={bulkValue?.split('|')?.[1] || ''}
              onChange={(e) => setBulkValue(`${bulkValue?.split('|')?.[0] || 'set'}|${e?.target?.value}`)}
              required
            />
          </div>
        );
      default:
        return null;
    }
  };

  const getActionLabel = (actionType) => {
    return bulkActionOptions?.find(option => option?.value === actionType)?.label || '';
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Icon name="CheckSquare" size={20} className="text-primary" />
              <span className="font-medium text-primary">
                {selectedCount} producto{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="hidden sm:flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                iconName="Edit"
                onClick={() => handleBulkAction('update-category')}
              >
                Categoría
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconName="Truck"
                onClick={() => handleBulkAction('update-supplier')}
              >
                Proveedor
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconName="DollarSign"
                onClick={() => handleBulkAction('update-price')}
              >
                Precio
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconName="Package"
                onClick={() => handleBulkAction('adjust-stock')}
              >
                Stock
              </Button>
              <Button
                variant="destructive"
                size="sm"
                iconName="Trash2"
                onClick={() => handleBulkAction('delete')}
              >
                Eliminar
              </Button>
            </div>

            {/* Mobile dropdown for bulk actions */}
            <div className="sm:hidden">
              <Select
                options={bulkActionOptions}
                value=""
                onChange={handleBulkAction}
                placeholder="Acciones"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={onClearSelection}
          >
            Limpiar selección
          </Button>
        </div>
      </div>

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border shadow-soft w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                {getActionLabel(bulkActionType)}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                iconName="X"
                onClick={() => setShowBulkModal(false)}
              />
            </div>

            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Esta acción se aplicará a {selectedCount} producto{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}.
              </p>

              {renderBulkValueInput()}
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowBulkModal(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBulkSubmit}
                disabled={!bulkValue && bulkActionType !== 'delete'}
                iconName="Check"
              >
                Aplicar Cambios
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActionsBar;