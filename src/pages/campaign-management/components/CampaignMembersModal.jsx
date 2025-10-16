import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserMinus, Crown, User } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { campaignService } from '../../../services/campaignService';
import { userService } from '../../../services/userService';
import { useAuth } from '../../../contexts/AuthContext';

const CampaignMembersModal = ({ isOpen, onClose, campaign, onMembersUpdated }) => {
  const { userProfile } = useAuth();
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('miembro');

  // Cargar miembros y usuarios cuando se abre el modal
  useEffect(() => {
    if (isOpen && campaign) {
      loadMembers();
      loadUsers();
    }
  }, [isOpen, campaign]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const result = await campaignService.getCampaignMembers(campaign.id);
      
      if (result.error) {
        toast.error(`Error al cargar miembros: ${result.error}`);
      } else {
        setMembers(result.data || []);
      }
    } catch (error) {
      toast.error('Error inesperado al cargar miembros');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const result = await userService.getUsers();
      
      if (result.error) {
        toast.error(`Error al cargar usuarios: ${result.error}`);
      } else {
        setUsers(result.data || []);
      }
    } catch (error) {
      toast.error('Error inesperado al cargar usuarios');
      console.error('Error:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) {
      toast.error('Por favor selecciona un usuario');
      return;
    }

    try {
      const result = await campaignService.addMemberToCampaign(
        campaign.id,
        selectedUser,
        userProfile?.id,
        selectedRole
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Miembro agregado exitosamente');
        setSelectedUser('');
        setSelectedRole('miembro');
        loadMembers(); // Recargar la lista
        onMembersUpdated?.(); // Notificar al componente padre
      }
    } catch (error) {
      toast.error('Error inesperado al agregar miembro');
      console.error('Error:', error);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('¿Estás seguro de que deseas remover este miembro de la campaña?')) {
      try {
        const result = await campaignService.removeMemberFromCampaign(campaign.id, userId);

        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Miembro removido exitosamente');
          loadMembers(); // Recargar la lista
          onMembersUpdated?.(); // Notificar al componente padre
        }
      } catch (error) {
        toast.error('Error inesperado al remover miembro');
        console.error('Error:', error);
      }
    }
  };

  const getRoleIcon = (role) => {
    return role === 'coordinador' ? <Crown className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const getRoleColor = (role) => {
    return role === 'coordinador' 
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  // Filtrar usuarios que ya están en la campaña
  const availableUsers = users.filter(user => 
    !members.some(member => member.usuario_id === user.id)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            Miembros de la Campaña
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Información de la campaña */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900">{campaign?.nombre}</h3>
              <p className="text-sm text-gray-600">{campaign?.empresa}</p>
            </div>

            {/* Agregar nuevo miembro */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                Agregar Miembro
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select
                  value={selectedUser}
                  onChange={setSelectedUser}
                  options={availableUsers.map(user => ({
                    value: user.id,
                    label: `${user.nombre} ${user.apellido || ''}`.trim()
                  }))}
                  placeholder="Selecciona un usuario"
                  loading={loadingUsers}
                />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="miembro">Miembro</option>
                  <option value="coordinador">Coordinador</option>
                </select>
              </div>
              <div className="mt-3">
                <Button
                  onClick={handleAddMember}
                  disabled={!selectedUser || loading}
                  size="sm"
                  className="flex items-center"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar Miembro
                </Button>
              </div>
            </div>

            {/* Lista de miembros */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Miembros Actuales ({members.length})
              </h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Cargando miembros...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No hay miembros asignados a esta campaña</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getRoleColor(member.rol)}`}>
                          {getRoleIcon(member.rol)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {`${member.usuario?.nombre} ${member.usuario?.apellido || ''}`.trim()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Agregado el {new Date(member.created_at).toLocaleDateString('es-ES')}
                            {member.asignado_por && (
                              <span className="ml-2">
                                por {member.asignado_por.nombre} {member.asignado_por.apellido}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(member.rol)}`}>
                          {member.rol === 'coordinador' ? 'Coordinador' : 'Miembro'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.usuario_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Información adicional */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Información sobre Roles:
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-yellow-600" />
                  <strong>Coordinador:</strong> Puede gestionar productos y otros miembros
                </li>
                <li className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-600" />
                  <strong>Miembro:</strong> Puede ver y gestionar productos asignados
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CampaignMembersModal;
