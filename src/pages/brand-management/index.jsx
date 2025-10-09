import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import BrandTable from './components/BrandTable';
import BrandModal from './components/BrandModal';
import { brandService } from '../../services/brandService';

const BrandManagement = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data, error } = await brandService.getBrands();
        if (error) {
          setError(`Error loading brands: ${error}`);
        } else {
          setBrands(data || []);
        }
      } catch (err) {
        setError('Failed to load brand data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddBrand = () => {
    setModalMode('create');
    setSelectedBrand(null);
    setIsModalOpen(true);
  };

  const handleEditBrand = (brand) => {
    setModalMode('edit');
    setSelectedBrand(brand);
    setIsModalOpen(true);
  };

  const handleDeleteBrand = async (brand) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${brand.nombre}"?`)) {
      let result = await brandService.deleteBrand(brand.id);
      if (result.error) {
        toast.error(`Error al eliminar la marca: ${result.error}`);
        setError(`Error deleting brand: ${result.error}`);
      } else {
        toast.success(`Marca "${brand.nombre}" eliminada exitosamente`);
        setBrands(prev => prev.filter(b => b.id !== brand.id));
      }
    }
  };

  const handleSaveBrand = async (brandData) => {
    try {
      let result;
      if (modalMode === 'create') {
        result = await brandService.createBrand(brandData);
      } else if (modalMode === 'edit') {
        result = await brandService.updateBrand(selectedBrand.id, brandData);
      }

      if (result.error) {
        toast.error(`Error al guardar la marca: ${result.error}`);
      } else {
        const { data } = await brandService.getBrands();
        setBrands(data || []);
        setIsModalOpen(false);
        toast.success(`Marca ${modalMode === 'create' ? 'creada' : 'actualizada'} exitosamente`);
      }
    } catch (err) {
      toast.error('Error al guardar la marca');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando marcas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gestión de Marcas - Ópticas Kairoz</title>
        <meta name="description" content="Gestiona las marcas de los armazones" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <p>{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Gestión de Marcas</h1>
              <p className="text-muted-foreground mt-2">Añade, edita y elimina marcas de armazones.</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button iconName="Plus" onClick={handleAddBrand} size="lg">
                Agregar Marca
              </Button>
            </div>
          </div>

          <BrandTable
            brands={brands}
            onEdit={handleEditBrand}
            onDelete={handleDeleteBrand}
          />

          <BrandModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            brand={selectedBrand}
            onSave={handleSaveBrand}
            mode={modalMode}
          />
        </main>
      </div>
    </>
  );
};

export default BrandManagement;