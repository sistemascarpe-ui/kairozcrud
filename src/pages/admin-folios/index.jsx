import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { salesService } from '../../services/salesService';

const AdminFolios = () => {
  const [formData, setFormData] = useState({
    nuevo_prefijo: '',
    nuevo_numero: '',
    forzar_reinicio: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [configActual, setConfigActual] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Cargar configuración actual al montar el componente
  useEffect(() => {
    const loadCurrentConfig = async () => {
      try {
        const result = await salesService.getFolioConfiguration();
        if (result.data) {
          setConfigActual(result.data);
        } else {
          toast.error(`Error al cargar configuración: ${result.error}`);
        }
      } catch (error) {
        toast.error('Error inesperado al cargar configuración');
        console.error('Error:', error);
      } finally {
        setLoadingConfig(false);
      }
    };

    loadCurrentConfig();
  }, []);

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

  const validate = () => {
    const newErrors = {};
    
    // Validar que al menos un campo esté lleno
    if (!formData.nuevo_prefijo.trim() && !formData.nuevo_numero.trim() && !formData.forzar_reinicio) {
      newErrors.general = 'Debes llenar al menos un campo para actualizar la configuración.';
    }
    
    // Validar número si se proporciona
    if (formData.nuevo_numero.trim() && (isNaN(formData.nuevo_numero) || parseInt(formData.nuevo_numero) < 1)) {
      newErrors.nuevo_numero = 'El número debe ser un entero positivo.';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error("Por favor, corrige los errores antes de continuar.");
      return;
    }

    setLoading(true);
    
    try {
      const result = await salesService.updateFolioConfiguration({
        nuevo_prefijo: formData.nuevo_prefijo.trim() || undefined,
        nuevo_numero: formData.nuevo_numero.trim() ? parseInt(formData.nuevo_numero) : undefined,
        forzar_reinicio: formData.forzar_reinicio
      });

      if (result.error) {
        toast.error(`Error al actualizar configuración: ${result.error}`);
      } else {
        toast.success('¡Configuración de folios actualizada exitosamente!');
        // Recargar configuración actual
        const configResult = await salesService.getFolioConfiguration();
        if (configResult.data) {
          setConfigActual(configResult.data);
        }
        // Limpiar formulario después del éxito
        setFormData({
          nuevo_prefijo: '',
          nuevo_numero: '',
          forzar_reinicio: false
        });
      }
    } catch (error) {
      toast.error('Error inesperado al actualizar la configuración.');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Settings className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Administración de Folios</h1>
          </div>
          <p className="text-gray-600">
            Configura el prefijo y número de inicio para la generación automática de folios de ventas.
          </p>
        </div>

        {/* Panel de configuración */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Configuración de Folios</h2>
            <p className="text-sm text-gray-600 mt-1">
              Cambia el prefijo y/o el número de inicio para los folios automáticos. Deja vacíos los campos que no quieras cambiar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campo de prefijo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Prefijo
                </label>
                <Input
                  name="nuevo_prefijo"
                  value={formData.nuevo_prefijo}
                  onChange={(e) => handleChange(e.target.name, e.target.value)}
                  placeholder="Ej: VL-, FACT-, VTA-"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Prefijo que aparecerá al inicio de cada folio (máximo 10 caracteres)
                </p>
                {errors.nuevo_prefijo && (
                  <p className="text-xs text-red-600 mt-1">{errors.nuevo_prefijo}</p>
                )}
              </div>

              {/* Campo de número */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Número de Inicio
                </label>
                <Input
                  type="number"
                  name="nuevo_numero"
                  value={formData.nuevo_numero}
                  onChange={(e) => handleChange(e.target.name, e.target.value)}
                  placeholder="Ej: 1000, 2000, 5000"
                  min="1"
                  step="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Número inicial para la secuencia de folios (debe ser un entero positivo)
                </p>
                {errors.nuevo_numero && (
                  <p className="text-xs text-red-600 mt-1">{errors.nuevo_numero}</p>
                )}
              </div>
            </div>

            {/* Checkbox de reinicio forzado */}
            <div className="mt-6">
              <div className="flex items-center">
                <input
                  id="forzar_reinicio"
                  type="checkbox"
                  checked={formData.forzar_reinicio}
                  onChange={(e) => handleChange('forzar_reinicio', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="forzar_reinicio" className="ml-2 block text-sm text-gray-900">
                  <span className="font-medium">Forzar reinicio inmediato</span>
                  <span className="text-gray-500 block">
                    Aplicar el nuevo número de inicio inmediatamente, incluso si ya hay ventas del día de hoy
                  </span>
                </label>
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Información Importante:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Los cambios solo afectarán a los <strong>nuevos folios automáticos</strong></li>
                <li>• Los folios manuales no se verán afectados por esta configuración</li>
                <li>• Puedes cambiar solo el prefijo, solo el número, o ambos</li>
                <li>• Los folios existentes mantendrán su formato actual</li>
                <li>• <strong>Sin reinicio forzado:</strong> El nuevo número se aplicará mañana</li>
                <li>• <strong>Con reinicio forzado:</strong> El nuevo número se aplicará inmediatamente</li>
              </ul>
            </div>

            {/* Botones de acción */}
            <div className="mt-6 flex items-center justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFormData({
                    nuevo_prefijo: '',
                    nuevo_numero: '',
                    forzar_reinicio: false
                  });
                  setErrors({});
                }}
                disabled={loading}
              >
                Limpiar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </div>

        {/* Panel de información actual */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Configuración Actual</h2>
          </div>
          <div className="p-6">
            {loadingConfig ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 animate-spin text-gray-500 mr-2" />
                <span className="text-gray-500">Cargando configuración...</span>
              </div>
            ) : configActual ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Prefijo Actual</h3>
                  <p className="text-lg font-semibold text-blue-700">{configActual.prefijo || 'V'}</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-medium text-green-900 mb-2">Número de Inicio</h3>
                  <p className="text-lg font-semibold text-green-700">{configActual.numero_inicio || 1}</p>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Ejemplo de Folio</h3>
                  <p className="text-sm text-gray-600">
                    <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                      {configActual.prefijo || 'V'}20250115{String(configActual.numero_inicio || 1).padStart(6, '0')}
                    </code>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No se pudo cargar la configuración actual
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFolios;
