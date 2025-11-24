import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Calendar, ArrowLeft, Save, Edit, Eye, Package } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import { campaignService } from '../../services/campaignService';
import { empresaService } from '../../services/empresaService';
import { useAuth } from '../../contexts/AuthContext';
import SendProductsModal from './components/SendProductsModal';
import CampaignProductsTable from './components/CampaignProductsTable';

const CampaignForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [campaign, setCampaign] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [sendProductsModalOpen, setSendProductsModalOpen] = useState(false);

  const isEditMode = location.pathname.includes('/edit');
  const isViewMode = Boolean(id) && !isEditMode;

  // Cargar campaña si estamos editando o viendo
  useEffect(() => {
    if (isEditMode || isViewMode) {
      loadCampaign();
    }
  }, [id, isEditMode, isViewMode]);

  // Cargar empresas al montar el componente
  useEffect(() => {
    loadEmpresas();
  }, []);

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

  const loadCampaign = async () => {
    try {
      setLoadingCampaign(true);
      const result = await campaignService.getCampaign(id);
      
      if (result.error) {
        toast.error(`Error al cargar campaña: ${result.error}`);
        navigate('/campaign-management');
      } else {
        setCampaign(result.data);
      }
    } catch (error) {
      toast.error('Error inesperado al cargar campaña');
      console.error('Error:', error);
      navigate('/campaign-management');
    } finally {
      setLoadingCampaign(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      setLoading(true);
      
      let result;
      if (isEditMode) {
        result = await campaignService.updateCampaign(id, formData);
      } else {
        // Agregar el ID del usuario que crea la campaña
        const campaignData = {
          ...formData,
          creado_por_id: userProfile?.id
        };
        result = await campaignService.createCampaign(campaignData);
      }

      if (result.error) {
        toast.error(`Error al guardar campaña: ${result.error}`);
      } else {
        toast.success(
          isEditMode 
            ? 'Campaña actualizada exitosamente' 
            : 'Campaña creada exitosamente'
        );
        navigate('/campaign-management');
      }
    } catch (error) {
      toast.error('Error inesperado al guardar campaña');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingCampaign) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando campaña...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">
                {isViewMode ? 'Ver Campaña' : isEditMode ? 'Editar Campaña' : 'Nueva Campaña'}
              </h1>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate('/campaign-management')}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Campañas
            </Button>
          </div>
          <p className="text-gray-600">
            {isViewMode 
              ? 'Visualiza la información completa de la campaña' 
              : isEditMode 
                ? 'Modifica la información de la campaña' 
                : 'Crea una nueva campaña empresarial para enviar armazones'
            }
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Información de la Campaña
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Completa los datos básicos de la campaña empresarial
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData);
              handleSave(data);
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre de la campaña */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Campaña *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    defaultValue={campaign?.nombre || ''}
                    required={!isViewMode}
                    readOnly={isViewMode}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isViewMode ? 'bg-gray-50' : ''}`}
                    placeholder="Ej: Campaña Empresarial Q1 2025"
                  />
                </div>

                {/* Empresa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa *
                  </label>
                  {isViewMode ? (
                    <div className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-900`}>
                      {campaign?.empresa || 'No especificada'}
                    </div>
                  ) : (
                    <select
                      name="empresa"
                      defaultValue={campaign?.empresa || ''}
                      required={!isViewMode}
                      disabled={loadingEmpresas}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{loadingEmpresas ? 'Cargando empresas...' : 'Selecciona una empresa'}</option>
                      {empresas.map((empresa) => (
                        <option key={empresa.id} value={empresa.nombre}>
                          {empresa.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Fecha de inicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    defaultValue={campaign?.fecha_inicio || ''}
                    required={!isViewMode}
                    readOnly={isViewMode}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isViewMode ? 'bg-gray-50' : ''}`}
                  />
                </div>

                {/* Fecha de fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin *
                  </label>
                  <input
                    type="date"
                    name="fecha_fin"
                    defaultValue={campaign?.fecha_fin || ''}
                    required={!isViewMode}
                    readOnly={isViewMode}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isViewMode ? 'bg-gray-50' : ''}`}
                  />
                </div>

                {/* Ubicación */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    name="ubicacion"
                    defaultValue={campaign?.ubicacion || ''}
                    readOnly={isViewMode}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isViewMode ? 'bg-gray-50' : ''}`}
                    placeholder="Ej: Oficinas Centrales, Zona Norte"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  {isViewMode ? (
                    <div className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-900`}>
                      {campaign?.estado === 'activa' && 'Activa'}
                      {campaign?.estado === 'finalizada' && 'Finalizada'}
                      {campaign?.estado === 'cancelada' && 'Cancelada'}
                      {!campaign?.estado && 'No especificado'}
                    </div>
                  ) : (
                    <select
                      name="estado"
                      defaultValue={campaign?.estado || 'activa'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="activa">Activa</option>
                      <option value="finalizada">Finalizada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  defaultValue={campaign?.observaciones || ''}
                  rows={4}
                  readOnly={isViewMode}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isViewMode ? 'bg-gray-50' : ''}`}
                  placeholder="Información adicional sobre la campaña..."
                />
              </div>

              {/* Información adicional */}
              {isViewMode ? (
                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Información del Sistema:
                  </h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    {campaign?.created_at && (
                      <p><strong>Fecha de creación:</strong> {new Date(campaign.created_at).toLocaleString('es-ES')}</p>
                    )}
                    {campaign?.updated_at && campaign.updated_at !== campaign.created_at && (
                      <p><strong>Última actualización:</strong> {new Date(campaign.updated_at).toLocaleString('es-ES')}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">
                    Información Importante:
                  </h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Una vez creada la campaña, podrás enviar armazones desde el inventario</li>
                    <li>• El estado "Activa" permite enviar productos</li>
                    <li>• Las fechas ayudan a organizar y planificar las campañas</li>
                  </ul>
                </div>
              )}

              {/* Botones de acción */}
              <div className="mt-8 flex items-center justify-between">
                <div></div>
                
                <div className="flex items-center space-x-3">
                  {isViewMode ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/campaign-management')}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                      </Button>
                      <Button
                        type="button"
                        onClick={() => navigate(`/campaigns/${id}/edit`)}
                        className="flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Campaña
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/campaign-management')}
                        disabled={loading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex items-center"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Campaña' : 'Crear Campaña')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Tabla de productos enviados (solo en modo vista) */}
        {isViewMode && campaign && (
          <div className="mt-8">
            <CampaignProductsTable campaign={campaign} />
          </div>
        )}

        
      </div>
      </div>
    </div>
  );
};

export default CampaignForm;
