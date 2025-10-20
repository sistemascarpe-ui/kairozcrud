import React, { useState, useMemo, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import DeleteConfirmModal from './DeleteConfirmModal';

const ProductTable = ({ 
  products, 
  onEdit, 
  onDelete,
  sortConfig,
  onSort 
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const topScrollRef = useRef(null);
  const tableScrollRef = useRef(null);
  const [tableWidth, setTableWidth] = useState(0);

  // Calcular el ancho de la tabla y actualizar el scroll superior
  useEffect(() => {
    if (tableScrollRef.current) {
      const scrollWidth = tableScrollRef.current.scrollWidth;
      setTableWidth(scrollWidth);
    }
  }, [products]);

  // Sincronizar scroll superior con scroll de la tabla
  useEffect(() => {
    const topScroll = topScrollRef.current;
    const tableScroll = tableScrollRef.current;

    if (!topScroll || !tableScroll) return;

    const handleTopScroll = (e) => {
      if (tableScroll.scrollLeft !== topScroll.scrollLeft) {
        tableScroll.scrollLeft = topScroll.scrollLeft;
      }
    };

    const handleTableScroll = (e) => {
      if (topScroll.scrollLeft !== tableScroll.scrollLeft) {
        topScroll.scrollLeft = tableScroll.scrollLeft;
      }
    };

    topScroll.addEventListener('scroll', handleTopScroll);
    tableScroll.addEventListener('scroll', handleTableScroll);

    return () => {
      topScroll.removeEventListener('scroll', handleTopScroll);
      tableScroll.removeEventListener('scroll', handleTableScroll);
    };
  }, [tableWidth]);

  const toggleRowExpansion = (productId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded?.has(productId)) {
      newExpanded?.delete(productId);
    } else {
      newExpanded?.add(productId);
    }
    setExpandedRows(newExpanded);
  };

  const getSortIcon = (column) => {
    if (sortConfig?.key !== column) {
      return 'ArrowUpDown';
    }
    return sortConfig?.direction === 'asc' ? 'ArrowUp' : 'ArrowDown';
  };

  const getStockStatusColor = (stock) => {
    if (stock === 0) return 'text-error bg-error/10';
    return 'text-success bg-success/10';
  };

  const getStockStatusText = (stock) => {
    if (stock === 0) return 'Agotado';
    return 'En Stock';
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (pin) => {
    if (!productToDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(productToDelete, pin);
      setDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error eliminando producto:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price || 0);
    // Verificar si el precio tiene decimales
    const hasDecimals = numPrice % 1 !== 0;
    
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: hasDecimals ? 2 : 0
    }).format(numPrice);
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-soft overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block">
        {/* Scroll horizontal superior */}
        <div 
          ref={topScrollRef}
          className="overflow-x-auto overflow-y-hidden border-b border-border bg-muted/30"
          style={{ height: '20px' }}
        >
          <div style={{ width: `${tableWidth}px`, height: '1px' }}></div>
        </div>
        
        {/* Tabla principal */}
        <div ref={tableScrollRef} className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left">Acciones</th>
              {[
                { key: 'sku', label: 'Modelo', sortable: false },
                { key: 'marca', label: 'Marca', sortable: false },
                { key: 'price', label: 'Precio', sortable: true },
                { key: 'stock', label: 'Cantidad', sortable: true },
                { key: 'color', label: 'Color', sortable: false },
                { key: 'grupo', label: 'Grupo', sortable: false },
                { key: 'descripcion', label: 'Descripción', sortable: false },
                { key: 'sub_marca', label: 'Sub Marca', sortable: false },
                { key: 'creado_por', label: 'Usuario Creador', sortable: false }
              ]?.map((column) => (
                <th key={column?.key} className="px-4 py-3 text-left">
                  {column?.sortable ? (
                    <button
                      onClick={() => onSort(column?.key)}
                      className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-smooth"
                    >
                      <span>{column?.label}</span>
                      <Icon name={getSortIcon(column?.key)} size={14} />
                    </button>
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      {column?.label}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products?.map((product) => (
              <tr key={product?.id} className="hover:bg-muted/30 transition-smooth">
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Edit"
                      onClick={() => onEdit(product)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Trash2"
                      onClick={() => handleDeleteClick(product)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Eliminar
                    </Button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      {product?.sku}
                    </span>
                    {product?.hasBeenEdited && (
                      <div 
                        className="w-2 h-2 bg-amber-400 rounded-full" 
                        title="Este producto ha sido editado"
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-foreground">{product?.brand}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium text-foreground">
                    {formatPrice(product?.price)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{product?.stock}</span>
                      {product?.cantidad_en_campanas > 0 && (
                        <span className="text-xs text-purple-600 font-medium">
                          {product.cantidad_en_campanas} en campañas
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(product?.stock)}`}>
                        {getStockStatusText(product?.stock)}
                      </span>
                      {product?.cantidad_en_campanas > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          En Campañas
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-foreground">{product?.color || 'Sin color'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-foreground">{product?.category}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-foreground">{product?.description}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-foreground">{product?.supplier}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-foreground">{product?.createdBy || 'No especificado'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-border">
        {products?.map((product) => (
          <div key={product?.id} className="p-3">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-foreground text-base">{product?.sku}</h3>
                  {product?.hasBeenEdited && (
                    <div 
                      className="w-2 h-2 bg-amber-400 rounded-full" 
                      title="Este producto ha sido editado"
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{product?.brand || 'Sin marca'}</p>
                <p className="text-xs text-muted-foreground">{product?.color || 'Sin color'}</p>
              </div>
              <button
                onClick={() => toggleRowExpansion(product?.id)}
                className="p-2 hover:bg-muted rounded-md transition-smooth flex-shrink-0"
              >
                <Icon 
                  name={expandedRows?.has(product?.id) ? 'ChevronUp' : 'ChevronDown'} 
                  size={16} 
                  className="text-muted-foreground" 
                />
              </button>
            </div>

            {/* Información principal en grid compacto */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Precio</span>
                <span className="font-semibold text-sm text-foreground">
                  {formatPrice(product?.price)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Stock</span>
                <div className="flex flex-col space-y-1">
                  <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs font-medium w-fit ${getStockStatusColor(product?.stock)}`}>
                    {product?.stock}
                  </span>
                  {product?.cantidad_en_campanas > 0 && (
                    <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium w-fit bg-purple-100 text-purple-800">
                      {product.cantidad_en_campanas} en campañas
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Grupo:</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                {product?.category || 'Sin grupo'}
              </span>
            </div>

            {/* Botones de acción compactos */}
            <div className="flex space-x-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                iconName="Edit"
                onClick={() => onEdit(product)}
                className="flex-1 text-xs py-1"
              >
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconName="Trash2"
                onClick={() => handleDeleteClick(product)}
                className="flex-1 text-xs py-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Eliminar
              </Button>
            </div>

            {/* Información expandible compacta */}
            {expandedRows?.has(product?.id) && (
              <div className="pt-2 border-t border-border">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descripción:</span>
                    <span className="font-medium text-foreground text-right max-w-[65%] truncate">
                      {product?.description || 'Sin descripción'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sub Marca:</span>
                    <span className="font-medium text-foreground truncate">
                      {product?.supplier || 'Sin sub marca'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creado por:</span>
                    <span className="font-medium text-foreground truncate">
                      {product?.createdBy || 'No especificado'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {products?.length === 0 && (
        <div className="p-12 text-center">
          <Icon name="Package" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No se encontraron productos
          </h3>
          <p className="text-muted-foreground">
            Ajusta los filtros o agrega nuevos productos al inventario
          </p>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        productName={productToDelete?.sku || productToDelete?.name || 'Producto'}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ProductTable;