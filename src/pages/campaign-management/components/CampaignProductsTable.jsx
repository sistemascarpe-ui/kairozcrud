import React, { useState, useEffect } from 'react';
import { Package, Search } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../../components/ui/Button';
import { inventoryService } from '../../../services/inventoryService';
import { useAuth } from '../../../contexts/AuthContext';

const CampaignProductsTable = ({ campaign }) => {
  const { userProfile } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  

  // Cargar productos de la campaña
  useEffect(() => {
    if (campaign?.id) {
      loadCampaignProducts();
    }
  }, [campaign?.id]);

  const loadCampaignProducts = async () => {
    try {
      setLoading(true);
      const result = await inventoryService.getProductsSummary(1000, 0, { location: 'campana' }, { key: 'created_at', direction: 'desc' });
      
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

  

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'enviado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'devuelto':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'vendido':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (estado) => {
    switch (estado) {
      case 'enviado':
        return 'Enviado';
      case 'devuelto':
        return 'Devuelto';
      case 'vendido':
        return 'Vendido';
      default:
        return estado;
    }
  };

  const filteredProducts = products.filter(product =>
    product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product?.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product?.marcas?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!campaign) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              Productos Enviados a la Campaña
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Productos con ubicación "Campaña" en inventario
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Total: {products.length} producto(s)
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Búsqueda */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos por SKU, color o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Tabla de productos */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Cargando productos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">
              {searchTerm ? 'No se encontraron productos con ese criterio' : 'No hay productos con ubicación Campaña'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product?.sku}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{product?.marcas?.nombre || 'Sin marca'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{product?.color || 'Sin color'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${product?.precio}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{product?.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
    </div>
  );
};

export default CampaignProductsTable;
