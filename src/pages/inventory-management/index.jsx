import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import ProductTable from './components/ProductTable';
import ProductModal from './components/ProductModal';
import ProductFilters from './components/ProductFilters';
import { inventoryService } from '../../services/inventoryService';
import { useAuth } from '../../contexts/AuthContext';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';

const InventoryManagement = () => {
  const { user, userProfile } = useAuth();
  
  // State management
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [groups, setGroups] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [subBrands, setSubBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDescription, setSelectedDescription] = useState('');
  const [selectedSubBrand, setSelectedSubBrand] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50); // 50 productos por página

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [productsResult, brandsResult, groupsResult, descriptionsResult, subBrandsResult] = await Promise.all([
          inventoryService?.getProducts(),
          inventoryService?.getBrands(),
          inventoryService?.getGroups(),
          inventoryService?.getDescriptions(),
          inventoryService?.getSubBrands()
        ]);

        if (productsResult?.error) {
          setError(`Error loading products: ${productsResult?.error}`);
        } else {
          setProducts(productsResult?.data || []);
        }

        if (!brandsResult?.error) {
          setBrands(brandsResult?.data || []);
        }

        if (!groupsResult?.error) {
          setGroups(groupsResult?.data || []);
        }

        if (!descriptionsResult?.error) {
          setDescriptions(descriptionsResult?.data || []);
        }

        if (!subBrandsResult?.error) {
          setSubBrands(subBrandsResult?.data || []);
        }
      } catch (err) {
        setError('Failed to load inventory data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Sincronización en tiempo real para cambios en armazones
  useRealtimeSync(
    'armazones',
    // onUpdate - cuando se actualiza un armazón
    (newProduct, oldProduct) => {
      console.log('Armazón actualizado:', newProduct);
      setProducts(prev => prev.map(p => p.id === newProduct.id ? newProduct : p));
    },
    // onInsert - cuando se crea un nuevo armazón
    (newProduct) => {
      console.log('Nuevo armazón creado:', newProduct);
      setProducts(prev => [newProduct, ...prev]);
    },
    // onDelete - cuando se elimina un armazón
    (deletedProduct) => {
      console.log('Armazón eliminado:', deletedProduct);
      setProducts(prev => prev.filter(p => p.id !== deletedProduct.id));
    }
  );

  // Transform products for display
  const transformedProducts = useMemo(() => {
    return products?.map(product => {
      
      // Handle cases where relationships might be null or arrays
      const brand = product?.marcas?.nombre || (Array.isArray(product?.marcas) ? product?.marcas[0]?.nombre : null) || 'Sin marca';
      const category = product?.grupos?.nombre || (Array.isArray(product?.grupos) ? product?.grupos[0]?.nombre : null) || 'Sin categoría';
      const supplier = product?.sub_marcas?.nombre || (Array.isArray(product?.sub_marcas) ? product?.sub_marcas[0]?.nombre : null) || 'Sin sub marca';
      const description = product?.descripciones?.nombre || (Array.isArray(product?.descripciones) ? product?.descripciones[0]?.nombre : null) || 'Sin descripción';
      const createdBy = product?.usuarios ? `${product?.usuarios?.nombre} ${product?.usuarios?.apellido || ''}`.trim() : 'No especificado';
      
      // Detectar si el producto ha sido editado manualmente recientemente
      let hasBeenEdited = false;
      
      // Crear fechas para evitar errores de referencia
      const createdAt = new Date(product?.created_at);
      const updatedAt = new Date(product?.updated_at || product?.created_at);
      
      // Usar el campo editado_manualmente para determinar si fue editado
      if (product?.editado_manualmente) {
        const editadoAt = new Date(product.editado_manualmente);
        const now = new Date();
        const timeSinceEdit = now.getTime() - editadoAt.getTime();
        
        // Marcar como editado si fue editado manualmente en las últimas 24 horas
        hasBeenEdited = timeSinceEdit < 24 * 60 * 60 * 1000; // 24 horas
      }

      return {
        id: product?.id,
        sku: product?.sku || '',
        name: `${brand} ${product?.color || ''}`?.trim() || 'Producto sin nombre',
        brand: brand,
        category: category,
        supplier: supplier,
        description: description,
        price: parseFloat(product?.precio || 0),
        cost: parseFloat(product?.precio * 0.6 || 0), // Estimate cost as 60% of price
        stock: parseInt(product?.stock || 0),
        maxStock: 100, // Default maximum stock
        location: 'Almacén Principal', // Default location
        barcode: product?.sku || '',
        color: product?.color || '',
        createdAt: createdAt,
        updatedAt: updatedAt,
        hasBeenEdited: hasBeenEdited,
        createdBy: createdBy,
        cantidad_en_campanas: product?.cantidad_en_campanas || 0 // PRESERVAR esta propiedad
      };
    }) || [];
  }, [products]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = transformedProducts?.filter(product => {
      const matchesSearch = !searchTerm || 
        product?.sku?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        product?.brand?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
        product?.color?.toLowerCase()?.includes(searchTerm?.toLowerCase());

      // Find the original product to get the relationship IDs
      const originalProduct = products?.find(p => p?.id === product?.id);
      
      const matchesBrand = !selectedBrand || originalProduct?.marca_id?.toString() === selectedBrand?.toString();
      const matchesGroup = !selectedGroup || originalProduct?.grupo_id?.toString() === selectedGroup?.toString();
      const matchesDescription = !selectedDescription || originalProduct?.descripcion_id?.toString() === selectedDescription?.toString();
      const matchesSubBrand = !selectedSubBrand || originalProduct?.sub_marca_id?.toString() === selectedSubBrand?.toString();
      
      const matchesStockStatus = !selectedStockStatus || 
        (selectedStockStatus === 'in-stock' && product?.stock > 0) ||
        (selectedStockStatus === 'out-of-stock' && product?.stock === 0);

      return matchesSearch && matchesBrand && matchesGroup && matchesDescription && matchesSubBrand && matchesStockStatus;
    });

    // Sort products
    filtered?.sort((a, b) => {
      const aValue = a?.[sortConfig?.key];
      const bValue = b?.[sortConfig?.key];

      if (typeof aValue === 'string') {
        return sortConfig?.direction === 'asc' 
          ? aValue?.localeCompare(bValue)
          : bValue?.localeCompare(aValue);
      }

      if (typeof aValue === 'number') {
        return sortConfig?.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [transformedProducts, searchTerm, selectedBrand, selectedGroup, selectedDescription, selectedSubBrand, selectedStockStatus, sortConfig]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedProducts?.slice(startIndex, endIndex) || [];
  }, [filteredAndSortedProducts, currentPage, itemsPerPage]);

  // Pagination info
  const totalPages = Math.ceil((filteredAndSortedProducts?.length || 0) / itemsPerPage);
  const totalProducts = filteredAndSortedProducts?.length || 0;
  
  // Calculate total units (sum of all stock)
  const totalUnits = useMemo(() => {
    return filteredAndSortedProducts?.reduce((sum, product) => sum + (product?.stock || 0), 0) || 0;
  }, [filteredAndSortedProducts]);

  // Handlers
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBrand, selectedGroup, selectedDescription, selectedSubBrand, selectedStockStatus]);

  const handleAddProduct = () => {
    setModalMode('create');
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setModalMode('edit');
    // Find the original product data from the products array
    const originalProduct = products?.find(p => p?.id === product?.id);
    console.log('handleEditProduct - producto transformado:', product);
    console.log('handleEditProduct - producto original:', originalProduct);
    setSelectedProduct(originalProduct || product);
    setIsModalOpen(true);
  };

  const handleDuplicateProduct = (product) => {
    setModalMode('duplicate');
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (product, pin) => {
    try {
      // Usar el nuevo método con autenticación
      let result = await inventoryService?.deleteProductWithAuth(
        product?.id, 
        userProfile?.id, 
        pin
      );
      
      if (result?.error) {
        toast.error(`Error al eliminar producto: ${result?.error}`);
        setError(`Error deleting product: ${result?.error}`);
        throw new Error(result?.error);
      } else {
        toast.success(`Producto "${product?.name}" eliminado exitosamente`);
        setProducts(prev => prev?.filter(p => p?.id !== product?.id));
      }
    } catch (error) {
      console.error('Error eliminando producto:', error);
      throw error;
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      let result;
      
      console.log('handleSaveProduct - productData recibido:', productData);
      console.log('handleSaveProduct - userProfile:', userProfile);
      
      if (modalMode === 'create' || modalMode === 'duplicate') {
        // For creation, use the correct schema fields
        const createData = {
          sku: productData?.sku,
          color: productData?.color || '',
          marca_id: productData?.marca_id || null,
          grupo_id: productData?.grupo_id || null,
          descripcion_id: productData?.descripcion_id || null,
          sub_marca_id: productData?.sub_marca_id || null,
          precio: parseFloat(productData?.precio || 0),
          stock: parseInt(productData?.stock || 0),
          creado_por_id: productData?.creado_por_id || userProfile?.id
        };
        
        console.log('handleSaveProduct - createData final:', createData);
        result = await inventoryService?.createProduct(createData);
      } else if (modalMode === 'edit') {
        const updateData = {
          sku: productData?.sku,
          color: productData?.color || '',
          marca_id: productData?.marca_id || null,
          grupo_id: productData?.grupo_id || null,
          descripcion_id: productData?.descripcion_id || null,
          sub_marca_id: productData?.sub_marca_id || null,
          precio: parseFloat(productData?.precio || 0),
          stock: parseInt(productData?.stock || 0),
          creado_por_id: productData?.creado_por_id || userProfile?.id
        };
        
        console.log('handleSaveProduct - updateData final:', updateData);
        console.log('handleSaveProduct - creado_por_id específicamente:', updateData.creado_por_id);
        result = await inventoryService?.updateProduct(selectedProduct?.id, updateData);
      }

      if (result?.error) {
        toast.error(`Error al guardar producto: ${result?.error}`);
      } else {
        // Reload products to get fresh data
        const productsResult = await inventoryService?.getProducts();
        if (!productsResult?.error) {
          setProducts(productsResult?.data || []);
        }
        setIsModalOpen(false);
        
        // Show success message
        if (modalMode === 'create' || modalMode === 'duplicate') {
          toast.success('Producto creado exitosamente');
        } else {
          toast.success('Producto actualizado exitosamente');
        }
      }
    } catch (err) {
      toast.error('Error al guardar el producto');
    }
  };

  const handleReorder = (product, quantity) => {
    // Mock reorder functionality - would integrate with supplier system
    console.log(`Reordering ${quantity} units of ${product?.name}`);
    alert(`Orden de reposición creada para ${product?.name} (${quantity} unidades)`);
  };

  const handleUpdateStock = async (productId, newStock) => {
    try {
      let result = await inventoryService?.updateStock(
        productId, 
        newStock, 
        userProfile?.id, 
        'Ajuste Manual'
      );
      
      if (result?.error) {
        setError(`Error updating stock: ${result?.error}`);
      } else {
        // Update local state
        setProducts(prev => prev?.map(p => 
          p?.id === productId 
            ? { ...p, stock: newStock }
            : p
        ));
      }
    } catch (err) {
      setError('Failed to update stock');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gestión de Inventario - Ópticas Kairoz</title>
        <meta name="description" content="Gestiona el inventario de productos ópticos con operaciones CRUD completas" />
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

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Gestión de Inventario
              </h1>
              <p className="text-muted-foreground mt-2">
                Administra productos, stock y proveedores de manera eficiente
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                iconName="Plus"
                onClick={handleAddProduct}
                size="lg"
              >
                Agregar Producto
              </Button>
            </div>
          </div>

          {/* Filters */}
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
            brands={brands}
            groups={groups}
            descriptions={descriptions}
            subBrands={subBrands}
            resultCount={totalProducts}
            totalUnits={totalUnits}
          />

          {/* Products Table */}
          <ProductTable
            products={paginatedProducts}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            sortConfig={sortConfig}
            onSort={handleSort}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-card rounded-lg border border-border p-4 shadow-soft">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalProducts)} de {totalProducts} productos
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-10 h-10"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Product Modal */}
          <ProductModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            product={selectedProduct}
            onSave={handleSaveProduct}
            mode={modalMode}
            brands={brands}
            groups={groups}
            descriptions={descriptions}
            subBrands={subBrands}
            userProfile={userProfile}
          />
        </main>
      </div>
    </>
  );
};

export default InventoryManagement;