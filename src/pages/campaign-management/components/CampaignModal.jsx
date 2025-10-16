import React, { useState, useEffect } from 'react';
import { Calendar, Building2, MapPin, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { empresaService } from '../../../services/empresaService';

const CampaignModal = ({ isOpen, onClose, campaign, onSave, mode = 'create' }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    fecha_inicio: '',
    fecha_fin: '',
    ubicacion: '',
    observaciones: '',
    estado: 'activa'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [empresas, setEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);

  // Cargar datos de la campaña si estamos editando
  useEffect(() => {
    if (isOpen && campaign && mode === 'edit') {
      setFormData({
        nombre: campaign.nombre || '',
        empresa: campaign.empresa || '',
        fecha_inicio: campaign.fecha_inicio || '',
        fecha_fin: campaign.fecha_fin || '',
        ubicacion: campaign.ubicacion || '',
        observaciones: campaign.observaciones || '',
        estado: campaign.estado || 'activa'
      });
    } else if (isOpen && mode === 'create') {
      // Resetear formulario para crear nueva campaña
      setFormData({
        nombre: '',
        empresa: '',
        fecha_inicio: '',
        fecha_fin: '',
        ubicacion: '',
        observaciones: '',
        estado: 'activa'
      });
    }
  }, [isOpen, campaign, mode]);

  // Cargar empresas cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadEmpresas();
    }
  }, [isOpen]);

  const loadEmpresas = async () => {
    try {
      setLoadingEmpresas(true);
      const result = await empresaService.getEmpresas();
      
      if (result.error) {
        toast.error(`Error al cargar empresas: ${result.error}`);
      } else {
        setEmpresas(result.data || []);
      }
    } catch (error) {
      toast.error('Error inesperado al cargar empresas');
      console.error('Error:', error);
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre de la campaña es obligatorio';
    }

    if (!formData.empresa.trim()) {
      newErrors.empresa = 'El nombre de la empresa es obligatorio';
    }

    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es obligatoria';
    }

    if (!formData.fecha_fin) {
      newErrors.fecha_fin = 'La fecha de fin es obligatoria';
    }

    // Validar que la fecha de fin sea posterior a la de inicio
    if (formData.fecha_inicio && formData.fecha_fin) {
      const inicio = new Date(formData.fecha_inicio);
      const fin = new Date(formData.fecha_fin);
      if (fin <= inicio) {
        newErrors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Por favor, corrige los errores antes de continuar");
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'edit':
        return 'Editar Campaña';
      default:
        return 'Nueva Campaña';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            {getModalTitle()}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre de la Campaña"
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                error={errors.nombre}
                required
                placeholder="Ej: Campaña Empresarial Q1 2025"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa *
                </label>
                <select
                  value={formData.empresa}
                  onChange={(e) => handleChange('empresa', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={loadingEmpresas}
                >
                  <option value="">{loadingEmpresas ? 'Cargando empresas...' : 'Selecciona una empresa'}</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.nombre}>
                      {empresa.nombre}
                    </option>
                  ))}
                </select>
                {errors.empresa && (
                  <p className="text-xs text-red-600 mt-1">{errors.empresa}</p>
                )}
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha de Inicio"
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) => handleChange('fecha_inicio', e.target.value)}
                error={errors.fecha_inicio}
                required
              />

              <Input
                label="Fecha de Fin"
                type="date"
                value={formData.fecha_fin}
                onChange={(e) => handleChange('fecha_fin', e.target.value)}
                error={errors.fecha_fin}
                required
              />
            </div>

            {/* Ubicación */}
            <Input
              label="Ubicación"
              type="text"
              value={formData.ubicacion}
              onChange={(e) => handleChange('ubicacion', e.target.value)}
              placeholder="Ej: Oficinas Centrales, Zona Norte"
              icon={<MapPin className="h-4 w-4" />}
            />

            {/* Estado */}
            <Select
              label="Estado"
              value={formData.estado}
              onChange={(value) => handleChange('estado', value)}
              options={[
                { value: 'activa', label: 'Activa' },
                { value: 'finalizada', label: 'Finalizada' },
                { value: 'cancelada', label: 'Cancelada' }
              ]}
            />

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleChange('observaciones', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Información adicional sobre la campaña..."
              />
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Información Importante:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Una vez creada la campaña, podrás enviar armazones desde el inventario</li>
                <li>• El estado "Activa" permite enviar productos</li>
                <li>• Las fechas ayudan a organizar y planificar las campañas</li>
              </ul>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
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
                className="flex items-center"
              >
                {loading ? 'Guardando...' : 'Guardar Campaña'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignModal;
