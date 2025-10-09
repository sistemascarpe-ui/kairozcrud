import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const AppointmentModal = ({ 
  isOpen, 
  onClose, 
  customer, 
  onSchedule 
}) => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    service: '',
    notes: '',
    duration: '30'
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow?.setDate(tomorrow?.getDate() + 1);
      const defaultDate = tomorrow?.toISOString()?.split('T')?.[0];
      
      setFormData({
        date: defaultDate,
        time: '10:00',
        service: 'consultation',
        notes: '',
        duration: '30'
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors?.[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.date) {
      newErrors.date = 'La fecha es obligatoria';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today?.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'La fecha no puede ser anterior a hoy';
      }
    }

    if (!formData?.time) {
      newErrors.time = 'La hora es obligatoria';
    }

    if (!formData?.service) {
      newErrors.service = 'El tipo de servicio es obligatorio';
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
      const appointmentData = {
        id: Date.now(),
        customerId: customer?.id,
        customerName: customer?.name,
        date: formData?.date,
        time: formData?.time,
        service: formData?.service,
        notes: formData?.notes,
        duration: parseInt(formData?.duration),
        status: 'scheduled',
        createdAt: new Date()?.toISOString()
      };

      await onSchedule(appointmentData);
      onClose();
    } catch (error) {
      console.error('Error scheduling appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const serviceOptions = [
    { value: 'consultation', label: 'Consulta General' },
    { value: 'eye_exam', label: 'Examen de Vista' },
    { value: 'frame_fitting', label: 'Ajuste de Monturas' },
    { value: 'lens_pickup', label: 'Recogida de Lentes' },
    { value: 'repair', label: 'Reparación' },
    { value: 'follow_up', label: 'Seguimiento' }
  ];

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-soft w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Programar Cita
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Cliente: {customer?.name}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconName="X"
            onClick={onClose}
          />
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha"
              type="date"
              value={formData?.date}
              onChange={(e) => handleInputChange('date', e?.target?.value)}
              error={errors?.date}
              required
            />
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Hora *
              </label>
              <select
                value={formData?.time}
                onChange={(e) => handleInputChange('time', e?.target?.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                  errors?.time ? 'border-error' : 'border-border'
                }`}
                required
              >
                <option value="">Seleccionar hora</option>
                {timeSlots?.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {errors?.time && (
                <p className="text-error text-sm mt-1">{errors?.time}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tipo de Servicio *
            </label>
            <select
              value={formData?.service}
              onChange={(e) => handleInputChange('service', e?.target?.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                errors?.service ? 'border-error' : 'border-border'
              }`}
              required
            >
              <option value="">Seleccionar servicio</option>
              {serviceOptions?.map(option => (
                <option key={option?.value} value={option?.value}>
                  {option?.label}
                </option>
              ))}
            </select>
            {errors?.service && (
              <p className="text-error text-sm mt-1">{errors?.service}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Duración (minutos)
            </label>
            <select
              value={formData?.duration}
              onChange={(e) => handleInputChange('duration', e?.target?.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="15">15 minutos</option>
              <option value="30">30 minutos</option>
              <option value="45">45 minutos</option>
              <option value="60">1 hora</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notas Adicionales
            </label>
            <textarea
              value={formData?.notes}
              onChange={(e) => handleInputChange('notes', e?.target?.value)}
              placeholder="Información adicional sobre la cita..."
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Appointment Summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2 flex items-center">
              <Icon name="Calendar" size={16} className="mr-2" />
              Resumen de la Cita
            </h4>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium">Cliente:</span> {customer?.name}
              </p>
              {formData?.date && (
                <p className="text-muted-foreground">
                  <span className="font-medium">Fecha:</span> {new Date(formData.date)?.toLocaleDateString('es-ES')}
                </p>
              )}
              {formData?.time && (
                <p className="text-muted-foreground">
                  <span className="font-medium">Hora:</span> {formData?.time}
                </p>
              )}
              {formData?.service && (
                <p className="text-muted-foreground">
                  <span className="font-medium">Servicio:</span> {serviceOptions?.find(s => s?.value === formData?.service)?.label}
                </p>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            loading={isLoading}
            iconName="Calendar"
          >
            Programar Cita
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;