import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { historialGraduacionesService } from '../../../services/historialGraduacionesService';
import { useAuth } from '../../../contexts/AuthContext';

const HistorialGraduacionesModal = ({ 
  isOpen, 
  onClose,
  customer = null,
  users = [] // Lista de usuarios disponibles
}) => {
  const { user, userProfile } = useAuth();
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGraduacion, setEditingGraduacion] = useState(null);
  const [newGraduacion, setNewGraduacion] = useState({
    graduacion_od: '',
    graduacion_oi: '',
    graduacion_add: '',
    dip: '',
    observaciones: '',
    creado_por_id: ''
  });

  // Load historial when modal opens
  useEffect(() => {
    if (isOpen && customer?.id) {
      loadHistorial();
    }
  }, [isOpen, customer?.id]);

  const loadHistorial = async () => {
    setLoading(true);
    try {
      const { data, error } = await historialGraduacionesService.getHistorialByCliente(customer.id);
      if (error) {
        toast.error(`Error al cargar historial: ${error}`);
      } else {
        setHistorial(data || []);
      }
    } catch (error) {
      toast.error('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGraduacion = async () => {
    try {
      // Validar que se haya seleccionado un usuario
      if (!newGraduacion.creado_por_id) {
        toast.error('Debe seleccionar quién atendió al cliente');
        return;
      }
      
      const graduacionData = {
        cliente_id: customer.id,
        graduacion_od: newGraduacion.graduacion_od || null,
        graduacion_oi: newGraduacion.graduacion_oi || null,
        graduacion_add: newGraduacion.graduacion_add || null,
        dip: newGraduacion.dip || null,
        observaciones: newGraduacion.observaciones || null,
        creado_por_id: newGraduacion.creado_por_id
      };

      const { data, error } = await historialGraduacionesService.createGraduacion(graduacionData);
      if (error) {
        toast.error(`Error al agregar graduación: ${error}`);
      } else {
        toast.success('Graduación agregada exitosamente');
        setNewGraduacion({
          graduacion_od: '',
          graduacion_oi: '',
          graduacion_add: '',
          dip: '',
          observaciones: '',
          creado_por_id: ''
        });
        setShowAddForm(false);
        loadHistorial(); // Reload the history
      }
    } catch (error) {
      toast.error('Error al agregar la graduación');
    }
  };

  const handleEditGraduacion = (graduacion) => {
    setEditingGraduacion(graduacion);
    setNewGraduacion({
      graduacion_od: graduacion.graduacion_od || '',
      graduacion_oi: graduacion.graduacion_oi || '',
      graduacion_add: graduacion.graduacion_add || '',
      dip: graduacion.dip || '',
      observaciones: graduacion.observaciones || '',
      creado_por_id: graduacion.creado_por_id || ''
    });
    setShowAddForm(true);
  };

  const handleUpdateGraduacion = async () => {
    try {
      // Validar que se haya seleccionado un usuario
      if (!newGraduacion.creado_por_id) {
        toast.error('Debe seleccionar quién atendió al cliente');
        return;
      }
      
      const graduacionData = {
        graduacion_od: newGraduacion.graduacion_od || null,
        graduacion_oi: newGraduacion.graduacion_oi || null,
        graduacion_add: newGraduacion.graduacion_add || null,
        dip: newGraduacion.dip || null,
        observaciones: newGraduacion.observaciones || null,
        creado_por_id: newGraduacion.creado_por_id
      };

      const { data, error } = await historialGraduacionesService.updateGraduacion(editingGraduacion.id, graduacionData);
      if (error) {
        toast.error(`Error al actualizar graduación: ${error}`);
      } else {
        toast.success('Graduación actualizada exitosamente');
        setNewGraduacion({
          graduacion_od: '',
          graduacion_oi: '',
          graduacion_add: '',
          dip: '',
          observaciones: '',
          creado_por_id: ''
        });
        setEditingGraduacion(null);
        setShowAddForm(false);
        loadHistorial(); // Reload the history
      }
    } catch (error) {
      toast.error('Error al actualizar la graduación');
    }
  };

  const handleCancelEdit = () => {
    setEditingGraduacion(null);
    setNewGraduacion({
      graduacion_od: '',
      graduacion_oi: '',
      graduacion_add: '',
      dip: '',
      observaciones: '',
      creado_por_id: ''
    });
    setShowAddForm(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-soft w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon name="History" size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Historial de Graduaciones
              </h2>
              <p className="text-sm text-muted-foreground">
                Cliente: {customer?.nombre}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              iconName="Plus"
              onClick={() => {
                if (editingGraduacion) {
                  handleCancelEdit();
                } else {
                  setShowAddForm(!showAddForm);
                }
              }}
            >
              {editingGraduacion ? 'Cancelar Edición' : 'Nueva Graduación'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconName="X"
              onClick={onClose}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add New Graduation Form */}
          {showAddForm && (
            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-foreground mb-4 flex items-center">
                <Icon name={editingGraduacion ? "Edit" : "Plus"} size={18} className="mr-2" />
                {editingGraduacion ? 'Editar Graduación' : 'Agregar Nueva Graduación'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  label="Graduación OD (Ojo Derecho)"
                  type="text"
                  value={newGraduacion.graduacion_od}
                  onChange={(e) => setNewGraduacion(prev => ({
                    ...prev,
                    graduacion_od: e.target.value
                  }))}
                  placeholder="Ej: -2.50"
                />
                <Input
                  label="Graduación OI (Ojo Izquierdo)"
                  type="text"
                  value={newGraduacion.graduacion_oi}
                  onChange={(e) => setNewGraduacion(prev => ({
                    ...prev,
                    graduacion_oi: e.target.value
                  }))}
                  placeholder="Ej: -1.75"
                />
                <Input
                  label="Graduación ADD (Adición)"
                  type="text"
                  value={newGraduacion.graduacion_add}
                  onChange={(e) => setNewGraduacion(prev => ({
                    ...prev,
                    graduacion_add: e.target.value
                  }))}
                  placeholder="Ej: +1.25"
                />
                <Input
                  label="DIP (Distancia Interpupilar)"
                  type="text"
                  value={newGraduacion.dip}
                  onChange={(e) => setNewGraduacion(prev => ({
                    ...prev,
                    dip: e.target.value
                  }))}
                  placeholder="Ej: 62mm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="md:col-span-2">
                  <Select
                    label="Atendido por"
                    value={newGraduacion.creado_por_id}
                    onChange={(value) => setNewGraduacion(prev => ({
                      ...prev,
                      creado_por_id: value
                    }))}
                    options={users?.map(user => ({
                      value: user?.id,
                      label: user?.nombre ? `${user.nombre} ${user.apellido || ''}`.trim() : `Usuario ${user?.id}`
                    }))}
                    placeholder="Seleccione el empleado que atendió al cliente"
                    searchable
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <Input
                  label="Observaciones"
                  type="text"
                  value={newGraduacion.observaciones}
                  onChange={(e) => setNewGraduacion(prev => ({
                    ...prev,
                    observaciones: e.target.value
                  }))}
                  placeholder="Observaciones adicionales (opcional)"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={editingGraduacion ? handleCancelEdit : () => setShowAddForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={editingGraduacion ? handleUpdateGraduacion : handleAddGraduacion}
                  iconName="Save"
                >
                  {editingGraduacion ? 'Actualizar Graduación' : 'Guardar Graduación'}
                </Button>
              </div>
            </div>
          )}

          {/* History List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando historial...</p>
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="Eye" size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No hay graduaciones registradas</h3>
              <p className="text-muted-foreground">Las graduaciones aparecerán aquí una vez que sean registradas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historial.map((graduacion, index) => (
                <div key={graduacion.id} className="bg-background border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">#{historial.length - index}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-foreground">
                          Consulta del {formatDate(graduacion.fecha_consulta)}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Registrado por: {graduacion.usuarios ? 
                            `${graduacion.usuarios.nombre} ${graduacion.usuarios.apellido || ''}`.trim() : 
                            'Usuario desconocido'
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Edit"
                      onClick={() => handleEditGraduacion(graduacion)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      Editar
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <span className="text-xs text-muted-foreground">OD (Ojo Derecho)</span>
                      <p className="text-sm font-medium text-foreground">{graduacion.graduacion_od || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">OI (Ojo Izquierdo)</span>
                      <p className="text-sm font-medium text-foreground">{graduacion.graduacion_oi || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">ADD (Adición)</span>
                      <p className="text-sm font-medium text-foreground">{graduacion.graduacion_add || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">DIP</span>
                      <p className="text-sm font-medium text-foreground">{graduacion.dip || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {graduacion.observaciones && (
                    <div>
                      <span className="text-xs text-muted-foreground">Observaciones</span>
                      <p className="text-sm text-foreground">{graduacion.observaciones}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HistorialGraduacionesModal;
