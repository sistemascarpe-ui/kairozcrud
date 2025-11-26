import React, { useState, useEffect } from 'react';
import { Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';

import Header from '../../components/ui/Header';
import { inventoryService } from '../../services/inventoryService';
import ProductFilters from '../inventory-management/components/ProductFilters';
import ProductTable from '../inventory-management/components/ProductTable';
import NewSalesModal from '../../components/NewSalesModal';
import SalesTable from '../sales-management/components/SalesTable';
import { salesService } from '../../services/salesService';
import { useOptimizedCampaignSales, useCampaignSalesCount } from '../../hooks/useOptimizedSales';
import { empresaService } from '../../services/empresaService';
import { campaignService } from '../../services/campaignService';
import { useAuth } from '../../contexts/AuthContext';

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
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [salesModalLoading, setSalesModalLoading] = useState(false);
  const [salesPage, setSalesPage] = useState(1);
  const [salesPerPage] = useState(20);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [empresaOptions, setEmpresaOptions] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [campaignOptions, setCampaignOptions] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const { userProfile, user } = useAuth();
  const [newCampaignForm, setNewCampaignForm] = useState({ nombre: '', identificador: '', empresa: '', fecha_inicio: '', fecha_fin: '', ubicacion: '', estado: 'activa', observaciones: '' });

  const { data: campaignSalesData, error: campaignSalesError, isLoading: campaignSalesLoading, refetch: refetchCampaignSales } = useOptimizedCampaignSales(salesPage, salesPerPage);
  const { data: campaignSalesCount } = useCampaignSalesCount();

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
        setLoadingEmpresas(true);
        const empresasResult = await empresaService.getEmpresas();
        if (!empresasResult?.error) setEmpresaOptions(empresasResult?.data || []);
        setLoadingEmpresas(false);
        const activeCampaigns = await campaignService.getActiveCampaigns();
        if (!activeCampaigns?.error) setCampaignOptions(activeCampaigns?.data || []);
        setCampaignsLoading(true);
        const allCampaigns = await campaignService.getCampaigns();
        if (!allCampaigns?.error) setCampaigns(allCampaigns?.data || []);
        setCampaignsLoading(false);
      } catch (error) {
        toast.error('Error inesperado al cargar productos');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedBrand, selectedGroup, selectedDescription, selectedSubBrand, selectedStockStatus, sortConfig]);

  const handleCreateCampaignSale = () => {
    setSelectedSale(null);
    setIsSalesModalOpen(true);
  };

  const handleCancelCampaignSale = async (sale) => {
    try {
      const ok = window.confirm('¿Cancelar esta venta y reponer stock de armazones?');
      if (!ok) return;
      const { error, restoredStock, restoredCount } = await salesService.updateCampaignSalesNote(sale.id, { estado: 'cancelada' });
      if (error) {
        toast.error(`Error al cancelar: ${error}`);
      } else {
        toast.success(`Venta cancelada. ${restoredStock ? `Stock repuesto para ${restoredCount} armazón(es).` : ''}`);
        refetchCampaignSales();
      }
    } catch (e) {
      toast.error(`Error inesperado: ${e.message || 'Error'}`);
    }
  };

  const handleSaveCampaignSale = async (salesData) => {
    try {
      setSalesModalLoading(true);
      const result = await salesService.createCampaignSalesNote({ ...salesData, campana_id: selectedCampaignId || null });
      if (result.error) {
        toast.error(`Error al crear la venta: ${result.error}`);
        return;
      }
      toast.success('Venta de campaña creada correctamente');
      setIsSalesModalOpen(false);
      refetchCampaignSales();
    } catch (error) {
      toast.error(`Error al guardar la venta: ${error.message || 'Error'}`);
    } finally {
      setSalesModalLoading(false);
    }
  };

  const handleCreateCampaignChange = (name, value) => {
    setNewCampaignForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCampaignSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...newCampaignForm };
      const result = await campaignService.createCampaign(data);
      if (result.error) {
        toast.error(`Error al crear campaña: ${result.error}`);
        return;
      }
      toast.success('Campaña creada exitosamente');
      setNewCampaignForm({ nombre: '', identificador: '', empresa: '', fecha_inicio: '', fecha_fin: '', ubicacion: '', estado: 'activa', observaciones: '' });
      const activeCampaigns = await campaignService.getActiveCampaigns();
      if (!activeCampaigns?.error) setCampaignOptions(activeCampaigns?.data || []);
      setActiveTab('inventario');
    } catch (error) {
      toast.error(`Error inesperado: ${error.message || 'Error'}`);
    }
  };

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
                  onClick={() => setActiveTab('campanas')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold border ${activeTab === 'campanas' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-700 border-purple-300'}`}
                >
                  Campañas
                </button>
                <button
                  onClick={() => setActiveTab('resumen')}
                  className={`px-4 py-2 rounded-md text-sm font-semibold border ${activeTab === 'resumen' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-700 border-purple-300'}`}
                >
                  Resumen
                </button>
              <button
                onClick={() => setActiveTab('ventas')}
                className={`px-4 py-2 rounded-md text-sm font-semibold border ${activeTab === 'ventas' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-700 border-purple-300'}`}
              >
                Ventas
              </button>
              <button
                onClick={() => setActiveTab('nueva')}
                className={`px-4 py-2 rounded-md text-sm font-semibold border ${activeTab === 'nueva' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-700 border-purple-300'}`}
              >
                Nueva Campaña
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
          ) : activeTab === 'resumen' ? (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-purple-200 p-8 text-center">
              <p className="text-purple-800 font-semibold">Próximamente</p>
              <p className="text-purple-600 text-sm">Aquí podrás ver más páginas del módulo de Campañas.</p>
            </div>
          ) : activeTab === 'campanas' ? (
            <div className="mt-6">
              <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-4">
                {campaignsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-sm text-purple-700">Cargando campañas...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-purple-200">
                      <thead className="bg-purple-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800">Nombre</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800">Identificador</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800">Empresa</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800">Fechas</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-purple-100">
                        {([...campaigns].sort((a,b) => {
                          const aActive = a?.estado === 'activa';
                          const bActive = b?.estado === 'activa';
                          if (aActive && !bActive) return -1;
                          if (!aActive && bActive) return 1;
                          const ad = new Date(a?.created_at || 0).getTime();
                          const bd = new Date(b?.created_at || 0).getTime();
                          return bd - ad;
                        })).map(c => (
                          <tr key={c.id} className="hover:bg-purple-50">
                            <td className="px-4 py-3 text-sm text-purple-900">{c.nombre}</td>
                            <td className="px-4 py-3 text-sm text-purple-700">{c.identificador || '-'}</td>
                            <td className="px-4 py-3 text-sm text-purple-700">{c.empresa || '-'}</td>
                            <td className="px-4 py-3 text-sm text-purple-700">{c.fecha_inicio} → {c.fecha_fin}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${c.estado === 'activa' ? 'bg-purple-100 text-purple-800 border border-purple-200' : c.estado === 'finalizada' ? 'bg-gray-100 text-gray-700 border border-gray-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>{c.estado || '---'}</span>
                            </td>
                          </tr>
                        ))}
                        {campaigns.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-sm text-purple-700">Sin campañas</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'ventas' ? (
            <div className="mt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-purple-900">Ventas de Campaña</h2>
                <button
                  onClick={handleCreateCampaignSale}
                  className="px-4 py-2 rounded-md text-sm font-semibold bg-purple-600 text-white border border-purple-600"
                >
                  Nueva Venta
                </button>
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium text-purple-800 mb-2 block">Campaña</label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Sin campaña específica</option>
                  {campaignOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-4">
                {campaignSalesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-sm text-purple-700">Cargando ventas...</p>
                  </div>
                ) : campaignSalesError ? (
                  <div className="text-center py-8 text-red-600">{campaignSalesError}</div>
                ) : (
                  <SalesTable
                    sales={campaignSalesData?.data || []}
                    onEdit={() => {}}
                    onCancel={handleCancelCampaignSale}
                    loading={false}
                  />
                )}
              </div>
              <NewSalesModal
                isOpen={isSalesModalOpen}
                onClose={() => setIsSalesModalOpen(false)}
                onSave={handleSaveCampaignSale}
                sale={selectedSale}
                loading={salesModalLoading}
                locationFilter="campana"
              />
            </div>
          ) : (
            <div className="mt-6">
              <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-6">
                <h2 className="text-xl font-bold text-purple-900 mb-4">Crear Nueva Campaña</h2>
                <form onSubmit={handleCreateCampaignSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-purple-800 mb-1 block">Nombre *</label>
                      <input type="text" value={newCampaignForm.nombre} onChange={(e) => handleCreateCampaignChange('nombre', e.target.value)} required className="w-full px-3 py-2 border border-purple-300 rounded-md" placeholder="Ej: Campaña Empresarial" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-purple-800 mb-1 block">Identificador</label>
                      <input type="text" value={newCampaignForm.identificador} onChange={(e) => handleCreateCampaignChange('identificador', e.target.value)} className="w-full px-3 py-2 border border-purple-300 rounded-md" placeholder="Ej: SUTES 2025 Noviembre" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-purple-800 mb-1 block">Empresa *</label>
                      <select value={newCampaignForm.empresa} onChange={(e) => handleCreateCampaignChange('empresa', e.target.value)} required className="w-full px-3 py-2 border border-purple-300 rounded-md">
                        <option value="">{loadingEmpresas ? 'Cargando...' : 'Selecciona empresa'}</option>
                        {empresaOptions.map(emp => (<option key={emp.id} value={emp.nombre}>{emp.nombre}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-purple-800 mb-1 block">Ubicación</label>
                      <input type="text" value={newCampaignForm.ubicacion} onChange={(e) => handleCreateCampaignChange('ubicacion', e.target.value)} className="w-full px-3 py-2 border border-purple-300 rounded-md" placeholder="Ej: Oficinas Centrales" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-purple-800 mb-1 block">Fecha Inicio *</label>
                      <input type="date" value={newCampaignForm.fecha_inicio} onChange={(e) => handleCreateCampaignChange('fecha_inicio', e.target.value)} required className="w-full px-3 py-2 border border-purple-300 rounded-md" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-purple-800 mb-1 block">Fecha Fin *</label>
                      <input type="date" value={newCampaignForm.fecha_fin} onChange={(e) => handleCreateCampaignChange('fecha_fin', e.target.value)} required className="w-full px-3 py-2 border border-purple-300 rounded-md" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-purple-800 mb-1 block">Estado</label>
                    <select value={newCampaignForm.estado} onChange={(e) => handleCreateCampaignChange('estado', e.target.value)} className="w-full px-3 py-2 border border-purple-300 rounded-md">
                      <option value="activa">Activa</option>
                      <option value="finalizada">Finalizada</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-purple-800 mb-1 block">Observaciones</label>
                    <textarea value={newCampaignForm.observaciones} onChange={(e) => handleCreateCampaignChange('observaciones', e.target.value)} rows={3} className="w-full px-3 py-2 border border-purple-300 rounded-md" placeholder="Detalles adicionales" />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="px-4 py-2 rounded-md text-sm font-semibold bg-purple-600 text-white border border-purple-600">Crear Campaña</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignManagement;
