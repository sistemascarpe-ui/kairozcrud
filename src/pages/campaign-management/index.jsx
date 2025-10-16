import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Package, Plus, ArrowLeft, Eye, Edit, Trash2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../components/ui/Button';
import Header from '../../components/ui/Header';
import { campaignService } from '../../services/campaignService';
import { useAuth } from '../../contexts/AuthContext';
import CampaignMembersModal from './components/CampaignMembersModal';

const CampaignManagement = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [membersCount, setMembersCount] = useState({});

  // Cargar campañas al montar el componente
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const result = await campaignService.getCampaigns();
      
      if (result.error) {
        toast.error(`Error al cargar campañas: ${result.error}`);
      } else {
        const campaignsData = result.data || [];
        setCampaigns(campaignsData);
        
        // Cargar conteo de miembros para cada campaña
        const counts = {};
        for (const campaign of campaignsData) {
          const countResult = await campaignService.getCampaignMembersCount(campaign.id);
          counts[campaign.id] = countResult.count || 0;
        }
        setMembersCount(counts);
      }
    } catch (error) {
      toast.error('Error inesperado al cargar campañas');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaign) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la campaña "${campaign.nombre}"?`)) {
      try {
        const result = await campaignService.deleteCampaign(campaign.id);
        
        if (result.error) {
          toast.error(`Error al eliminar campaña: ${result.error}`);
        } else {
          toast.success('Campaña eliminada exitosamente');
          loadCampaigns(); // Recargar la lista
        }
      } catch (error) {
        toast.error('Error inesperado al eliminar campaña');
        console.error('Error:', error);
      }
    }
  };

  const handleOpenMembersModal = (campaign) => {
    setSelectedCampaign(campaign);
    setMembersModalOpen(true);
  };

  const handleMembersUpdated = async () => {
    // Recargar conteo de miembros cuando se actualice el modal
    if (selectedCampaign) {
      const countResult = await campaignService.getCampaignMembersCount(selectedCampaign.id);
      setMembersCount(prev => ({
        ...prev,
        [selectedCampaign.id]: countResult.count || 0
      }));
    }
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'activa':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'finalizada':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (estado) => {
    switch (estado) {
      case 'activa':
        return 'Activa';
      case 'finalizada':
        return 'Finalizada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return estado;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando campañas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Campañas</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => navigate('/campaigns/new')}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva Campaña
              </Button>
            </div>
          </div>
          <p className="text-gray-600">
            Administra las campañas empresariales y el envío de armazones a empresas.
          </p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Campañas</p>
                <p className="text-2xl font-semibold text-gray-900">{campaigns.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Campañas Activas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {campaigns.filter(c => c.estado === 'activa').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Empresas Únicas</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {new Set(campaigns.map(c => c.empresa)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de campañas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Campañas</h2>
          </div>
          
          {campaigns.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay campañas registradas
              </h3>
              <p className="text-gray-500 mb-6">
                Comienza creando tu primera campaña empresarial
              </p>
              <Button
                onClick={() => navigate('/campaigns/new')}
                className="flex items-center mx-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Campaña
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaña
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fechas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Miembros
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {campaign.nombre}
                          </div>
                          {campaign.observaciones && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {campaign.observaciones}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{campaign.empresa}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div>{formatDate(campaign.fecha_inicio)}</div>
                          <div className="text-gray-500">hasta {formatDate(campaign.fecha_fin)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(campaign.estado)}`}>
                          {getStatusText(campaign.estado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {membersCount[campaign.id] || 0} miembros
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenMembersModal(campaign)}
                            className="flex items-center text-blue-600 hover:text-blue-700"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Gestionar
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.ubicacion || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            iconName="Eye"
                            onClick={() => navigate(`/campaigns/${campaign.id}`)}
                          >
                            Ver
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            iconName="Edit"
                            onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            iconName="Trash2"
                            onClick={() => handleDeleteCampaign(campaign)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de miembros */}
        <CampaignMembersModal
          isOpen={membersModalOpen}
          onClose={() => {
            setMembersModalOpen(false);
            setSelectedCampaign(null);
          }}
          campaign={selectedCampaign}
          onMembersUpdated={handleMembersUpdated}
        />
      </div>
      </div>
    </div>
  );
};

export default CampaignManagement;
