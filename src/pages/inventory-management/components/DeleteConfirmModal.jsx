import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  productName,
  isLoading = false 
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  // PIN de administración para eliminar armazones
  const ADMIN_DELETE_PIN = import.meta.env.VITE_ADMIN_DELETE_PIN || '1234';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!pin.trim()) {
      setError('Por favor, ingresa el PIN de confirmación');
      return;
    }

    if (pin !== ADMIN_DELETE_PIN) {
      setError('PIN incorrecto. No tienes permisos para eliminar este armazón');
      return;
    }

    // Pasar el PIN al callback de confirmación
    onConfirm(pin);
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Icon name="AlertTriangle" size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Confirmar Eliminación
              </h3>
              <p className="text-sm text-muted-foreground">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-sm text-foreground mb-2">
              Estás a punto de eliminar el armazón:
            </p>
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="font-medium text-foreground">{productName}</p>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Para confirmar la eliminación, ingresa el PIN de administración:
            </p>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    PIN de Administración
                  </label>
                  <Input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Ingresa el PIN"
                    className="w-full"
                    autoFocus
                  />
                  {error && (
                    <p className="text-sm text-red-600 mt-1 flex items-center space-x-1">
                      <Icon name="AlertCircle" size={14} />
                      <span>{error}</span>
                    </p>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleSubmit}
              className="flex-1"
              disabled={isLoading || !pin.trim()}
              iconName={isLoading ? "Loader2" : "Trash2"}
            >
              {isLoading ? 'Eliminando...' : 'Eliminar Armazón'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
