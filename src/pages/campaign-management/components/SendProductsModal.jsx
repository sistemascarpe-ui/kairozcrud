import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

import Button from '../../../components/ui/Button';
import { campaignService } from '../../../services/campaignService';
import { inventoryService } from '../../../services/inventoryService';
import { useAuth } from '../../../contexts/AuthContext';

const SendProductsModal = ({ isOpen, onClose, campaign }) => {
  const { userProfile } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);

  // Cargar productos del inventario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const result = await inventoryService.getProducts();
      
      if (result.error) {
        toast.error(`Error al cargar productos: ${result.error}`);
      } else {
        // Filtrar solo productos con stock disponible
        const productsWithStock = (result.data || []).filter(product => product.stock > 0);
        setProducts(productsWithStock);
      }
    } catch (error) {
      toast.error('Error inesperado al cargar productos');
      console.error('Error:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    const numQuantity = parseInt(quantity) || 0;
    const product = products.find(p => p.id === productId);
    
    if (numQuantity > product.stock) {
      toast.error(`No puedes enviar más cantidad del stock disponible (${product.stock})`);
      return;
    }

    setSelectedProducts(prev => ({
      ...prev,
      [productId]: numQuantity
    }));
  };

  const handleSendProducts = async () => {
    const productsToSend = Object.entries(selectedProducts)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({
        id: productId,
        quantity
      }));

    if (productsToSend.length === 0) {
      toast.error('Selecciona al menos un producto para enviar');
      return;
    }

    try {
      setSending(true);
      
      // Enviar cada producto individualmente
      for (const { id: productId, quantity } of productsToSend) {
        const result = await campaignService.sendProductToCampaign(
          campaign.id,
          productId,
          quantity,
          userProfile?.id,
          `Enviado desde inventario - ${new Date().toLocaleString('es-ES')}`
        );

        if (result.error) {
          toast.error(`Error enviando producto: ${result.error}`);
          return;
        }
      }

      toast.success(`${productsToSend.length} producto(s) enviado(s) exitosamente`);
      setSelectedProducts({});
      onClose();
    } catch (error) {
      toast.error('Error inesperado al enviar productos');
      console.error('Error:', error);
    } finally {
      setSending(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.marca?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = Object.values(selectedProducts).reduce((sum, qty) => sum + qty, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Package className="h-5 w-5 mr-2 text-blue-600" />
            Enviar Productos a Campaña
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900">{campaign?.nombre}</h3>
              <p className="text-sm text-blue-700">{campaign?.empresa}</p>
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos por SKU, color o marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Lista de productos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">
                  Productos Disponibles ({filteredProducts.length})
                </h3>
                {totalProducts > 0 && (
                  <span className="text-sm text-blue-600 font-medium">
                    {totalProducts} producto(s) seleccionado(s)
                  </span>
                )}
              </div>
              
              {loadingProducts ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Cargando productos...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">
                    {searchTerm ? 'No se encontraron productos con ese criterio' : 'No hay productos con stock disponible'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-medium text-gray-900">
                            {product.sku}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.color}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.marca?.nombre}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${product.precio}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Stock disponible: {product.stock}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max={product.stock}
                          value={selectedProducts[product.id] || 0}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                        <span className="text-xs text-gray-500">unidades</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Información importante */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-900 mb-1">
                    Información Importante:
                  </h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Los productos enviados se descontarán del stock del inventario</li>
                    <li>• Solo se pueden enviar productos con stock disponible</li>
                    <li>• Los productos se marcarán como "enviado" en la campaña</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {totalProducts > 0 && (
              <span>
                Total a enviar: <strong>{totalProducts} producto(s)</strong>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={sending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendProducts}
              disabled={totalProducts === 0 || sending}
              className="flex items-center"
            >
              <Package className="h-4 w-4 mr-2" />
              {sending ? 'Enviando...' : `Enviar ${totalProducts} Producto(s)`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendProductsModal;
