import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { empresaService } from '../../services/empresaService';
import Header from '../../components/ui/Header';
import EmpresaTable from './components/EmpresaTable';
import EmpresaModal from './components/EmpresaModal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const EmpresaManagement = () => {
  const { user, userProfile } = useAuth();
  
  // State management
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' });
  const [isEmpresaModalOpen, setIsEmpresaModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit');
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [error, setError] = useState('');

  // Load empresas
  useEffect(() => {
    const loadEmpresas = async () => {
      setLoading(true);
      try {
        const empresaResult = await empresaService?.getEmpresas();
        if (empresaResult?.error) {
          setError(`Error loading empresas: ${empresaResult?.error}`);
        } else {
          setEmpresas(empresaResult?.data || []);
        }
      } catch (err) {
        setError('Failed to load empresas');
      } finally {
        setLoading(false);
      }
    };

    loadEmpresas();
  }, []);

  // Filter and sort empresas
  const filteredAndSortedEmpresas = useMemo(() => {
    let filtered = empresas?.filter(empresa => {
      const matchesName = !searchName || 
        empresa?.nombre?.toLowerCase()?.includes(searchName?.toLowerCase());
      
      return matchesName;
    });

    // Sort empresas
    filtered?.sort((a, b) => {
      let aValue = a?.[sortConfig?.key];
      let bValue = b?.[sortConfig?.key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig?.direction === 'asc' 
          ? aValue?.localeCompare(bValue)
          : bValue?.localeCompare(aValue);
      }

      if (sortConfig?.key === 'created_at') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return sortConfig?.direction === 'asc' 
          ? aDate - bDate
          : bDate - aDate;
      }

      return 0;
    });

    return filtered || [];
  }, [empresas, searchName, sortConfig]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchName('');
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev?.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEditEmpresa = (empresa) => {
    setModalMode('edit');
    setSelectedEmpresa(empresa);
    setIsEmpresaModalOpen(true);
  };

  const handleAddEmpresa = () => {
    setSelectedEmpresa(null);
    setModalMode('add');
    setIsEmpresaModalOpen(true);
  };

  const handleSaveEmpresa = async (empresaData) => {
    try {
      setError('');
      
      if (modalMode === 'add') {
        // Create new empresa
        const { data, error } = await empresaService.createEmpresa({
          nombre: empresaData.nombre
        });

        if (error) {
          toast.error(`Error al crear empresa: ${error}`);
          throw new Error(error);
        }

        // Reload empresas to show the new one
        const loadResult = await empresaService?.getEmpresas();
        if (loadResult?.data) {
          setEmpresas(loadResult.data);
        }
        
        toast.success('Empresa creada exitosamente');
        
      } else if (modalMode === 'edit') {
        // Update existing empresa
        const { data, error } = await empresaService.updateEmpresa(selectedEmpresa?.id, {
          nombre: empresaData.nombre
        });

        if (error) {
          toast.error(`Error al actualizar empresa: ${error}`);
          throw new Error(error);
        }

        // Reload empresas to show the updated data
        const loadResult = await empresaService?.getEmpresas();
        if (loadResult?.data) {
          setEmpresas(loadResult.data);
        }
        
        toast.success('Empresa actualizada exitosamente');
      }
      
      setIsEmpresaModalOpen(false);
      setSelectedEmpresa(null);
      
    } catch (error) {
      console.error('Error saving empresa:', error);
      if (!error.message.includes('Error al')) {
        toast.error(error?.message || 'Error al guardar la empresa');
      }
      setError(error?.message || 'Error al guardar la empresa');
    }
  };

  const handleDeleteEmpresa = async (empresa) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la empresa "${empresa.nombre}"?`)) {
      return;
    }

    try {
      setError('');
      
      const { error } = await empresaService.deleteEmpresa(empresa.id);

      if (error) {
        toast.error(`Error al eliminar empresa: ${error}`);
        throw new Error(error);
      }

      // Reload empresas to remove the deleted one
      const loadResult = await empresaService?.getEmpresas();
      if (loadResult?.data) {
        setEmpresas(loadResult.data);
      }
      
      toast.success('Empresa eliminada exitosamente');
      
    } catch (error) {
      console.error('Error deleting empresa:', error);
      if (!error.message.includes('Error al')) {
        toast.error(error?.message || 'Error al eliminar la empresa');
      }
      setError(error?.message || 'Error al eliminar la empresa');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gestión de Empresas - Ópticas Kairoz</title>
        <meta name="description" content="Administra empresas del sistema" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button 
                  onClick={() => setError('')}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Mostrando {filteredAndSortedEmpresas?.length} de {empresas?.length} empresas
            </p>
          </div>

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Gestión de Empresas
              </h1>
              <p className="text-muted-foreground mt-2">
                Administra las empresas del sistema para asociar con clientes
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                onClick={handleAddEmpresa}
                iconName="Plus"
                className="w-full sm:w-auto"
              >
                Agregar Empresa
              </Button>
            </div>
          </div>

          {/* Search Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filtros de Búsqueda</h3>
              <Button variant="ghost" onClick={clearAllFilters} className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
                <X className="h-4 w-4" />
                <span>Limpiar Filtros</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por nombre</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    type="text" 
                    placeholder="Nombre de la empresa..." 
                    value={searchName} 
                    onChange={(e) => setSearchName(e.target.value)} 
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Empresas Table */}
          <EmpresaTable
            empresas={filteredAndSortedEmpresas}
            onEditEmpresa={handleEditEmpresa}
            onDeleteEmpresa={handleDeleteEmpresa}
            onSort={handleSort}
            sortConfig={sortConfig}
          />

          {/* Empresa Modal */}
          <EmpresaModal
            isOpen={isEmpresaModalOpen}
            onClose={() => setIsEmpresaModalOpen(false)}
            empresa={selectedEmpresa}
            onSave={handleSaveEmpresa}
            mode={modalMode}
          />
        </main>
      </div>
    </>
  );
};

export default EmpresaManagement;
