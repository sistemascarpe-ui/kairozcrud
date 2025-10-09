import React from 'react';
import { Package } from 'lucide-react';

const OutOfStockAlert = ({ product }) => {
  if (!product) return null;

  return (
    <div className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
      <div className="flex items-center space-x-3">
        <Package className="h-5 w-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="font-medium text-gray-900">{product.sku || product.name}</p>
          <p className="text-sm text-gray-600">
            {product.marcas?.nombre || product.brand || 'Sin marca'} - {product.color || 'N/A'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold text-red-600">
          Stock: {product.stock || 0}
        </span>
        {product.precio && (
          <p className="text-xs text-gray-500">
            ${product.precio.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default OutOfStockAlert;