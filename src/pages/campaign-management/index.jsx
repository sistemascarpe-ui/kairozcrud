import React, { useState, useEffect } from 'react';
import { Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';

import Header from '../../components/ui/Header';
import { inventoryService } from '../../services/inventoryService';
import ProductFilters from '../inventory-management/components/ProductFilters';
import ProductTable from '../inventory-management/components/ProductTable';

const CampaignManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('inventario');
  const [brands, setBrands] = useState([]);
  const [groups, setGroups] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [subBrands, setSubBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDescription, setSelectedDescription] = useState('');
  const [selectedSubBrand, setSelectedSubBrand] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('');
  const sortConfigDefault = { key: 'created_at', direction: 'desc' };
  const [sortConfig, setSortConfig] = useState(sortConfigDefault);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [brandsResult, groupsResult, descriptionsResult, subBrandsResult] = await Promise.all([
          inventoryService.getBrands(),
          inventoryService.getGroups(),
          inventoryService.getDescriptions(),
          inventoryService.getSubBrands()
        ]);
        if (!brandsResult?.error) setBrands(brandsResult?.data || []);
        if (!groupsResult?.error) setGroups(groupsResult?.data || []);
        if (!descriptionsResult?.error) setDescriptions(descriptionsResult?.data || []);
        if (!subBrandsResult?.error) setSubBrands(subBrandsResult?.data || []);

        const result = await inventoryService.getProductsSummary(1000, 0, { 
          location: 'campana',
          brandId: selectedBrand || undefined,
          groupId: selectedGroup || undefined,
          descriptionId: selectedDescription || undefined,
          subBrandId: selectedSubBrand || undefined,
          stockStatus: selectedStockStatus || undefined
        }, { key: sortConfig?.key === 'price' ? 'precio' : sortConfig?.key === 'stock' ? 'stock' : 'created_at', direction: sortConfig?.direction || 'desc' });
        if (result.error) {
          toast.error(`Error al cargar productos: ${result.error}`);
        } else {
          setProducts(result.data || []);
        }
      } catch (error) {
        toast.error('Error inesperado al cargar productos');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedBrand, selectedGroup, selectedDescription, selectedSubBrand, selectedStockStatus, sortConfig]);

  const filteredProducts = products.filter(p =>
    p?.sku?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    p?.color?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    (p?.marcas?.nombre || '')?.toLowerCase()?.includes(searchTerm.toLowerCase())
  );
  const totalProducts = filteredProducts.length;
  const totalUnits = filteredProducts.reduce((sum, p) => sum + (parseInt(p?.stock) || 0), 0);

  const transformedProducts = React.useMemo(() => {
    return (filteredProducts || []).map(product => {
      const brand = product?.marcas?.nombre || (Array.isArray(product?.marcas) ? product?.marcas[0]?.nombre : null) || 'Sin marca';
      const category = product?.grupos?.nombre || (Array.isArray(product?.grupos) ? product?.grupos[0]?.nombre : null) || 'Sin categoría';
      const supplier = product?.sub_marcas?.nombre || (Array.isArray(product?.sub_marcas) ? product?.sub_marcas[0]?.nombre : null) || 'Sin sub marca';
      const description = product?.descripciones?.nombre || (Array.isArray(product?.descripciones) ? product?.descripciones[0]?.nombre : null) || 'Sin descripción';
      const createdBy = product?.usuarios ? `${product?.usuarios?.nombre} ${product?.usuarios?.apellido || ''}`.trim() : 'No especificado';
      return {
        id: product?.id,
        sku: product?.sku || '',
        brand,
        category,
        supplier,
        description,
        price: parseFloat(product?.precio || 0),
        stock: parseInt(product?.stock || 0),
        color: product?.color || '',
        createdBy,
        location: 'campana'
      };
    });
  }, [filteredProducts]);

  

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
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-purple-600 mr-3" />
                <h1 className="text-3xl font-bold text-purple-900">Productos en Campaña</h1>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('inventario')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold border ${activeTab === 'inventario' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-700 border-purple-300'}`}
                >
                  Inventario
                </button>
                <button
                  onClick={() => setActiveTab('resumen')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold border ${activeTab === 'resumen' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-700 border-purple-300'}`}
                >
                  Resumen
                </button>
              </div>
            </div>
            <p className="text-purple-700">Lista de armazones cuya ubicación en inventario es "Campaña".</p>
          </div>

          {activeTab === 'inventario' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6">
                <p className="text-sm font-medium text-purple-700">Productos</p>
                <p className="text-2xl font-semibold text-purple-900">{totalProducts}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6">
                <p className="text-sm font-medium text-purple-700">Unidades Totales</p>
                <p className="text-2xl font-semibold text-purple-900">{totalUnits}</p>
              </div>
            </div>
          )}

          {activeTab === 'inventario' && (
            <ProductFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedBrand={selectedBrand}
              onBrandChange={setSelectedBrand}
              selectedGroup={selectedGroup}
              onGroupChange={setSelectedGroup}
              selectedDescription={selectedDescription}
              onDescriptionChange={setSelectedDescription}
              selectedSubBrand={selectedSubBrand}
              onSubBrandChange={setSelectedSubBrand}
              selectedStockStatus={selectedStockStatus}
              onStockStatusChange={setSelectedStockStatus}
              selectedLocation={''}
              onLocationChange={() => {}}
              showLocation={false}
              theme="purple"
              brands={brands}
              groups={groups}
              descriptions={descriptions}
              subBrands={subBrands}
              resultCount={totalProducts}
              totalUnits={totalUnits}
            />
          )}

          {activeTab === 'inventario' ? (
            <div className="mt-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                  <p className="text-sm text-purple-700">Cargando productos...</p>
                </div>
              ) : (
                <ProductTable
                  products={transformedProducts}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  sortConfig={sortConfig}
                  onSort={setSortConfig}
                  showActions={false}
                  hideCreatedBy={true}
                />
              )}
            </div>
          ) : (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-purple-200 p-8 text-center">
              <p className="text-purple-800 font-semibold">Próximamente</p>
              <p className="text-purple-600 text-sm">Aquí podrás ver más páginas del módulo de Campañas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignManagement;
