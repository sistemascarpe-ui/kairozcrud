import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const BrandModal = ({ isOpen, onClose, brand, onSave, mode }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(mode === 'edit' && brand ? brand.nombre : '');
    }
  }, [isOpen, mode, brand]);

  const handleSave = () => {
    onSave({ nombre: name });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          {mode === 'create' ? 'Agregar Marca' : 'Editar Marca'}
        </h2>
        <div className="space-y-4">
          <Input
            label="Nombre de la Marca"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Ray-Ban"
          />
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </div>
      </div>
    </div>
  );
};

export default BrandModal;