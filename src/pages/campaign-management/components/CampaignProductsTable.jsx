import React, { useState, useEffect } from 'react';
import { Package, ArrowRight, ArrowLeft, Search, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../../components/ui/Button';
import { campaignService } from '../../../services/campaignService';
import { useAuth } from '../../../contexts/AuthContext';

const CampaignProductsTable = ({ campaign }) => {
  const { userProfile } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnObservations, setReturnObservations] = useState('');

  // Cargar productos de la campaña
  useEffect(() => {
    if (campaign?.id) {
      loadCampaignProducts();
    }
  }, [campaign?.id]);

  const loadCampaignProducts = async () => {
    try {
      setLoading(true);
      const result = await campaignService.getCampaignProducts(campaign.id);
      
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

  const handleReturnProduct = async () => {
    if (!selectedProduct || returnQuantity <= 0) {
      toast.error('Selecciona una cantidad válida para devolver');
      return;
    }

    const availableQuantity = selectedProduct.cantidad_enviada - (selectedProduct.cantidad_devuelta || 0);
    if (returnQuantity > availableQuantity) {
      toast.error(`No puedes devolver más cantidad de la disponible (${availableQuantity})`);
      return;
    }

    try {
      const result = await campaignService.returnProductFromCampaign(
        selectedProduct.id,
        returnQuantity,
        returnObservations || `Devolución realizada por ${userProfile?.nombre} el ${new Date().toLocaleString('es-ES')}`
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${returnQuantity} unidad(es) devuelta(s) exitosamente`);
        setReturnModalOpen(false);
        setSelectedProduct(null);
        setReturnQuantity(1);
        setReturnObservations('');
        loadCampaignProducts(); // Recargar la lista
      }
    } catch (error) {
      toast.error('Error inesperado al devolver producto');
      console.error('Error:', error);
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
    product.armazones?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.armazones?.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.armazones?.marcas?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
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
              Productos enviados desde el inventario a esta campaña
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
              {searchTerm ? 'No se encontraron productos con ese criterio' : 'No hay productos enviados a esta campaña'}
            </p>
            {!searchTerm && (
              <p className="text-xs text-gray-400 mt-1">
                Usa el botón "Enviar Productos" para agregar productos desde el inventario
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad Enviada
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cantidad Devuelta
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disponible
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Envío
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const availableQuantity = product.cantidad_enviada - (product.cantidad_devuelta || 0);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.armazones?.sku}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.armazones?.color} - {product.armazones?.marcas?.nombre}
                          </div>
                          <div className="text-xs text-gray-400">
                            ${product.armazones?.precio}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.cantidad_enviada}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.cantidad_devuelta || 0}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`font-medium ${availableQuantity > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                          {availableQuantity}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(product.estado)}`}>
                          {getStatusText(product.estado)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(product.fecha_envio).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {availableQuantity > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setReturnQuantity(Math.min(1, availableQuantity));
                              setReturnModalOpen(true);
                            }}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Devolver
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para devolver productos */}
      {returnModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ArrowLeft className="h-5 w-5 mr-2 text-orange-600" />
                Devolver Producto
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReturnModalOpen(false)}
              >
                ✕
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{selectedProduct.armazones?.sku}</h4>
                <p className="text-sm text-gray-600">{selectedProduct.armazones?.color} - {selectedProduct.armazones?.marcas?.nombre}</p>
                <p className="text-sm text-gray-500">
                  Disponible para devolver: {selectedProduct.cantidad_enviada - (selectedProduct.cantidad_devuelta || 0)} unidades
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad a devolver
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct.cantidad_enviada - (selectedProduct.cantidad_devuelta || 0)}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={returnObservations}
                  onChange={(e) => setReturnObservations(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Motivo de la devolución..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => setReturnModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleReturnProduct}
                className="flex items-center bg-orange-600 hover:bg-orange-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Devolver {returnQuantity} Unidad(es)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignProductsTable;
